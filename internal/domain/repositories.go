package domain

import (
	"context"
	"time"
)

// StreamRepository defines operations for stream management
type StreamRepository interface {
	List(ctx context.Context) ([]*Stream, error)
	Get(ctx context.Context, name string) (*Stream, error)
	Create(ctx context.Context, stream *Stream) (*Stream, error)
	Update(ctx context.Context, stream *Stream) (*Stream, error)
	Delete(ctx context.Context, name string) error
	Purge(ctx context.Context, name string, subject string, sequence uint64) (uint64, error)
}

// ConsumerRepository defines operations for consumer management
type ConsumerRepository interface {
	List(ctx context.Context, streamName string) ([]*Consumer, error)
	Get(ctx context.Context, streamName, name string) (*Consumer, error)
	Create(ctx context.Context, streamName string, consumer *Consumer) (*Consumer, error)
	Update(ctx context.Context, streamName string, consumer *Consumer) (*Consumer, error)
	Delete(ctx context.Context, streamName, name string) error
	ResetLag(ctx context.Context, req *LagResetRequest) error
	Replay(ctx context.Context, req *ReplayRequest) (string, error)
	Pause(ctx context.Context, req *PauseRequest) error
	Resume(ctx context.Context, req *ResumeRequest) error

	// Message acknowledgment operations
	AckMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error
	NackMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error
	TerminateMessage(ctx context.Context, streamName, consumerName string, sequence uint64) error

	// Pending messages
	GetPendingMessages(ctx context.Context, streamName, consumerName string, limit int) ([]*Message, error)
}

// ConnectionRepository defines operations for connection monitoring
type ConnectionRepository interface {
	List(ctx context.Context) ([]*Connection, error)
	Get(ctx context.Context, id string) (*Connection, error)
	Terminate(ctx context.Context, id string) error
}

// MessageRepository defines operations for message management
type MessageRepository interface {
	List(ctx context.Context, streamName string, filter MessageFilter) ([]*Message, error)
	Get(ctx context.Context, streamName string, sequence uint64) (*Message, error)
	Delete(ctx context.Context, streamName string, sequence uint64) error
	Publish(ctx context.Context, subject string, data []byte) error
	PublishToStream(ctx context.Context, streamName string, data []byte) error
}

// ServerRepository defines operations for server information
type ServerRepository interface {
	GetInfo(ctx context.Context) (*ServerInfo, error)
	GetHealth(ctx context.Context) error
}

// MessageFilter represents filter options for listing messages
type MessageFilter struct {
	Subject   string
	Sequence  uint64
	Limit     int
	StartTime time.Time
	EndTime   time.Time
}
