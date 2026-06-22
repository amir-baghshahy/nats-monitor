package nats

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/constants"
	"github.com/nats-io/nats.go"
)

// ReplayOptions contains options for message replay
type ReplayOptions struct {
	StartSequence uint64
	EndSequence   uint64
	FilterSubject string
	StartTime     time.Time
	EndTime       time.Time
}

// Service wraps NATS connection and JetStream context
type Service struct {
	nc          *nats.Conn
	js          nats.JetStreamContext
	connected   bool
	mu          sync.RWMutex
	subscribers map[string]*nats.Subscription
}

// New creates a new NATS service
func New(url string) (*Service, error) {
	nc, err := nats.Connect(url,
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(10),
		nats.ReconnectWait(2*time.Second),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			log.Printf("NATS disconnected: %v", err)
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			log.Printf("NATS reconnected to %s", nc.ConnectedUrl())
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	// Get JetStream context
	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to get JetStream context: %w", err)
	}

	return &Service{
		nc:          nc,
		js:          js,
		connected:   true,
		subscribers: make(map[string]*nats.Subscription),
	}, nil
}

// Close closes the NATS connection
func (s *Service) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.connected {
		// Unsubscribe all active subscriptions
		for key, sub := range s.subscribers {
			if err := sub.Unsubscribe(); err != nil {
				log.Printf("Error unsubscribing %s: %v", key, err)
			}
		}
		s.subscribers = make(map[string]*nats.Subscription)

		s.nc.Close()
		s.connected = false
	}
}

// IsConnected returns whether the service is connected
func (s *Service) IsConnected() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.connected && s.nc != nil && s.nc.IsConnected()
}

// GetStreams returns all JetStream streams
func (s *Service) GetStreams() ([]*nats.StreamInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	// Use Streams() method to list all streams.
	// The v1 JetStreamContext API does not expose per-page errors through the
	// channel; nil entries signal an internal error. We collect all non-nil
	// entries and report if the channel was nil (option error).
	ch := s.js.Streams(nil)
	if ch == nil {
		return nil, fmt.Errorf("failed to start stream listing: invalid JetStream options")
	}

	var infos []*nats.StreamInfo
	for stream := range ch {
		if stream != nil {
			infos = append(infos, stream)
		}
	}

	return infos, nil
}

// GetStream returns info for a specific stream
func (s *Service) GetStream(name string) (*nats.StreamInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	return s.js.StreamInfo(name)
}

// CreateStream creates a new JetStream stream
func (s *Service) CreateStream(cfg *nats.StreamConfig) (*nats.StreamInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	return s.js.AddStream(cfg)
}

// UpdateStream updates an existing stream
func (s *Service) UpdateStream(cfg *nats.StreamConfig) (*nats.StreamInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	return s.js.UpdateStream(cfg)
}

// DeleteStream deletes a stream
func (s *Service) DeleteStream(name string) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	return s.js.DeleteStream(name)
}

// PurgeStream purges all messages from a stream
func (s *Service) PurgeStream(name string, subject string, sequence uint64) (uint64, error) {
	if !s.IsConnected() {
		return 0, fmt.Errorf("not connected to NATS")
	}

	// Purge stream
	err := s.js.PurgeStream(name, &nats.StreamPurgeRequest{
		Subject:  subject,
		Sequence: sequence,
	})
	if err != nil {
		return 0, fmt.Errorf("failed to purge stream: %w", err)
	}

	// Get stream info to return purged count
	info, err := s.js.StreamInfo(name)
	if err != nil {
		return 0, nil // Return 0 if we can't get info
	}

	return info.State.Msgs, nil
}

// GetConsumers returns all consumers for a stream
func (s *Service) GetConsumers(streamName string) ([]*nats.ConsumerInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	// Use Consumers() method to list all consumers
	var infos []*nats.ConsumerInfo
	for consumer := range s.js.Consumers(streamName, nil) {
		if consumer != nil {
			infos = append(infos, consumer)
		}
	}

	return infos, nil
}

// GetConsumer returns info for a specific consumer
func (s *Service) GetConsumer(streamName, consumerName string) (*nats.ConsumerInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	return s.js.ConsumerInfo(streamName, consumerName)
}

// CreateConsumer creates a new consumer
func (s *Service) CreateConsumer(streamName string, cfg *nats.ConsumerConfig) (*nats.ConsumerInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	return s.js.AddConsumer(streamName, cfg)
}

// UpdateConsumer updates an existing consumer
func (s *Service) UpdateConsumer(streamName string, cfg *nats.ConsumerConfig) (*nats.ConsumerInfo, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	return s.js.UpdateConsumer(streamName, cfg)
}

// DeleteConsumer deletes a consumer
func (s *Service) DeleteConsumer(streamName, consumerName string) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	return s.js.DeleteConsumer(streamName, consumerName)
}

// ResetConsumerLag resets consumer lag by advancing to a sequence
func (s *Service) ResetConsumerLag(streamName, consumerName string, sequence uint64) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	// Get current consumer config
	info, err := s.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	// Delete and recreate with new sequence
	if err := s.js.DeleteConsumer(streamName, consumerName); err != nil {
		return fmt.Errorf("failed to delete consumer: %w", err)
	}

	// Set the deliver policy to start from the requested sequence
	info.Config.DeliverPolicy = nats.DeliverByStartSequencePolicy
	info.Config.OptStartSeq = sequence

	// Recreate consumer
	_, err = s.js.AddConsumer(streamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to recreate consumer: %w", err)
	}

	return nil
}

// ReplayMessages replays messages from a stream to a consumer
func (s *Service) ReplayMessages(streamName, consumerName string, opts *ReplayOptions) (string, error) {
	if !s.IsConnected() {
		return "", fmt.Errorf("not connected to NATS")
	}

	// Create a replay ID
	replayID := fmt.Sprintf("replay-%s-%d", consumerName, time.Now().UnixNano())

	// Get stream info to validate
	streamInfo, err := s.js.StreamInfo(streamName)
	if err != nil {
		return "", fmt.Errorf("failed to get stream info: %w", err)
	}

	// Create ephemeral consumer for replay
	replayCfg := &nats.ConsumerConfig{
		Durable:        replayID,
		DeliverSubject: fmt.Sprintf("replays.%s", replayID),
		AckPolicy:      nats.AckExplicitPolicy,
		DeliverPolicy:  nats.DeliverAllPolicy,
		ReplayPolicy:   nats.ReplayInstantPolicy,
	}

	if opts != nil {
		if opts.FilterSubject != "" {
			replayCfg.FilterSubject = opts.FilterSubject
		}
		if opts.StartSequence > 0 {
			replayCfg.OptStartSeq = opts.StartSequence
		}
	}

	// Create the replay consumer
	_, err = s.js.AddConsumer(streamName, replayCfg)
	if err != nil {
		return "", fmt.Errorf("failed to create replay consumer: %w", err)
	}

	// Log replay start
	log.Printf("Started message replay: stream=%s, consumer=%s, replay_id=%s, messages=%d",
		streamName, consumerName, replayID, streamInfo.State.Msgs)

	return replayID, nil
}

// PauseConsumer pauses a consumer
func (s *Service) PauseConsumer(streamName, consumerName string) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	info, err := s.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	// Pause by setting MaxDeliver to -2 (sentinel).
	// -1 means unlimited in NATS and 0 is the Go zero-value default,
	// so -2 is the only value that unambiguously signals a paused consumer.
	originalMaxDeliver := info.Config.MaxDeliver
	info.Config.MaxDeliver = constants.PauseSentinel

	_, err = s.js.UpdateConsumer(streamName, &info.Config)
	if err != nil {
		// Restore original config on error
		info.Config.MaxDeliver = originalMaxDeliver
		return fmt.Errorf("failed to pause consumer: %w", err)
	}

	// Store original max deliver for resume
	// In a real implementation, you'd store this somewhere
	log.Printf("Paused consumer %s/%s (original MaxDeliver: %d)", streamName, consumerName, originalMaxDeliver)

	return nil
}

// ResumeConsumer resumes a paused consumer
func (s *Service) ResumeConsumer(streamName, consumerName string) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	info, err := s.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		return fmt.Errorf("failed to get consumer info: %w", err)
	}

	if info.Config.MaxDeliver != constants.PauseSentinel {
		return nil
	}

	info.Config.MaxDeliver = constants.DefaultMaxDeliver

	_, err = s.js.UpdateConsumer(streamName, &info.Config)
	if err != nil {
		return fmt.Errorf("failed to resume consumer: %w", err)
	}

	log.Printf("Resumed consumer %s/%s", streamName, consumerName)

	return nil
}

// GetStreamMessage gets a specific message from a stream
func (s *Service) GetStreamMessage(streamName string, sequence uint64) (*nats.RawStreamMsg, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	// Get message by sequence
	msg, err := s.js.GetMsg(streamName, sequence)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch message: %w", err)
	}

	return msg, nil
}

// DeleteStreamMessage deletes a specific message from a stream
func (s *Service) DeleteStreamMessage(streamName string, sequence uint64) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	return s.js.DeleteMsg(streamName, sequence)
}

// PublishMessage publishes a message to a subject
func (s *Service) PublishMessage(subject string, data []byte) error {
	if !s.IsConnected() {
		return fmt.Errorf("not connected to NATS")
	}

	_, err := s.js.Publish(subject, data)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	return nil
}

// GetConnections returns active connection info
func (s *Service) GetConnections() ([]map[string]interface{}, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	// NATS doesn't provide connection listing without monitoring enabled
	return []map[string]interface{}{}, nil
}

// GetServerInfo returns NATS server information
func (s *Service) GetServerInfo() (map[string]interface{}, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	// Get connected URL
	url := s.nc.ConnectedUrl()

	return map[string]interface{}{
		"server_id": url,
		"connected": s.nc.IsConnected(),
	}, nil
}

// WatchStream watches a stream for new messages
func (s *Service) WatchStream(ctx context.Context, streamName string, filterSubject string) (<-chan *nats.Msg, error) {
	if !s.IsConnected() {
		return nil, fmt.Errorf("not connected to NATS")
	}

	msgChan := make(chan *nats.Msg, 100)

	// Create subscription for the subject
	subject := streamName
	if filterSubject != "" {
		subject = filterSubject
	}

	// Create push subscription for new messages using SubscribeSync
	sub, err := s.js.PullSubscribe(subject, "", nats.AckExplicit())
	if err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	key := fmt.Sprintf("%s-%s", streamName, filterSubject)

	s.mu.Lock()
	if existing, ok := s.subscribers[key]; ok {
		if err := existing.Unsubscribe(); err != nil {
			log.Printf("Error unsubscribing existing subscription for %s: %v", key, err)
		}
	}
	s.subscribers[key] = sub
	s.mu.Unlock()

	// Start goroutine to forward messages
	go func() {
		defer close(msgChan)
		defer func() {
			sub.Unsubscribe()
			s.mu.Lock()
			delete(s.subscribers, key)
			s.mu.Unlock()
		}()

		for {
			select {
			case <-ctx.Done():
				return
			default:
				msg, err := sub.NextMsg(2 * time.Second)
				if err != nil {
					if err == nats.ErrTimeout {
						continue
					}
					log.Printf("Error receiving message: %v", err)
					return
				}

				select {
				case msgChan <- msg:
					msg.Ack()
				case <-ctx.Done():
					msg.Nak()
					return
				}
			}
		}
	}()

	return msgChan, nil
}
