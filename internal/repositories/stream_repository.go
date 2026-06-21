package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/amir-baghshahy/nats-monitor/internal/models"

	"github.com/nats-io/nats.go"
)

func parseDuration(s string) time.Duration {
	if s == "" {
		return 0
	}
	d, err := time.ParseDuration(s)
	if err != nil {
		return 0
	}
	return d
}

// durationNsToString converts nanoseconds (NATS API format) to a human-readable duration string.
func durationNsToString(ns int64) string {
	if ns <= 0 {
		return ""
	}
	return time.Duration(ns).String()
}

// normalizeMaxBytes converts NATS unlimited sentinel values (-1 or int64 max wrapped as uint64) to 0.
func normalizeMaxBytes(v int64) int64 {
	if v < 0 {
		return 0
	}
	return v
}

// NATSStreamRepository implements StreamRepository using NATS JetStream
type NATSStreamRepository struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewNATSStreamRepository creates a new NATS stream repository
func NewNATSStreamRepository(nc *nats.Conn, js nats.JetStreamContext) *NATSStreamRepository {
	return &NATSStreamRepository{nc: nc, js: js}
}

type streamListResponse struct {
	Streams []struct {
		Config struct {
			Name      string   `json:"name"`
			Subjects  []string `json:"subjects"`
			Retention string   `json:"retention"`
			Storage   string   `json:"storage"`
			Replicas  int      `json:"replicas"`
			MaxAge    int64    `json:"max_age"`
			MaxBytes  int64    `json:"max_bytes"`
		} `json:"config"`
		State struct {
			Msgs      uint64 `json:"messages"`
			Bytes     uint64 `json:"bytes"`
			Consumers int    `json:"consumer_count"`
			FirstSeq  uint64 `json:"first_seq"`
			LastSeq   uint64 `json:"last_seq"`
			FirstTs   string `json:"first_ts"`
			LastTs    string `json:"last_ts"`
		} `json:"state"`
	} `json:"streams"`
}

func storageToString(storage int) string {
	switch storage {
	case 0:
		return "file"
	case 1:
		return "memory"
	default:
		return fmt.Sprintf("%d", storage)
	}
}

func (r *NATSStreamRepository) List(ctx context.Context) ([]*models.Stream, error) {
	msg, err := r.nc.Request("$JS.API.STREAM.LIST", []byte(`{}`), 5*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to list streams: %w", err)
	}

	var response streamListResponse
	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	streams := make([]*models.Stream, 0, len(response.Streams))
	for _, s := range response.Streams {
		firstTs, _ := time.Parse(time.RFC3339Nano, s.State.FirstTs)
		lastTs, _ := time.Parse(time.RFC3339Nano, s.State.LastTs)
		stream := &models.Stream{
			Name:      s.Config.Name,
			Subjects:  s.Config.Subjects,
			Storage:   s.Config.Storage,
			Retention: s.Config.Retention,
			Replicas:  s.Config.Replicas,
			MaxAge:    durationNsToString(s.Config.MaxAge),
			MaxBytes:  normalizeMaxBytes(s.Config.MaxBytes),
			Messages:  s.State.Msgs,
			Bytes:     s.State.Bytes,
			Consumers: s.State.Consumers,
			FirstSeq:  s.State.FirstSeq,
			LastSeq:   s.State.LastSeq,
			FirstTs:   firstTs,
			LastTs:    lastTs,
			CreatedAt: time.Now(),
		}
		streams = append(streams, stream)
	}

	return streams, nil
}

func (r *NATSStreamRepository) Get(ctx context.Context, name string) (*models.Stream, error) {
	info, err := r.js.StreamInfo(name)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}

	return r.toDomainStream(info), nil
}

func (r *NATSStreamRepository) Create(ctx context.Context, stream *models.Stream) (*models.Stream, error) {
	cfg := r.toNATSStreamConfig(stream)

	info, err := r.js.AddStream(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create stream: %w", err)
	}

	return r.toDomainStream(info), nil
}

func (r *NATSStreamRepository) Update(ctx context.Context, stream *models.Stream) (*models.Stream, error) {
	cfg := r.toNATSStreamConfig(stream)

	info, err := r.js.UpdateStream(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to update stream: %w", err)
	}

	return r.toDomainStream(info), nil
}

func (r *NATSStreamRepository) Delete(ctx context.Context, name string) error {
	if err := r.js.DeleteStream(name); err != nil {
		return fmt.Errorf("failed to delete stream: %w", err)
	}
	return nil
}

func (r *NATSStreamRepository) Purge(ctx context.Context, name string, subject string, sequence uint64) (uint64, error) {
	req := &nats.StreamPurgeRequest{
		Subject:  subject,
		Sequence: sequence,
	}

	if err := r.js.PurgeStream(name, req); err != nil {
		return 0, fmt.Errorf("failed to purge stream: %w", err)
	}

	info, err := r.js.StreamInfo(name)
	if err != nil {
		return 0, nil
	}

	return info.State.Msgs, nil
}

func (r *NATSStreamRepository) toDomainStream(info *nats.StreamInfo) *models.Stream {
	retention := "limits"
	switch info.Config.Retention {
	case nats.InterestPolicy:
		retention = "interest"
	case nats.WorkQueuePolicy:
		retention = "workqueue"
	}
	maxAge := ""
	if info.Config.MaxAge > 0 {
		maxAge = info.Config.MaxAge.String()
	}
	return &models.Stream{
		Name:      info.Config.Name,
		Subjects:  info.Config.Subjects,
		Storage:   storageToString(int(info.Config.Storage)),
		Retention: retention,
		Replicas:  int(info.Config.Replicas),
		MaxAge:    maxAge,
		MaxBytes:  info.Config.MaxBytes,
		Messages:  info.State.Msgs,
		Bytes:     info.State.Bytes,
		Consumers: int(info.State.Consumers),
		FirstSeq:  info.State.FirstSeq,
		LastSeq:   info.State.LastSeq,
		FirstTs:   info.State.FirstTime,
		LastTs:    info.State.LastTime,
		CreatedAt: time.Now(),
	}
}

func (r *NATSStreamRepository) toNATSStreamConfig(stream *models.Stream) *nats.StreamConfig {
	var storage nats.StorageType
	switch stream.Storage {
	case "file":
		storage = nats.FileStorage
	case "memory":
		storage = nats.MemoryStorage
	default:
		storage = nats.FileStorage
	}

	var retention nats.RetentionPolicy
	switch stream.Retention {
	case "interest":
		retention = nats.InterestPolicy
	case "workqueue":
		retention = nats.WorkQueuePolicy
	default:
		retention = nats.LimitsPolicy
	}

	cfg := &nats.StreamConfig{
		Name:      stream.Name,
		Subjects:  stream.Subjects,
		Storage:   storage,
		Replicas:  stream.Replicas,
		Retention: retention,
		MaxBytes:  stream.MaxBytes,
		MaxAge:    parseDuration(stream.MaxAge),
	}

	return cfg
}
