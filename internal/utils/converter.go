package utils

import (
	"fmt"
	"time"

	"nats-monitoring/internal/constants"
	"nats-monitoring/internal/dto"
	"nats-monitoring/internal/models"
)

// StreamToResponse converts a domain Stream to StreamResponse DTO
func StreamToResponse(stream *models.Stream) *dto.StreamResponse {
	if stream == nil {
		return nil
	}

	return &dto.StreamResponse{
		Config: &dto.StreamConfigResponse{
			Name:      stream.Name,
			Subjects:  stream.Subjects,
			Storage:   stream.Storage,
			Retention: stream.Retention,
			Replicas:  stream.Replicas,
		},
		State: &dto.StreamStateResponse{
			Messages:    stream.Messages,
			Bytes:       stream.Bytes,
			Consumers:   stream.Consumers,
			FirstSeq:    stream.FirstSeq,
			LastSeq:     stream.LastSeq,
			FirstTs:     formatTime(stream.FirstTs),
			LastTs:      formatTime(stream.LastTs),
			NumPending:  0, // Calculated from actual state if available
			DeleteMarks: 0,
		},
	}
}

// StreamsToResponse converts a slice of domain Streams to StreamResponse DTOs
func StreamsToResponse(streams []*models.Stream) []*dto.StreamResponse {
	responses := make([]*dto.StreamResponse, len(streams))
	for i, stream := range streams {
		responses[i] = StreamToResponse(stream)
	}
	return responses
}

// ConsumerToResponse converts a domain Consumer to ConsumerResponse DTO
func ConsumerToResponse(consumer *models.Consumer) *dto.ConsumerResponse {
	if consumer == nil {
		return nil
	}

	durable := ""
	if consumer.Durable {
		durable = consumer.Name
	}

	return &dto.ConsumerResponse{
		Name:       consumer.Name,
		Stream:     consumer.Stream,
		Status:     consumer.Status,
		Lag:        consumer.Lag,
		AckRate:    consumer.AckRate,
		NumPending: consumer.NumPending,
		Paused:     consumer.Paused,
		Config: &dto.ConsumerConfigResponse{
			Durable:       durable,
			AckPolicy:     consumer.AckPolicy,
			DeliverPolicy: consumer.DeliverPolicy,
			ReplayPolicy:  consumer.ReplayPolicy,
			MaxDeliver:    int64(consumer.MaxDeliver),
		},
	}
}

// ConsumersToResponse converts a slice of domain Consumers to ConsumerResponse DTOs
func ConsumersToResponse(consumers []*models.Consumer) []*dto.ConsumerResponse {
	responses := make([]*dto.ConsumerResponse, len(consumers))
	for i, consumer := range consumers {
		responses[i] = ConsumerToResponse(consumer)
	}
	return responses
}

// GetDurableName returns the durable name for a consumer
func GetDurableName(consumer *models.Consumer) string {
	if consumer == nil || !consumer.Durable {
		return ""
	}
	return consumer.Name
}

// AckPolicyToString converts AckPolicy int to string
func AckPolicyToString(policy int) string {
	switch policy {
	case 0:
		return constants.AckPolicyNone
	case 1:
		return constants.AckPolicyAll
	case 2:
		return constants.AckPolicyExplicit
	default:
		return fmt.Sprintf("%d", policy)
	}
}

// DeliverPolicyToString converts DeliverPolicy int to string
func DeliverPolicyToString(policy int) string {
	switch policy {
	case 0:
		return constants.DeliverPolicyAll
	case 1:
		return constants.DeliverPolicyLast
	case 2:
		return constants.DeliverPolicyNew
	default:
		return fmt.Sprintf("%d", policy)
	}
}

// ReplayPolicyToString converts ReplayPolicy int to string
func ReplayPolicyToString(policy int) string {
	switch policy {
	case 0:
		return constants.ReplayPolicyInstant
	case 1:
		return constants.ReplayPolicyOriginal
	default:
		return fmt.Sprintf("%d", policy)
	}
}

// MessageToResponse converts a domain Message to MessageResponse DTO
func MessageToResponse(msg *models.Message) *dto.MessageResponse {
	if msg == nil {
		return nil
	}

	return &dto.MessageResponse{
		Subject:   msg.Subject,
		Sequence:  msg.Sequence,
		Data:      string(msg.Data),
		Headers:   msg.Headers,
		Timestamp: formatTime(msg.Timestamp),
	}
}

// MessagesToResponse converts a slice of domain Messages to MessageResponse DTOs
func MessagesToResponse(messages []*models.Message) []*dto.MessageResponse {
	responses := make([]*dto.MessageResponse, len(messages))
	for i, msg := range messages {
		responses[i] = MessageToResponse(msg)
	}
	return responses
}

// formatTime converts time.Time to ISO string format
func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

// ParseTime parses an ISO string to time.Time
func ParseTime(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, nil
	}
	return time.Parse(time.RFC3339, s)
}

// IsValidStorage checks if storage type is valid
func IsValidStorage(storage string) bool {
	return storage == constants.StorageFile || storage == constants.StorageMemory
}

// IsValidRetention checks if retention policy is valid
func IsValidRetention(retention string) bool {
	switch retention {
	case constants.RetentionLimits, constants.RetentionInterest, constants.RetentionWorkQueue:
		return true
	default:
		return false
	}
}

// IsValidAckPolicy checks if ack policy is valid
func IsValidAckPolicy(policy string) bool {
	switch policy {
	case constants.AckPolicyNone, constants.AckPolicyAll, constants.AckPolicyExplicit:
		return true
	default:
		return false
	}
}

// IsValidDeliverPolicy checks if deliver policy is valid
func IsValidDeliverPolicy(policy string) bool {
	switch policy {
	case constants.DeliverPolicyAll, constants.DeliverPolicyLast, constants.DeliverPolicyNew:
		return true
	default:
		return false
	}
}

// IsValidReplayPolicy checks if replay policy is valid
func IsValidReplayPolicy(policy string) bool {
	switch policy {
	case constants.ReplayPolicyInstant, constants.ReplayPolicyOriginal:
		return true
	default:
		return false
	}
}
