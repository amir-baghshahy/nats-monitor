package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"nats-monitoring/internal/constants"
	"nats-monitoring/internal/models"

	"github.com/nats-io/nats.go"
)

// ServerUseCase handles server-related business logic
type ServerUseCase struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewServerUseCase creates a new server use case
func NewServerUseCase(nc *nats.Conn, js nats.JetStreamContext) *ServerUseCase {
	return &ServerUseCase{
		nc: nc,
		js: js,
	}
}

// DashboardStats represents dashboard statistics
type DashboardStats struct {
	Streams     int
	Consumers   int
	Messages    uint64
	Bytes       uint64
	Connections int
	Status      string
}

// GetDashboardStats returns dashboard statistics
func (uc *ServerUseCase) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	if uc.nc == nil || !uc.nc.IsConnected() {
		return &DashboardStats{
			Status: "disconnected",
		}, nil
	}

	msg, err := uc.nc.Request(constants.APIStreamList, []byte(`{"subjects_filter":">"}`), constants.LongRequestTimeout)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream list: %w", err)
	}

	var response struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
			State struct {
				Messages  uint64 `json:"messages"`
				Bytes     uint64 `json:"bytes"`
				Consumers int    `json:"consumer_count"`
			} `json:"state"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	stats := &DashboardStats{
		Streams:     len(response.Streams),
		Status:      "connected",
		Connections: 1,
	}

	for _, stream := range response.Streams {
		stats.Messages += stream.State.Messages
		stats.Bytes += stream.State.Bytes
		stats.Consumers += stream.State.Consumers
	}

	return stats, nil
}

// AccountInfo represents JetStream account information
type AccountInfo struct {
	Memory       uint64
	Storage      uint64
	Streams      int
	Consumers    int
	Domain       string
	MaxMemory    uint64
	MaxStorage   uint64
	MaxStreams   int
	MaxConsumers int
}

// GetAccountInfo returns JetStream account information
func (uc *ServerUseCase) GetAccountInfo(ctx context.Context) (*AccountInfo, error) {
	if uc.js == nil {
		return nil, fmt.Errorf("JetStream not available")
	}

	info, err := uc.js.AccountInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to get account info: %w", err)
	}

	return &AccountInfo{
		Memory:       info.Tier.Memory,
		Storage:      info.Tier.Store,
		Streams:      info.Tier.Streams,
		Consumers:    info.Tier.Consumers,
		Domain:       info.Domain,
		MaxMemory:    uint64(info.Limits.MaxMemory),
		MaxStorage:   uint64(info.Limits.MaxStore),
		MaxStreams:   info.Limits.MaxStreams,
		MaxConsumers: info.Limits.MaxConsumers,
	}, nil
}

// Connections represents NATS connection information
type Connections struct {
	List      []*models.Connection
	Total     int
	Connected bool
}

// GetConnections returns connection information
func (uc *ServerUseCase) GetConnections(ctx context.Context) (*Connections, error) {
	connections := []*models.Connection{}
	connected := false

	if uc.nc != nil && uc.nc.IsConnected() {
		connected = true
		url := uc.nc.ConnectedUrl()
		serverName := "NATS Server"

		// Try to get server name
		if msg, err := uc.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), constants.DefaultRequestTimeout); err == nil && msg != nil {
			var serverResp struct {
				Name string `json:"server_name"`
			}
			if json.Unmarshal(msg.Data, &serverResp) == nil && serverResp.Name != "" {
				serverName = serverResp.Name
			}
		}

		connections = append(connections, &models.Connection{
			CID:          0,
			Type:         "monitoring",
			Name:         "current",
			User:         "",
			IP:           url,
			Server:       serverName,
			SubsCount:    0,
			ConnectedAt:  time.Now(),
			LastActivity: time.Now(),
		})
	}

	return &Connections{
		List:      connections,
		Total:     len(connections),
		Connected: connected,
	}, nil
}

// SubjectInfo represents subject information
type SubjectInfo struct {
	Name     string
	Count    int64
	LastSeen string
}

// GetSubjects returns subject information from stream configurations
func (uc *ServerUseCase) GetSubjects(ctx context.Context) ([]*SubjectInfo, error) {
	msg, err := uc.nc.Request(constants.APIStreamList, []byte(`{"subjects_filter":">"}`), constants.LongRequestTimeout)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream list: %w", err)
	}

	var response struct {
		Streams []struct {
			Config struct {
				Subjects []string `json:"subjects"`
			} `json:"config"`
			State struct {
				Messages uint64 `json:"messages"`
			} `json:"state"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	subjects := []*SubjectInfo{}
	seen := make(map[string]bool)

	for _, stream := range response.Streams {
		for _, subject := range stream.Config.Subjects {
			if !seen[subject] {
				seen[subject] = true
				subjects = append(subjects, &SubjectInfo{
					Name:  subject,
					Count: int64(stream.State.Messages),
				})
			}
		}
	}

	return subjects, nil
}

// SystemMetrics represents system metrics
type SystemMetrics struct {
	MemoryUsed   uint64
	MemoryMax    uint64
	MemoryUsage  float64
	StorageUsed  uint64
	StorageMax   uint64
	StorageUsage float64
	Connections  int
	Streams      int
	Consumers    int
	Timestamp    int64
}

// GetSystemMetrics returns system metrics
func (uc *ServerUseCase) GetSystemMetrics(ctx context.Context) (*SystemMetrics, error) {
	accountInfo, err := uc.js.AccountInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to get account info: %w", err)
	}

	connections := 0
	if uc.nc != nil && uc.nc.IsConnected() {
		connections = 1
	}

	memoryUsage := 0.0
	if accountInfo.Limits.MaxMemory > 0 {
		memoryUsage = float64(accountInfo.Tier.Memory) / float64(accountInfo.Limits.MaxMemory) * 100
	}

	storageUsage := 0.0
	if accountInfo.Limits.MaxStore > 0 {
		storageUsage = float64(accountInfo.Tier.Store) / float64(accountInfo.Limits.MaxStore) * 100
	}

	return &SystemMetrics{
		MemoryUsed:   accountInfo.Tier.Memory,
		MemoryMax:    uint64(accountInfo.Limits.MaxMemory),
		MemoryUsage:  memoryUsage,
		StorageUsed:  accountInfo.Tier.Store,
		StorageMax:   uint64(accountInfo.Limits.MaxStore),
		StorageUsage: storageUsage,
		Connections:  connections,
		Streams:      accountInfo.Tier.Streams,
		Consumers:    accountInfo.Tier.Consumers,
		Timestamp:    time.Now().Unix(),
	}, nil
}

// StreamMetrics represents metrics for a specific stream
type StreamMetrics struct {
	Name     string
	Messages uint64
	Bytes    uint64
	FirstTs  string
	LastTs   string
}

// GetRateMetrics returns message rate metrics for streams
func (uc *ServerUseCase) GetRateMetrics(ctx context.Context, duration int) ([]*StreamMetrics, error) {
	msg, err := uc.nc.Request(constants.APIStreamList, []byte(`{"subjects_filter":">"}`), constants.LongRequestTimeout)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream list: %w", err)
	}

	var response struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
			State struct {
				Messages uint64 `json:"messages"`
				Bytes    uint64 `json:"bytes"`
				FirstTs  string `json:"first_ts"`
				LastTs   string `json:"last_ts"`
			} `json:"state"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	metrics := make([]*StreamMetrics, len(response.Streams))
	for i, stream := range response.Streams {
		metrics[i] = &StreamMetrics{
			Name:     stream.Config.Name,
			Messages: stream.State.Messages,
			Bytes:    stream.State.Bytes,
			FirstTs:  stream.State.FirstTs,
			LastTs:   stream.State.LastTs,
		}
	}

	return metrics, nil
}
