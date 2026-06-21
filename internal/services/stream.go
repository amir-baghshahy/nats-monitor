package services

import (
	"context"
	"fmt"

	"github.com/amir-baghshahy/nats-monitor/internal/models"
)

// DTOs for stream operations
type StreamCreate struct {
	Name      string
	Subjects  []string
	Storage   string
	Retention string
	Replicas  int
	MaxAge    string
	MaxBytes  uint64
}

type StreamUpdate struct {
	Name     string
	Subjects []string
	Replicas int
	MaxAge   string
	MaxBytes uint64
}

// StreamUseCase handles stream business logic
type StreamUseCase struct {
	streamRepo models.StreamRepository
}

// NewStreamUseCase creates a new stream use case
func NewStreamUseCase(streamRepo models.StreamRepository) *StreamUseCase {
	return &StreamUseCase{
		streamRepo: streamRepo,
	}
}

// ListStreams returns all streams
func (uc *StreamUseCase) ListStreams(ctx context.Context) ([]*models.Stream, error) {
	return uc.streamRepo.List(ctx)
}

// GetStream returns a stream by name
func (uc *StreamUseCase) GetStream(ctx context.Context, name string) (*models.Stream, error) {
	if name == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	return uc.streamRepo.Get(ctx, name)
}

// CreateStream creates a new stream
func (uc *StreamUseCase) CreateStream(ctx context.Context, req *StreamCreate) (*models.Stream, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}
	if req.Name == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	if len(req.Subjects) == 0 {
		return nil, fmt.Errorf("at least one subject is required")
	}
	stream := &models.Stream{
		Name:      req.Name,
		Subjects:  req.Subjects,
		Storage:   req.Storage,
		Retention: req.Retention,
		Replicas:  req.Replicas,
		MaxAge:    req.MaxAge,
		MaxBytes:  int64(req.MaxBytes),
	}
	return uc.streamRepo.Create(ctx, stream)
}

// UpdateStream updates an existing stream
func (uc *StreamUseCase) UpdateStream(ctx context.Context, req *StreamUpdate) (*models.Stream, error) {
	if req == nil {
		return nil, fmt.Errorf("request is required")
	}
	if req.Name == "" {
		return nil, fmt.Errorf("stream name is required")
	}
	stream := &models.Stream{
		Name:     req.Name,
		Subjects: req.Subjects,
		Replicas: req.Replicas,
		MaxAge:   req.MaxAge,
		MaxBytes: int64(req.MaxBytes),
	}
	return uc.streamRepo.Update(ctx, stream)
}

// DeleteStream deletes a stream
func (uc *StreamUseCase) DeleteStream(ctx context.Context, name string) error {
	if name == "" {
		return fmt.Errorf("stream name is required")
	}
	return uc.streamRepo.Delete(ctx, name)
}

// PurgeStream purges messages from a stream
func (uc *StreamUseCase) PurgeStream(ctx context.Context, name string, subject string, sequence uint64) (uint64, error) {
	if name == "" {
		return 0, fmt.Errorf("stream name is required")
	}
	return uc.streamRepo.Purge(ctx, name, subject, sequence)
}
