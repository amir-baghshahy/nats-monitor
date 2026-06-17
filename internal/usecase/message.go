package usecase

import (
	"context"
	"fmt"

	"nats-monitoring/internal/domain"
)

// MessageUseCase handles message business logic
type MessageUseCase struct {
	messageRepo domain.MessageRepository
}

// NewMessageUseCase creates a new message use case
func NewMessageUseCase(messageRepo domain.MessageRepository) *MessageUseCase {
	return &MessageUseCase{
		messageRepo: messageRepo,
	}
}

// PublishMessage publishes a message to a subject
func (uc *MessageUseCase) PublishMessage(ctx context.Context, subject string, data []byte) error {
	if subject == "" {
		return fmt.Errorf("subject is required")
	}
	if len(data) == 0 {
		return fmt.Errorf("message data is required")
	}
	return uc.messageRepo.Publish(ctx, subject, data)
}

// PublishToStream publishes a message to a stream
func (uc *MessageUseCase) PublishToStream(ctx context.Context, streamName string, data []byte) error {
	if streamName == "" {
		return fmt.Errorf("stream name is required")
	}
	if len(data) == 0 {
		return fmt.Errorf("message data is required")
	}
	return uc.messageRepo.PublishToStream(ctx, streamName, data)
}

// DeleteMessage deletes a message from a stream
func (uc *MessageUseCase) DeleteMessage(ctx context.Context, streamName string, sequence uint64) error {
	if streamName == "" {
		return fmt.Errorf("stream name is required")
	}
	if sequence == 0 {
		return fmt.Errorf("sequence number is required")
	}
	return uc.messageRepo.Delete(ctx, streamName, sequence)
}

// GetMessage gets a message from a stream
func (uc *MessageUseCase) GetMessage(ctx context.Context, streamName string, sequence uint64) (*domain.Message, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	if sequence == 0 {
		return nil, fmt.Errorf("sequence number is required")
	}
	return uc.messageRepo.Get(ctx, streamName, sequence)
}

// ListMessages lists messages from a stream
func (uc *MessageUseCase) ListMessages(ctx context.Context, streamName string, filter domain.MessageFilter) ([]*domain.Message, error) {
	if streamName == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	return uc.messageRepo.List(ctx, streamName, filter)
}
