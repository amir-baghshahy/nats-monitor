package infrastructure

import (
	"context"
	"fmt"

	"github.com/nats-io/nats.go"
	"nats-monitoring/internal/domain"
)

// NATSMessageRepository implements MessageRepository using NATS JetStream
type NATSMessageRepository struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewNATSMessageRepository creates a new NATS message repository
func NewNATSMessageRepository(nc *nats.Conn, js nats.JetStreamContext) *NATSMessageRepository {
	return &NATSMessageRepository{nc: nc, js: js}
}

// Publish publishes a message to a subject
func (r *NATSMessageRepository) Publish(ctx context.Context, subject string, data []byte) error {
	return r.nc.Publish(subject, data)
}

// PublishToStream publishes a message to a stream
func (r *NATSMessageRepository) PublishToStream(ctx context.Context, streamName string, data []byte) error {
	_, err := r.js.Publish(streamName, data)
	return err
}

// Delete deletes a message from a stream
func (r *NATSMessageRepository) Delete(ctx context.Context, streamName string, sequence uint64) error {
	return r.js.DeleteMsg(streamName, sequence)
}

// Get gets a message from a stream
func (r *NATSMessageRepository) Get(ctx context.Context, streamName string, sequence uint64) (*domain.Message, error) {
	msg, err := r.js.GetMsg(streamName, sequence)
	if err != nil {
		return nil, err
	}

	headers := make(map[string][]string)
	for k, v := range msg.Header {
		headers[k] = v
	}

	return &domain.Message{
		Subject:   msg.Subject,
		Sequence:  msg.Sequence,
		Data:      msg.Data,
		Headers:   headers,
		Timestamp: msg.Time,
	}, nil
}

// List lists messages from a stream
func (r *NATSMessageRepository) List(ctx context.Context, streamName string, filter domain.MessageFilter) ([]*domain.Message, error) {
	streamInfo, err := r.js.StreamInfo(streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream info: %w", err)
	}

	messages := make([]*domain.Message, 0)
	lastSeq := streamInfo.State.LastSeq

	// Calculate start sequence
	startSeq := lastSeq
	if filter.Sequence > 0 {
		startSeq = filter.Sequence
	} else if lastSeq > 25 {
		startSeq = lastSeq - 24
	} else {
		startSeq = 1
	}

	// Determine limit
	limit := filter.Limit
	if limit <= 0 {
		limit = 25
	}

	count := 0
	for i := startSeq; i <= lastSeq && count < limit; i++ {
		msg, err := r.js.GetMsg(streamName, i)
		if err != nil {
			continue
		}

		headers := make(map[string][]string)
		for k, v := range msg.Header {
			headers[k] = v
		}

		messages = append(messages, &domain.Message{
			Subject:   msg.Subject,
			Sequence:  msg.Sequence,
			Data:      msg.Data,
			Headers:   headers,
			Timestamp: msg.Time,
		})
		count++
	}

	return messages, nil
}
