package desktop

import (
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/amir-baghshahy/nats-horizon/internal/models"
)

func streamToResponse(stream *models.Stream) *dto.StreamResponse {
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
			MaxAge:    stream.MaxAge,
			MaxBytes:  uint64(stream.MaxBytes),
		},
		State: &dto.StreamStateResponse{
			Messages:   stream.Messages,
			Bytes:      stream.Bytes,
			Consumers:  stream.Consumers,
			FirstSeq:   stream.FirstSeq,
			LastSeq:    stream.LastSeq,
			FirstTs:    formatTimeValue(stream.FirstTs),
			LastTs:     formatTimeValue(stream.LastTs),
			NumPending: stream.NumPending,
		},
	}
}

func streamsToResponse(streams []*models.Stream) []dto.StreamResponse {
	responses := make([]dto.StreamResponse, len(streams))
	for i, stream := range streams {
		if r := streamToResponse(stream); r != nil {
			responses[i] = *r
		}
	}
	return responses
}

func consumerToResponse(consumer *models.Consumer) *dto.ConsumerResponse {
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

func consumersToResponse(consumers []*models.Consumer) []dto.ConsumerResponse {
	responses := make([]dto.ConsumerResponse, len(consumers))
	for i, consumer := range consumers {
		if r := consumerToResponse(consumer); r != nil {
			responses[i] = *r
		}
	}
	return responses
}

func formatTimeValue(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
