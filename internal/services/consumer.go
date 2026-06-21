package services

import (
	"context"
	"fmt"

	"github.com/amir-baghshahy/nats-monitor/internal/models"
)

// ConsumerUseCase handles consumer business logic
type ConsumerUseCase struct {
	consumerRepo models.ConsumerRepository
}

// NewConsumerUseCase creates a new consumer use case
func NewConsumerUseCase(consumerRepo models.ConsumerRepository) *ConsumerUseCase {
	return &ConsumerUseCase{
		consumerRepo: consumerRepo,
	}
}

// ListConsumers returns all consumers for a stream
func (uc *ConsumerUseCase) ListConsumers(ctx context.Context, streamName string) ([]*models.Consumer, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	return uc.consumerRepo.List(ctx, streamName)
}

// GetConsumer returns a consumer by name
func (uc *ConsumerUseCase) GetConsumer(ctx context.Context, streamName, name string) (*models.Consumer, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	if name == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.Get(ctx, streamName, name)
}

// CreateConsumer creates a new consumer
func (uc *ConsumerUseCase) CreateConsumer(ctx context.Context, streamName string, consumer *models.Consumer) (*models.Consumer, error) {
	if consumer == nil {
		return nil, fmt.Errorf("consumer is required")
	}
	if consumer.Name == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	return uc.consumerRepo.Create(ctx, streamName, consumer)
}

// UpdateConsumer updates an existing consumer
func (uc *ConsumerUseCase) UpdateConsumer(ctx context.Context, streamName string, consumer *models.Consumer) (*models.Consumer, error) {
	if consumer == nil {
		return nil, fmt.Errorf("consumer is required")
	}
	if consumer.Name == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.Update(ctx, streamName, consumer)
}

// DeleteConsumer deletes a consumer
func (uc *ConsumerUseCase) DeleteConsumer(ctx context.Context, streamName, name string) error {
	if streamName == "" {
		return fmt.Errorf("stream name is required")
	}
	if name == "" {
		return fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.Delete(ctx, streamName, name)
}

// ResetLag resets consumer lag
func (uc *ConsumerUseCase) ResetLag(ctx context.Context, req *models.LagResetRequest) error {
	if req == nil {
		return fmt.Errorf("request is required")
	}
	return uc.consumerRepo.ResetLag(ctx, req)
}

// ReplayMessages starts message replay
func (uc *ConsumerUseCase) ReplayMessages(ctx context.Context, req *models.ReplayRequest) (string, error) {
	if req == nil {
		return "", fmt.Errorf("request is required")
	}
	return uc.consumerRepo.Replay(ctx, req)
}

// PauseConsumer pauses a consumer
func (uc *ConsumerUseCase) PauseConsumer(ctx context.Context, req *models.PauseRequest) error {
	if req == nil {
		return fmt.Errorf("request is required")
	}
	return uc.consumerRepo.Pause(ctx, req)
}

// ResumeConsumer resumes a paused consumer
func (uc *ConsumerUseCase) ResumeConsumer(ctx context.Context, req *models.ResumeRequest) error {
	if req == nil {
		return fmt.Errorf("request is required")
	}
	return uc.consumerRepo.Resume(ctx, req)
}

// AckMessage acknowledges a message
func (uc *ConsumerUseCase) AckMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	if streamName == "" {
		return fmt.Errorf("stream name is required")
	}
	if consumerName == "" {
		return fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.AckMessage(ctx, streamName, consumerName, sequence)
}

// NackMessage negative acknowledges a message
func (uc *ConsumerUseCase) NackMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	if streamName == "" {
		return fmt.Errorf("stream name is required")
	}
	if consumerName == "" {
		return fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.NackMessage(ctx, streamName, consumerName, sequence)
}

// TerminateMessage terminates a message
func (uc *ConsumerUseCase) TerminateMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error {
	if streamName == "" {
		return fmt.Errorf("stream name is required")
	}
	if consumerName == "" {
		return fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.TerminateMessage(ctx, streamName, consumerName, sequence)
}

// GetPendingMessages returns pending messages for a consumer
func (uc *ConsumerUseCase) GetPendingMessages(ctx context.Context, streamName, consumerName string, limit int) ([]*models.Message, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	if consumerName == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.GetPendingMessages(ctx, streamName, consumerName, limit)
}

// ConsumerInfo represents basic consumer information for cross-stream queries
type ConsumerInfo struct {
	Name          string
	Stream        string
	Status        string
	Lag           uint64
	AckRate       string
	NumPending    uint64
	Paused        bool
	Durable       string
	AckPolicy     string
	DeliverPolicy string
	ReplayPolicy  string
	MaxDeliver    int64
}

// GetAllConsumers returns all consumers across all streams
func (uc *ConsumerUseCase) GetAllConsumers(ctx context.Context) ([]*ConsumerInfo, error) {
	// This requires cross-stream access
	// For now, return an error - this needs repository support
	return nil, fmt.Errorf("cross-stream consumer listing requires repository support")
}

// FindConsumerByName finds a consumer by name across all streams
func (uc *ConsumerUseCase) FindConsumerByName(ctx context.Context, name string) (*ConsumerInfo, error) {
	if name == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	// This requires cross-stream access
	// For now, return an error - this needs repository support
	return nil, fmt.Errorf("cross-stream consumer search requires repository support")
}
