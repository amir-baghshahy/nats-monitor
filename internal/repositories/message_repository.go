package repositories

import (
	"context"
	"fmt"
	"sync"

	"github.com/amir-baghshahy/nats-monitor/internal/models"
	"github.com/nats-io/nats.go"
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

// PublishToStream publishes a message to a NATS JetStream subject
func (r *NATSMessageRepository) PublishToStream(ctx context.Context, subject string, data []byte) error {
	_, err := r.js.Publish(subject, data)
	return err
}

// Delete deletes a message from a stream
func (r *NATSMessageRepository) Delete(ctx context.Context, streamName string, sequence uint64) error {
	return r.js.DeleteMsg(streamName, sequence)
}

// Get gets a message from a stream
func (r *NATSMessageRepository) Get(ctx context.Context, streamName string, sequence uint64) (*models.Message, error) {
	msg, err := r.js.GetMsg(streamName, sequence)
	if err != nil {
		return nil, err
	}

	headers := make(map[string][]string)
	for k, v := range msg.Header {
		headers[k] = v
	}

	return &models.Message{
		Subject:   msg.Subject,
		Sequence:  msg.Sequence,
		Data:      msg.Data,
		Headers:   headers,
		Timestamp: msg.Time,
	}, nil
}

// List lists messages from a stream
func (r *NATSMessageRepository) List(ctx context.Context, streamName string, filter models.MessageFilter) ([]*models.Message, error) {
	streamInfo, err := r.js.StreamInfo(streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream info: %w", err)
	}

	messages := make([]*models.Message, 0)
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

	// Determine the sequence range to fetch.
	endSeq := startSeq + uint64(limit) - 1
	if endSeq > lastSeq {
		endSeq = lastSeq
	}

	type result struct {
		seq uint64
		msg *models.Message
	}

	// Bounded goroutine pool: at most 8 concurrent NATS round-trips.
	const maxWorkers = 8
	seqCh := make(chan uint64, limit)
	resCh := make(chan result, limit)

	// Fill the work queue.
	for seq := startSeq; seq <= endSeq; seq++ {
		seqCh <- seq
	}
	close(seqCh)

	var wg sync.WaitGroup
	workers := maxWorkers
	if int(endSeq-startSeq+1) < workers {
		workers = int(endSeq - startSeq + 1)
	}
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for seq := range seqCh {
				// Honour context cancellation before each round-trip.
				if ctx.Err() != nil {
					return
				}
				msg, err := r.js.GetMsg(streamName, seq)
				if err != nil {
					continue
				}
				headers := make(map[string][]string)
				for k, v := range msg.Header {
					headers[k] = v
				}
				resCh <- result{
					seq: seq,
					msg: &models.Message{
						Subject:   msg.Subject,
						Sequence:  msg.Sequence,
						Data:      msg.Data,
						Headers:   headers,
						Timestamp: msg.Time,
					},
				}
			}
		}()
	}

	// Close resCh once all workers finish.
	go func() {
		wg.Wait()
		close(resCh)
	}()

	// Collect results; preserve sequence order via a map then sort.
	resultMap := make(map[uint64]*models.Message, limit)
	for r := range resCh {
		resultMap[r.seq] = r.msg
	}

	// If the context was cancelled, surface the error.
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	for seq := startSeq; seq <= endSeq; seq++ {
		if m, ok := resultMap[seq]; ok {
			messages = append(messages, m)
		}
	}

	return messages, nil
}
