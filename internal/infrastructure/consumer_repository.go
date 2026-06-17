package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"nats-monitoring/internal/domain"
)

// NATSConsumerRepository implements ConsumerRepository using NATS JetStream
type NATSConsumerRepository struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewNATSConsumerRepository creates a new NATS consumer repository
func NewNATSConsumerRepository(nc *nats.Conn, js nats.JetStreamContext) *NATSConsumerRepository {
	return &NATSConsumerRepository{nc: nc, js: js}
}

type consumerListResponse struct {
	Consumers []struct {
		Name   string `json:"name"`
		Config struct {
			Durable       string `json:"durable"`
			AckPolicy     int    `json:"ack_policy"`
			DeliverPolicy int    `json:"deliver_policy"`
			ReplayPolicy  int    `json:"replay_policy"`
			MaxDeliver    int    `json:"max_deliver"`
		} `json:"config"`
		State struct {
			NumPending uint64 `json:"num_pending"`
		} `json:"state"`
	} `json:"consumers"`
}

func policyToString(policy int) string {
	switch policy {
	case 0:
		return "none"
	case 1:
		return "all"
	case 2:
		return "explicit"
	default:
		return fmt.Sprintf("%d", policy)
	}
}

func deliverPolicyToString(policy int) string {
	switch policy {
	case 0:
		return "all"
	case 1:
		return "last"
	case 2:
		return "new"
	default:
		return fmt.Sprintf("%d", policy)
	}
}

func replayPolicyToString(policy int) string {
	switch policy {
	case 0:
		return "instant"
	case 1:
		return "original"
	default:
		return fmt.Sprintf("%d", policy)
	}
}

func (r *NATSConsumerRepository) List(ctx context.Context, streamName string) ([]*domain.Consumer, error) {
	subject := fmt.Sprintf("$JS.API.CONSUMER.LIST.%s", streamName)
	msg, err := r.nc.Request(subject, []byte{}, 2*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to list consumers: %w", err)
	}

	var response consumerListResponse
	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse consumer list: %w", err)
	}

	consumers := make([]*domain.Consumer, len(response.Consumers))
	for i, c := range response.Consumers {
		consumers[i] = &domain.Consumer{
			Name:          c.Name,
			Stream:        streamName,
			Status:        "active",
			NumPending:    c.State.NumPending,
			Durable:       c.Config.Durable != "",
			AckPolicy:     policyToString(c.Config.AckPolicy),
			DeliverPolicy: deliverPolicyToString(c.Config.DeliverPolicy),
			ReplayPolicy:  replayPolicyToString(c.Config.ReplayPolicy),
			MaxDeliver:    c.Config.MaxDeliver,
			Paused:        c.Config.MaxDeliver == 0,
		}
	}

	return consumers, nil
}

func (r *NATSConsumerRepository) Get(ctx context.Context, streamName, name string) (*domain.Consumer, error) {
	info, err := r.js.ConsumerInfo(streamName, name)
	if err != nil {
		return nil, fmt.Errorf("failed to get consumer: %w", err)
	}

	return r.toDomainConsumer(info, streamName), nil
}

func (r *NATSConsumerRepository) Create(ctx context.Context, streamName string, consumer *domain.Consumer) (*domain.Consumer, error) {
	cfg := r.toNATSConsumerConfig(consumer)

	info, err := r.js.AddConsumer(streamName, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %w", err)
	}

	return r.toDomainConsumer(info, streamName), nil
}

func (r *NATSConsumerRepository) Update(ctx context.Context, streamName string, consumer *domain.Consumer) (*domain.Consumer, error) {
	cfg := r.toNATSConsumerConfig(consumer)

	info, err := r.js.UpdateConsumer(streamName, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to update consumer: %w", err)
	}

	return r.toDomainConsumer(info, streamName), nil
}

func (r *NATSConsumerRepository) Delete(ctx context.Context, streamName, name string) error {
	if err := r.js.DeleteConsumer(streamName, name); err != nil {
		return fmt.Errorf("failed to delete consumer: %w", err)
	}
	return nil
}

func (r *NATSConsumerRepository) ResetLag(ctx context.Context, req *domain.LagResetRequest) error {
	info, err := r.js.ConsumerInfo(req.StreamName, req.ConsumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	if err := r.js.DeleteConsumer(req.StreamName, req.ConsumerName); err != nil {
		return fmt.Errorf("failed to delete consumer: %w", err)
	}

	info.Config.DeliverPolicy = nats.DeliverAllPolicy

	_, err = r.js.AddConsumer(req.StreamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to recreate consumer: %w", err)
	}

	return nil
}

func (r *NATSConsumerRepository) Replay(ctx context.Context, req *domain.ReplayRequest) (string, error) {
	replayID := fmt.Sprintf("replay-%s-%d", req.ConsumerName, time.Now().UnixNano())

	replayCfg := &nats.ConsumerConfig{
		Durable:        replayID,
		DeliverSubject: fmt.Sprintf("replays.%s", replayID),
		AckPolicy:      nats.AckExplicitPolicy,
		DeliverPolicy:  nats.DeliverAllPolicy,
		ReplayPolicy:   nats.ReplayInstantPolicy,
	}

	if req.FilterSubject != "" {
		replayCfg.FilterSubject = req.FilterSubject
	}
	if req.StartSequence > 0 {
		replayCfg.OptStartSeq = req.StartSequence
	}

	_, err := r.js.AddConsumer(req.StreamName, replayCfg)
	if err != nil {
		return "", fmt.Errorf("failed to create replay consumer: %w", err)
	}

	return replayID, nil
}

func (r *NATSConsumerRepository) Pause(ctx context.Context, req *domain.PauseRequest) error {
	info, err := r.js.ConsumerInfo(req.StreamName, req.ConsumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	info.Config.MaxDeliver = 0

	_, err = r.js.UpdateConsumer(req.StreamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to pause consumer: %w", err)
	}

	return nil
}

func (r *NATSConsumerRepository) Resume(ctx context.Context, req *domain.ResumeRequest) error {
	info, err := r.js.ConsumerInfo(req.StreamName, req.ConsumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	info.Config.MaxDeliver = -1

	_, err = r.js.UpdateConsumer(req.StreamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to resume consumer: %w", err)
	}

	return nil
}

func (r *NATSConsumerRepository) toDomainConsumer(info *nats.ConsumerInfo, streamName string) *domain.Consumer {
	return &domain.Consumer{
		Name:          info.Name,
		Stream:        streamName,
		Status:        "active",
		NumPending:    info.NumPending,
		Durable:       info.Config.Durable != "",
		AckPolicy:     policyToString(int(info.Config.AckPolicy)),
		DeliverPolicy: deliverPolicyToString(int(info.Config.DeliverPolicy)),
		ReplayPolicy:  replayPolicyToString(int(info.Config.ReplayPolicy)),
		MaxDeliver:    int(info.Config.MaxDeliver),
		Paused:        info.Config.MaxDeliver == 0,
	}
}

func (r *NATSConsumerRepository) toNATSConsumerConfig(consumer *domain.Consumer) *nats.ConsumerConfig {
	var ackPolicy nats.AckPolicy
	switch consumer.AckPolicy {
	case "explicit":
		ackPolicy = nats.AckExplicitPolicy
	case "none":
		ackPolicy = nats.AckNonePolicy
	default:
		ackPolicy = nats.AckExplicitPolicy
	}

	var deliverPolicy nats.DeliverPolicy
	switch consumer.DeliverPolicy {
	case "all":
		deliverPolicy = nats.DeliverAllPolicy
	case "last":
		deliverPolicy = nats.DeliverLastPolicy
	case "new":
		deliverPolicy = nats.DeliverNewPolicy
	default:
		deliverPolicy = nats.DeliverAllPolicy
	}

	return &nats.ConsumerConfig{
		Durable:       consumer.Name,
		AckPolicy:     ackPolicy,
		DeliverPolicy: deliverPolicy,
		MaxDeliver:    consumer.MaxDeliver,
	}
}

// AckMessage acknowledges a message
func (r *NATSConsumerRepository) AckMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	ackSubject := fmt.Sprintf("$JS.ACK.%s.%s.%d", streamName, consumerName, sequence)
	return r.nc.Publish(ackSubject, nil)
}

// NackMessage negative acknowledges a message
func (r *NATSConsumerRepository) NackMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	// Negative acknowledgment is done by publishing -NA to the ack subject
	ackSubject := fmt.Sprintf("$JS.ACK.%s.%s.%d", streamName, consumerName, sequence)
	return r.nc.Publish(ackSubject, []byte("-NA"))
}

// TerminateMessage terminates a message
func (r *NATSConsumerRepository) TerminateMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	// Termination is done by publishing +TERM to the ack subject
	ackSubject := fmt.Sprintf("$JS.ACK.%s.%s.%d", streamName, consumerName, sequence)
	return r.nc.Publish(ackSubject, []byte("+TERM"))
}

// GetPendingMessages returns pending messages for a consumer
func (r *NATSConsumerRepository) GetPendingMessages(ctx context.Context, streamName, consumerName string, limit int) ([]*domain.Message, error) {
	info, err := r.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		return nil, fmt.Errorf("failed to get consumer info: %w", err)
	}

	if info.Config.DeliverSubject != "" {
		return nil, fmt.Errorf("cannot get pending messages for push consumers")
	}

	// Get pending messages

	sub, err := r.js.PullSubscribe(info.Config.FilterSubject, info.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to create pull subscription: %w", err)
	}
	defer sub.Unsubscribe()

	messages := make([]*domain.Message, 0, limit)
	fetched := 0

	for fetched < limit && fetched < int(info.NumPending) {
		msg, err := sub.NextMsg(2 * time.Second)
		if err != nil {
			break // No more messages or timeout
		}

		meta, err := msg.Metadata()
		if err != nil {
			continue // Skip messages without metadata
		}

		headers := make(map[string][]string)
		for k, v := range msg.Header {
			headers[k] = v
		}

		messages = append(messages, &domain.Message{
			Subject:   msg.Subject,
			Sequence:  meta.Sequence.Stream,
			Data:      msg.Data,
			Headers:   headers,
			Timestamp: meta.Timestamp,
		})
		fetched++
	}

	return messages, nil
}
