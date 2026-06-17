package usecase

import (
	"context"
	"fmt"

	"nats-monitoring/internal/domain"
)

// ConsumerUseCase handles consumer business logic
type ConsumerUseCase struct {
	consumerRepo domain.ConsumerRepository
}

// NewConsumerUseCase creates a new consumer use case
func NewConsumerUseCase(consumerRepo domain.ConsumerRepository) *ConsumerUseCase {
	return &ConsumerUseCase{
		consumerRepo: consumerRepo,
	}
}

// ListConsumers returns all consumers for a stream
func (uc *ConsumerUseCase) ListConsumers(ctx context.Context, streamName string) ([]*domain.Consumer, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	return uc.consumerRepo.List(ctx, streamName)
}

// GetConsumer returns a consumer by name
func (uc *ConsumerUseCase) GetConsumer(ctx context.Context, streamName, name string) (*domain.Consumer, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	if name == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.Get(ctx, streamName, name)
}

// CreateConsumer creates a new consumer
func (uc *ConsumerUseCase) CreateConsumer(ctx context.Context, streamName string, consumer *domain.Consumer) (*domain.Consumer, error) {
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
func (uc *ConsumerUseCase) UpdateConsumer(ctx context.Context, streamName string, consumer *domain.Consumer) (*domain.Consumer, error) {
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
func (uc *ConsumerUseCase) ResetLag(ctx context.Context, req *domain.LagResetRequest) error {
	if req == nil {
		return fmt.Errorf("request is required")
	}
	return uc.consumerRepo.ResetLag(ctx, req)
}

// ReplayMessages starts message replay
func (uc *ConsumerUseCase) ReplayMessages(ctx context.Context, req *domain.ReplayRequest) (string, error) {
	if req == nil {
		return "", fmt.Errorf("request is required")
	}
	return uc.consumerRepo.Replay(ctx, req)
}

// PauseConsumer pauses a consumer
func (uc *ConsumerUseCase) PauseConsumer(ctx context.Context, req *domain.PauseRequest) error {
	if req == nil {
		return fmt.Errorf("request is required")
	}
	return uc.consumerRepo.Pause(ctx, req)
}

// ResumeConsumer resumes a paused consumer
func (uc *ConsumerUseCase) ResumeConsumer(ctx context.Context, req *domain.ResumeRequest) error {
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
func (uc *ConsumerUseCase) GetPendingMessages(ctx context.Context, streamName, consumerName string, limit int) ([]*domain.Message, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	if consumerName == "" {
		return nil, fmt.Errorf("consumer name is required")
	}
	return uc.consumerRepo.GetPendingMessages(ctx, streamName, consumerName, limit)
}
