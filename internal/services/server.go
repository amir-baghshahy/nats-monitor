package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"strconv"
	"time"

	"github.com/amir-baghshahy/nats-monitor/internal/constants"
	"github.com/amir-baghshahy/nats-monitor/internal/models"

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
		Connections: 0,
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

	memoryMax := uint64(info.Limits.MaxMemory)
	if isUnlimited(memoryMax) {
		memoryMax = 0
	}
	storageMax := uint64(info.Limits.MaxStore)
	if isUnlimited(storageMax) {
		storageMax = 0
	}

	return &AccountInfo{
		Memory:       info.Tier.Memory,
		Storage:      info.Tier.Store,
		Streams:      info.Tier.Streams,
		Consumers:    info.Tier.Consumers,
		Domain:       info.Domain,
		MaxMemory:    memoryMax,
		MaxStorage:   storageMax,
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

// GetServerInfo returns NATS server information
func (uc *ServerUseCase) GetServerInfo(ctx context.Context) (map[string]interface{}, error) {
	connected := uc.nc != nil && uc.nc.IsConnected()
	serverURL := "N/A"
	serverName := "N/A"
	if connected {
		serverURL = uc.nc.ConnectedUrl()
		if msg, err := uc.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), constants.DefaultRequestTimeout); err == nil && msg != nil {
			var resp struct {
				Data struct {
					Server struct {
						Name string `json:"name"`
						ID   string `json:"id"`
					} `json:"server"`
				} `json:"data"`
			}
			if err := json.Unmarshal(msg.Data, &resp); err == nil {
				serverName = resp.Data.Server.Name
			}
		}
	}
	return map[string]interface{}{
		"server_id":  serverName,
		"version":    "0.0.0",
		"connected":  connected,
		"server_url": serverURL,
	}, nil
}

// GetConnections returns connection information
func (uc *ServerUseCase) GetConnections(ctx context.Context) (*Connections, error) {
	connections := []*models.Connection{}
	connected := false

	if uc.nc == nil || !uc.nc.IsConnected() {
		return &Connections{
			List:      connections,
			Total:     len(connections),
			Connected: connected,
		}, nil
	}

	connected = true
	serverName := "NATS Server"
	serverID := ""
	if msg, err := uc.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), constants.DefaultRequestTimeout); err == nil && msg != nil {
		var response struct {
			Data   json.RawMessage `json:"data"`
			Server struct {
				Name string `json:"name"`
				ID   string `json:"id"`
			} `json:"server"`
		}
		if err := json.Unmarshal(msg.Data, &response); err != nil {
			log.Printf("Failed to unmarshal server ping response: %v", err)
		} else {
			if response.Server.Name != "" {
				serverName = response.Server.Name
			}
			serverID = response.Server.ID
		}
	}

	connz, err := uc.getConnz()
	if err != nil {
		connections = append(connections, &models.Connection{
			CID:          0,
			Type:         "monitoring",
			Name:         "current",
			User:         "",
			IP:           uc.nc.ConnectedUrl(),
			Server:       serverName,
			ServerID:     serverID,
			SubsCount:    0,
			ConnectedAt:  time.Now(),
			LastActivity: time.Now(),
		})
		return &Connections{
			List:      connections,
			Total:     len(connections),
			Connected: connected,
		}, nil
	}

	for _, conn := range connz.Data.Connections {
		connectedAt := parseServerTime(conn.Start)
		lastActivity := parseServerTime(conn.LastActivity)
		connections = append(connections, &models.Connection{
			CID:          conn.CID,
			Type:         conn.Type,
			Name:         conn.Name,
			User:         conn.User,
			IP:           conn.IP,
			Port:         conn.Port,
			Server:       connz.ServerName(serverName),
			ServerID:     connz.ServerID(serverID),
			SubsCount:    conn.Subscriptions,
			RTT:          conn.RTT,
			PendingBytes: conn.PendingBytes,
			InMsgs:       conn.InMsgs,
			OutMsgs:      conn.OutMsgs,
			InBytes:      conn.InBytes,
			OutBytes:     conn.OutBytes,
			ConnectedAt:  connectedAt,
			LastActivity: lastActivity,
		})
	}

	return &Connections{
		List:      connections,
		Total:     connz.TotalConnections(),
		Connected: connected,
	}, nil
}

// TerminateConnection closes a NATS client connection by CID using the server KICK request.
func (uc *ServerUseCase) TerminateConnection(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("connection id is required")
	}

	cid, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid connection id: %w", err)
	}

	connz, err := uc.getConnz()
	if err != nil {
		return fmt.Errorf("failed to get connection list: %w", err)
	}

	found := false
	for _, conn := range connz.Data.Connections {
		if conn.CID == cid {
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("connection %s not found", id)
	}

	serverID := connz.ServerID("")
	if serverID == "" {
		return fmt.Errorf("server id not found for connection %s", id)
	}

	payload, _ := json.Marshal(map[string]uint64{"cid": cid})
	if err := uc.nc.Publish(fmt.Sprintf("$SYS.REQ.SERVER.%s.KICK", serverID), payload); err != nil {
		return fmt.Errorf("failed to request connection termination: %w", err)
	}
	if err := uc.nc.Flush(); err != nil {
		return fmt.Errorf("failed to flush termination request: %w", err)
	}

	return nil
}

type connzResponse struct {
	Data struct {
		NumConnections int `json:"num_connections"`
		Total          int `json:"total"`
		Offset         int `json:"offset"`
		Limit          int `json:"limit"`
		Connections    []struct {
			CID           uint64 `json:"cid"`
			Type          string `json:"type"`
			IP            string `json:"ip"`
			Port          int    `json:"port"`
			Start         string `json:"start"`
			LastActivity  string `json:"last_activity"`
			RTT           string `json:"rtt"`
			PendingBytes  int64  `json:"pending_bytes"`
			InMsgs        int64  `json:"in_msgs"`
			OutMsgs       int64  `json:"out_msgs"`
			InBytes       int64  `json:"in_bytes"`
			OutBytes      int64  `json:"out_bytes"`
			Subscriptions int    `json:"subscriptions"`
			Name          string `json:"name"`
			User          string `json:"user"`
		} `json:"connections"`
	} `json:"data"`
	Server struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"server"`
}

func (r connzResponse) TotalConnections() int {
	if r.Data.Total > 0 {
		return r.Data.Total
	}
	if r.Data.NumConnections > 0 {
		return r.Data.NumConnections
	}
	return len(r.Data.Connections)
}

func (r connzResponse) ServerName(fallback string) string {
	if r.Server.Name != "" {
		return r.Server.Name
	}
	return fallback
}

func (r connzResponse) ServerID(fallback string) string {
	if r.Server.ID != "" {
		return r.Server.ID
	}
	return fallback
}

func (uc *ServerUseCase) getConnz() (*connzResponse, error) {
	payload, _ := json.Marshal(map[string]any{
		"subscriptions": false,
		"offset":        0,
		"limit":         1024,
	})
	msg, err := uc.nc.Request("$SYS.REQ.SERVER.PING.CONNZ", payload, constants.DefaultRequestTimeout)
	if err != nil {
		return nil, err
	}

	var response connzResponse
	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

func parseServerTime(value string) time.Time {
	if value == "" {
		return time.Time{}
	}
	if parsed, err := time.Parse(time.RFC3339Nano, value); err == nil {
		return parsed
	}
	return time.Time{}
}

// SubjectInfo represents subject information
type SubjectInfo struct {
	Name     string
	Count    int64
	LastSeen string
}

// GetSubjects returns subject information from stream configurations and active subscriptions
func (uc *ServerUseCase) GetSubjects(ctx context.Context) ([]*SubjectInfo, error) {
	subjectsByName := make(map[string]*SubjectInfo)

	streamMsg, err := uc.nc.Request(constants.APIStreamList, []byte(`{"subjects_filter":">"}`), constants.LongRequestTimeout)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream list: %w", err)
	}

	var streamResponse struct {
		Streams []struct {
			Config struct {
				Subjects []string `json:"subjects"`
			} `json:"config"`
			State struct {
				Messages uint64 `json:"messages"`
			} `json:"state"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(streamMsg.Data, &streamResponse); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	for _, stream := range streamResponse.Streams {
		for _, subject := range stream.Config.Subjects {
			if subject == "" {
				continue
			}
			info := subjectsByName[subject]
			if info == nil {
				info = &SubjectInfo{Name: subject}
				subjectsByName[subject] = info
			}
			info.Count += int64(stream.State.Messages)
		}
	}

	uc.mergeActiveSubscriptionSubjects(subjectsByName)

	subjects := make([]*SubjectInfo, 0, len(subjectsByName))
	for _, subject := range subjectsByName {
		if subject.Name != "" {
			subjects = append(subjects, subject)
		}
	}

	return subjects, nil
}

func (uc *ServerUseCase) mergeActiveSubscriptionSubjects(subjects map[string]*SubjectInfo) {
	payload, _ := json.Marshal(map[string]any{
		"subscriptions": true,
		"offset":        0,
		"limit":         1024,
	})
	msg, err := uc.nc.Request("$SYS.REQ.SERVER.PING.SUBSZ", payload, constants.DefaultRequestTimeout)
	if err != nil {
		return
	}

	var response struct {
		Data struct {
			NumSubscriptions int `json:"num_subscriptions"`
			Total            int `json:"total"`
			Subscriptions    []struct {
				Subject string `json:"subject"`
			} `json:"subscriptions"`
		} `json:"data"`
	}
	if err := json.Unmarshal(msg.Data, &response); err != nil {
		return
	}

	for _, sub := range response.Data.Subscriptions {
		if sub.Subject == "" || isInternalSubject(sub.Subject) {
			continue
		}
		info := subjects[sub.Subject]
		if info == nil {
			info = &SubjectInfo{Name: sub.Subject}
			subjects[sub.Subject] = info
		}
		info.Count++
	}
}

func isInternalSubject(subject string) bool {
	return subject == "" || subject[0] == '$'
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

func isUnlimited(val uint64) bool {
	return val == math.MaxUint64
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

	memoryMax := uint64(accountInfo.Limits.MaxMemory)
	if isUnlimited(memoryMax) {
		memoryMax = 0
	}
	memoryUsage := 0.0
	if memoryMax > 0 {
		memoryUsage = float64(accountInfo.Tier.Memory) / float64(memoryMax) * 100
	}

	storageMax := uint64(accountInfo.Limits.MaxStore)
	if isUnlimited(storageMax) {
		storageMax = 0
	}
	storageUsage := 0.0
	if storageMax > 0 {
		storageUsage = float64(accountInfo.Tier.Store) / float64(storageMax) * 100
	}

	return &SystemMetrics{
		MemoryUsed:   accountInfo.Tier.Memory,
		MemoryMax:    memoryMax,
		MemoryUsage:  memoryUsage,
		StorageUsed:  accountInfo.Tier.Store,
		StorageMax:   storageMax,
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
