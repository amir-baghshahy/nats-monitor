package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/constants"
	"github.com/amir-baghshahy/nats-horizon/internal/models"
	"github.com/amir-baghshahy/nats-horizon/internal/utils"
	"github.com/nats-io/nats.go"
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

func (r *NATSConsumerRepository) List(ctx context.Context, streamName string) ([]*models.Consumer, error) {
	subject := fmt.Sprintf("$JS.API.CONSUMER.LIST.%s", streamName)
	msg, err := r.nc.Request(subject, []byte{}, 2*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to list consumers: %w", err)
	}

	var response consumerListResponse
	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse consumer list: %w", err)
	}

	consumers := make([]*models.Consumer, len(response.Consumers))
	for i, c := range response.Consumers {
		consumers[i] = &models.Consumer{
			Name:          c.Name,
			Stream:        streamName,
			Status:        "active",
			NumPending:    c.State.NumPending,
			Durable:       c.Config.Durable != "",
			AckPolicy:     utils.AckPolicyToString(c.Config.AckPolicy),
			DeliverPolicy: utils.DeliverPolicyToString(c.Config.DeliverPolicy),
			ReplayPolicy:  utils.ReplayPolicyToString(c.Config.ReplayPolicy),
			MaxDeliver:    c.Config.MaxDeliver,
			Paused:        c.Config.MaxDeliver == constants.PauseSentinel,
		}
	}

	return consumers, nil
}

func (r *NATSConsumerRepository) Get(ctx context.Context, streamName, name string) (*models.Consumer, error) {
	info, err := r.js.ConsumerInfo(streamName, name)
	if err != nil {
		return nil, fmt.Errorf("failed to get consumer: %w", err)
	}

	return r.toDomainConsumer(info, streamName), nil
}

func (r *NATSConsumerRepository) Create(ctx context.Context, streamName string, consumer *models.Consumer) (*models.Consumer, error) {
	cfg := r.toNATSConsumerConfig(consumer)

	info, err := r.js.AddConsumer(streamName, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %w", err)
	}

	return r.toDomainConsumer(info, streamName), nil
}

func (r *NATSConsumerRepository) Update(ctx context.Context, streamName string, consumer *models.Consumer) (*models.Consumer, error) {
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

func (r *NATSConsumerRepository) ResetLag(ctx context.Context, req *models.LagResetRequest) error {
	info, err := r.js.ConsumerInfo(req.StreamName, req.ConsumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	if err := r.js.DeleteConsumer(req.StreamName, req.ConsumerName); err != nil {
		return fmt.Errorf("failed to delete consumer: %w", err)
	}

	info.Config.DeliverPolicy = nats.DeliverByStartSequencePolicy
	if req.Sequence > 0 {
		info.Config.OptStartSeq = req.Sequence
	} else {
		// default: start from the latest sequence (skip all pending)
		streamInfo, err := r.js.StreamInfo(req.StreamName)
		if err == nil {
			info.Config.OptStartSeq = streamInfo.State.LastSeq + 1
		}
	}

	_, err = r.js.AddConsumer(req.StreamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to recreate consumer: %w", err)
	}

	return nil
}

func (r *NATSConsumerRepository) Replay(ctx context.Context, req *models.ReplayRequest) (string, error) {
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

func (r *NATSConsumerRepository) Pause(ctx context.Context, req *models.PauseRequest) error {
	info, err := r.js.ConsumerInfo(req.StreamName, req.ConsumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	originalMaxDeliver := info.Config.MaxDeliver
	info.Config.MaxDeliver = constants.PauseSentinel

	_, err = r.js.UpdateConsumer(req.StreamName, &info.Config)
	if err != nil {
		info.Config.MaxDeliver = originalMaxDeliver
		return fmt.Errorf("failed to pause consumer: %w", err)
	}

	return nil
}

func (r *NATSConsumerRepository) Resume(ctx context.Context, req *models.ResumeRequest) error {
	info, err := r.js.ConsumerInfo(req.StreamName, req.ConsumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	if info.Config.MaxDeliver != constants.PauseSentinel {
		return nil
	}

	info.Config.MaxDeliver = constants.DefaultMaxDeliver

	_, err = r.js.UpdateConsumer(req.StreamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to resume consumer: %w", err)
	}

	return nil
}

func (r *NATSConsumerRepository) toDomainConsumer(info *nats.ConsumerInfo, streamName string) *models.Consumer {
	return &models.Consumer{
		Name:          info.Name,
		Stream:        streamName,
		Status:        "active",
		NumPending:    info.NumPending,
		Durable:       info.Config.Durable != "",
		AckPolicy:     utils.AckPolicyToString(int(info.Config.AckPolicy)),
		DeliverPolicy: utils.DeliverPolicyToString(int(info.Config.DeliverPolicy)),
		ReplayPolicy:  utils.ReplayPolicyToString(int(info.Config.ReplayPolicy)),
		MaxDeliver:    int(info.Config.MaxDeliver),
		Paused:        info.Config.MaxDeliver == constants.PauseSentinel,
	}
}

func (r *NATSConsumerRepository) toNATSConsumerConfig(consumer *models.Consumer) *nats.ConsumerConfig {
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

// AckMessage acknowledges a message by fetching it from the stream and sending
// the ack to the real reply-to address embedded in the delivered message.
// Constructing the ack subject manually from stream/consumer/seq does not work —
// the real reply-to contains additional fields (delivery count, timestamps, domain).
func (r *NATSConsumerRepository) AckMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	return r.sendAck(ctx, streamName, consumerName, sequence, nil)
}

// NackMessage negative-acknowledges a message so NATS redelivers it.
func (r *NATSConsumerRepository) NackMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	return r.sendAck(ctx, streamName, consumerName, sequence, []byte("-NA"))
}

// TerminateMessage terminates a message so NATS stops redelivering it.
func (r *NATSConsumerRepository) TerminateMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	return r.sendAck(ctx, streamName, consumerName, sequence, []byte("+TERM"))
}

// sendAck fetches the message at sequence from the stream, then publishes payload
// to msg.Reply (the real JetStream ack subject embedded in the delivered message).
func (r *NATSConsumerRepository) sendAck(ctx context.Context, streamName, consumerName string, sequence uint64, payload []byte) error {
	// Create a temporary ephemeral consumer starting at the target sequence
	// so we can retrieve the delivered message and its real reply-to address.
	ephemeralCfg := &nats.ConsumerConfig{
		DeliverPolicy: nats.DeliverByStartSequencePolicy,
		OptStartSeq:   sequence,
		AckPolicy:     nats.AckExplicitPolicy,
		MaxDeliver:    1,
	}
	info, err := r.js.AddConsumer(streamName, ephemeralCfg)
	if err != nil {
		return fmt.Errorf("failed to create ephemeral consumer for ack: %w", err)
	}
	defer r.js.DeleteConsumer(streamName, info.Name)

	sub, err := r.js.PullSubscribe("", info.Name, nats.Bind(streamName, info.Name))
	if err != nil {
		return fmt.Errorf("failed to subscribe to ephemeral consumer: %w", err)
	}
	defer sub.Unsubscribe()

	msgs, err := sub.Fetch(1, nats.MaxWait(3*time.Second))
	if err != nil || len(msgs) == 0 {
		return fmt.Errorf("message sequence %d not found in stream %s", sequence, streamName)
	}

	msg := msgs[0]
	if msg.Reply == "" {
		return fmt.Errorf("message has no reply-to address; cannot ack")
	}
	return r.nc.Publish(msg.Reply, payload)
}

// GetPendingMessages returns pending messages for a consumer without affecting
// the consumer's delivery state. It reads messages directly from the stream
// using GetMsg, starting from the consumer's AckFloor sequence.
func (r *NATSConsumerRepository) GetPendingMessages(ctx context.Context, streamName, consumerName string, limit int) ([]*models.Message, error) {
	info, err := r.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		return nil, fmt.Errorf("failed to get consumer info: %w", err)
	}

	if limit <= 0 || limit > 100 {
		limit = 100
	}

	startSeq := info.AckFloor.Stream + 1
	lastSeq := info.NumPending + info.AckFloor.Stream

	messages := make([]*models.Message, 0, limit)
	for seq := startSeq; seq <= lastSeq && len(messages) < limit; seq++ {
		raw, err := r.js.GetMsg(streamName, seq)
		if err != nil {
			continue
		}

		headers := make(map[string][]string)
		for k, v := range raw.Header {
			headers[k] = v
		}

		messages = append(messages, &models.Message{
			Subject:   raw.Subject,
			Sequence:  raw.Sequence,
			Data:      raw.Data,
			Headers:   headers,
			Timestamp: raw.Time,
		})
	}

	return messages, nil
}
