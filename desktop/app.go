package desktop

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/constants"
	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/amir-baghshahy/nats-horizon/internal/models"
	"github.com/amir-baghshahy/nats-horizon/internal/repositories"
	"github.com/amir-baghshahy/nats-horizon/internal/services"
	"github.com/nats-io/nats.go"
)

type App struct {
	ctx context.Context

	nc *nats.Conn
	js nats.JetStreamContext

	streamUseCase  *services.StreamUseCase
	consumerUseCase *services.ConsumerUseCase
	messageUseCase *services.MessageUseCase
	serverUseCase  *services.ServerUseCase

	natsURL string
}

func NewApp() *App {
	return &App{}
}

func (a *App) StartUp(ctx context.Context) {
	a.ctx = ctx
	a.natsURL = "nats://localhost:4222"

	go a.connectNATS(a.natsURL)
}

func (a *App) connectNATS(natsURL string) {
	log.Printf("Desktop: Connecting to NATS at %s...", natsURL)

	nc, err := nats.Connect(natsURL,
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(2*time.Second),
		nats.Timeout(5*time.Second),
		nats.DrainTimeout(30*time.Second),
		nats.PingInterval(2*time.Minute),
		nats.MaxPingsOutstanding(5),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			log.Printf("NATS disconnected: %v", err)
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			log.Printf("NATS reconnected to %s", nc.ConnectedUrl())
		}),
	)
	if err != nil {
		log.Printf("Desktop: NATS not available at %s (will retry): %v", natsURL, err)
		return
	}

	if err := nc.Flush(); err != nil {
		nc.Close()
		log.Printf("Desktop: NATS flush failed: %v", err)
		return
	}

	if !nc.IsConnected() {
		nc.Close()
		log.Printf("Desktop: NATS connection not established")
		return
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		log.Printf("Desktop: JetStream not available: %v", err)
		return
	}

	a.nc = nc
	a.js = js
	a.natsURL = natsURL

	streamRepo := repositories.NewNATSStreamRepository(nc, js)
	consumerRepo := repositories.NewNATSConsumerRepository(nc, js)
	messageRepo := repositories.NewNATSMessageRepository(nc, js)

	a.streamUseCase = services.NewStreamUseCase(streamRepo)
	a.consumerUseCase = services.NewConsumerUseCase(consumerRepo)
	a.messageUseCase = services.NewMessageUseCase(messageRepo)
	a.serverUseCase = services.NewServerUseCase(nc, js)

	log.Println("Desktop: Connected to NATS")
}

func (a *App) ShutDown(ctx context.Context) {
	log.Println("Desktop: Shutting down...")
	if a.nc != nil {
		a.nc.Close()
	}
	log.Println("Desktop: Shutdown complete")
}

func (a *App) GetNATSURL() string {
	return a.natsURL
}

func (a *App) IsConnected() bool {
	return a.nc != nil && a.nc.IsConnected()
}

func (a *App) SetNATSURL(url string) error {
	if a.nc != nil {
		a.nc.Close()
	}

	nc, err := nats.Connect(url,
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(2*time.Second),
		nats.Timeout(30*time.Second),
	)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}

	if err := nc.Flush(); err != nil {
		nc.Close()
		return fmt.Errorf("failed to flush NATS connection: %w", err)
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return fmt.Errorf("failed to get JetStream context: %w", err)
	}

	a.nc = nc
	a.js = js
	a.natsURL = url

	streamRepo := repositories.NewNATSStreamRepository(nc, js)
	consumerRepo := repositories.NewNATSConsumerRepository(nc, js)
	messageRepo := repositories.NewNATSMessageRepository(nc, js)

	a.streamUseCase = services.NewStreamUseCase(streamRepo)
	a.consumerUseCase = services.NewConsumerUseCase(consumerRepo)
	a.messageUseCase = services.NewMessageUseCase(messageRepo)
	a.serverUseCase = services.NewServerUseCase(nc, js)

	return nil
}

func (a *App) GetDashboardStats() (*dto.DashboardStatsResponse, error) {
	stats, err := a.serverUseCase.GetDashboardStats(context.Background())
	if err != nil {
		return &dto.DashboardStatsResponse{ServerStatus: "disconnected"}, nil
	}
	return &dto.DashboardStatsResponse{
		Streams:      stats.Streams,
		Consumers:    stats.Consumers,
		Messages:     stats.Messages,
		Bytes:        stats.Bytes,
		Connections:  stats.Connections,
		ServerStatus: stats.Status,
	}, nil
}

func (a *App) GetServerInfo() (interface{}, error) {
	return a.serverUseCase.GetServerInfo(context.Background())
}

func (a *App) GetStreams() ([]dto.StreamResponse, error) {
	streams, err := a.streamUseCase.ListStreams(context.Background())
	if err != nil {
		return nil, err
	}
	return streamsToResponse(streams), nil
}

func (a *App) GetStream(name string) (*dto.StreamResponse, error) {
	stream, err := a.streamUseCase.GetStream(context.Background(), name)
	if err != nil {
		return nil, err
	}
	return streamToResponse(stream), nil
}

func (a *App) CreateStream(name string, subjects []string, storage string, retention string, replicas int, maxAge string, maxBytes uint64) (*dto.StreamResponse, error) {
	stream := &services.StreamCreate{
		Name:      name,
		Subjects:  subjects,
		Storage:   storage,
		Retention: retention,
		Replicas:  replicas,
		MaxAge:    maxAge,
		MaxBytes:  maxBytes,
	}
	result, err := a.streamUseCase.CreateStream(context.Background(), stream)
	if err != nil {
		return nil, err
	}
	return streamToResponse(result), nil
}

func (a *App) DeleteStream(name string) error {
	return a.streamUseCase.DeleteStream(context.Background(), name)
}

func (a *App) PurgeStream(name string, subject string, sequence uint64) (uint64, error) {
	return a.streamUseCase.PurgeStream(context.Background(), name, subject, sequence)
}

func (a *App) GetConsumers(streamName string) ([]dto.ConsumerResponse, error) {
	consumers, err := a.consumerUseCase.ListConsumers(context.Background(), streamName)
	if err != nil {
		return nil, err
	}
	return consumersToResponse(consumers), nil
}

func (a *App) GetAllConsumers() ([]dto.ConsumerResponse, error) {
	msg, err := a.nc.Request(constants.APIStreamList, []byte{}, constants.DefaultRequestTimeout)
	if err != nil {
		return nil, fmt.Errorf("NATS unavailable: %w", err)
	}

	var streamResponse struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(msg.Data, &streamResponse); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	var allConsumers []dto.ConsumerResponse
	for _, s := range streamResponse.Streams {
		consumers, err := a.consumerUseCase.ListConsumers(context.Background(), s.Config.Name)
		if err != nil {
			continue
		}
		allConsumers = append(allConsumers, consumersToResponse(consumers)...)
	}

	return allConsumers, nil
}

func (a *App) GetConsumer(streamName, consumerName string) (*dto.ConsumerResponse, error) {
	consumer, err := a.consumerUseCase.GetConsumer(context.Background(), streamName, consumerName)
	if err != nil {
		return nil, err
	}
	return consumerToResponse(consumer), nil
}

func (a *App) DeleteConsumer(streamName, consumerName string) error {
	return a.consumerUseCase.DeleteConsumer(context.Background(), streamName, consumerName)
}

func (a *App) PauseConsumer(streamName, consumerName string) error {
	return a.consumerUseCase.PauseConsumer(context.Background(), &models.PauseRequest{
		StreamName:   streamName,
		ConsumerName: consumerName,
	})
}

func (a *App) ResumeConsumer(streamName, consumerName string) error {
	return a.consumerUseCase.ResumeConsumer(context.Background(), &models.ResumeRequest{
		StreamName:   streamName,
		ConsumerName: consumerName,
	})
}

func (a *App) GetMessages(stream string, limit int) (interface{}, error) {
	if limit <= 0 {
		limit = 25
	}
	if limit > constants.MaxFetchCount {
		limit = constants.MaxFetchCount
	}

	messages, err := a.messageUseCase.ListMessages(context.Background(), stream, models.MessageFilter{
		Limit: limit,
	})
	if err != nil {
		return nil, err
	}

	result := make([]dto.StreamMessage, 0, len(messages))
	for _, msg := range messages {
		result = append(result, dto.StreamMessage{
			Subject:    msg.Subject,
			Sequence:   msg.Sequence,
			Data:       string(msg.Data),
			DataBase64: base64.StdEncoding.EncodeToString(msg.Data),
			Headers:    msg.Headers,
			Timestamp:  msg.Timestamp.Format(time.RFC3339),
			Size:       len(msg.Data),
		})
	}

	return dto.StreamMessagesResponse{
		Stream:   stream,
		Messages: result,
		Total:    len(messages),
	}, nil
}

func (a *App) PublishMessage(subject, payload string) error {
	return a.messageUseCase.PublishToStream(context.Background(), subject, []byte(payload))
}

func (a *App) GetConnections() (*dto.ConnectionsResponse, error) {
	conns, err := a.serverUseCase.GetConnections(context.Background())
	if err != nil {
		return nil, err
	}

	connections := make([]dto.ConnectionInfo, len(conns.List))
	for i, conn := range conns.List {
		connections[i] = dto.ConnectionInfo{
			CID:          conn.CID,
			Type:         conn.Type,
			Name:         conn.Name,
			User:         conn.User,
			IP:           conn.IP,
			Port:         conn.Port,
			Server:       conn.Server,
			ServerID:     conn.ServerID,
			SubsCount:    conn.SubsCount,
			RTT:          conn.RTT,
			PendingBytes: conn.PendingBytes,
			InMsgs:       conn.InMsgs,
			OutMsgs:      conn.OutMsgs,
			InBytes:      conn.InBytes,
			OutBytes:     conn.OutBytes,
			ConnectedAt:  conn.ConnectedAt.Format(time.RFC3339),
			LastActivity: conn.LastActivity.Format(time.RFC3339),
		}
	}

	return &dto.ConnectionsResponse{
		Connections: connections,
		Total:       conns.Total,
	}, nil
}

func (a *App) GetKVBuckets() ([]dto.KVBucketInfo, error) {
	storeNames := []string{}
	offset := 0
	limit := 256

	for {
		req := fmt.Sprintf(`{"offset":%d,"limit":%d}`, offset, limit)
		msg, err := a.nc.Request("$JS.API.STREAM.LIST", []byte(req), 5*time.Second)
		if err != nil {
			return nil, fmt.Errorf("failed to list streams: %w", err)
		}

		var response struct {
			Streams []struct {
				Config struct {
					Name   string `json:"name"`
					Sealed bool   `json:"sealed"`
					Mirror *struct {
						Name string `json:"name"`
					} `json:"mirror"`
					Sources []struct {
						Name string `json:"name"`
					} `json:"sources"`
				} `json:"config"`
			} `json:"streams"`
			Total  int `json:"total"`
			Offset int `json:"offset"`
		}

		if err := json.Unmarshal(msg.Data, &response); err != nil {
			return nil, fmt.Errorf("failed to parse response: %w", err)
		}

		for _, stream := range response.Streams {
			name := stream.Config.Name
			if stream.Config.Sealed || stream.Config.Mirror != nil || len(stream.Config.Sources) > 0 {
				continue
			}
			if len(name) > 3 && name[:3] == "KV_" {
				storeNames = append(storeNames, name)
			}
		}

		if offset+len(response.Streams) >= response.Total {
			break
		}
		offset += len(response.Streams)
	}

	buckets := []dto.KVBucketInfo{}
	for _, name := range storeNames {
		bucketName := name[3:]
		kv, err := a.js.KeyValue(bucketName)
		if err != nil {
			kv, err = a.js.KeyValue(name)
			if err != nil {
				continue
			}
		}

		status, err := kv.Status()
		if err != nil {
			continue
		}

		buckets = append(buckets, dto.KVBucketInfo{
			Name:       name,
			BucketName: bucketName,
			Values:     status.Values(),
			Bytes:      status.Bytes(),
		})
	}

	return buckets, nil
}

func (a *App) GetKVKeys(bucketName string) ([]dto.KVKeyEntry, error) {
	kv, err := a.js.KeyValue(bucketName)
	if err != nil {
		return nil, fmt.Errorf("bucket not found: %w", err)
	}

	keysList, err := kv.Keys()
	if err != nil {
		return nil, err
	}

	keys := []dto.KVKeyEntry{}
	for _, key := range keysList {
		entry, err := kv.Get(key)
		if err != nil {
			continue
		}
		keys = append(keys, dto.KVKeyEntry{
			Key:      key,
			Value:    string(entry.Value()),
			Revision: entry.Revision(),
			Created:  entry.Created(),
		})
	}

	return keys, nil
}

func (a *App) GetClusterInfo() (*dto.ClusterInfoResponse, error) {
	serverName := ""
	clusterName := "standalone"
	clusterURL := ""
	isClustered := false
	jsDomain := ""
	jsTier := "standard"
	jsAPI := "0"

	msg, err := a.nc.Request("$JS.API.SERVER.PING", []byte{}, 2*time.Second)
	if err == nil && msg != nil {
		var serverInfo struct {
			Name       string `json:"server_name"`
			Cluster    string `json:"cluster"`
			ClusterURL string `json:"cluster_url"`
		}
		if err := json.Unmarshal(msg.Data, &serverInfo); err == nil {
			serverName = serverInfo.Name
			clusterName = serverInfo.Cluster
			clusterURL = serverInfo.ClusterURL
			isClustered = serverInfo.Cluster != ""
			if !isClustered {
				clusterName = "standalone"
			}
		}
	}

	if serverName == "" {
		serverName = a.nc.ConnectedUrl()
	}

	accountInfo, err := a.js.AccountInfo()
	if err == nil {
		jsDomain = accountInfo.Domain
		jsTier = "standard"
		jsAPI = fmt.Sprintf("%d", accountInfo.API.Level)
	}

	return &dto.ClusterInfoResponse{
		ClusterName: clusterName,
		IsClustered: isClustered,
		ServerName:  serverName,
		ClusterURL:  clusterURL,
		JetStream: dto.ClusterJetStreamInfo{
			Enabled:  true,
			Domain:   jsDomain,
			Tier:     jsTier,
			APILevel: jsAPI,
		},
	}, nil
}

func (a *App) GetSecurityInfo() (interface{}, error) {
	accountName := "Unknown"
	importsCount := 0
	exportsCount := 0
	connectionsLimit := 0
	subsLimit := 0
	dataLimit := 0
	payloadLimit := 0

	accountMsg, err := a.nc.Request("$JS.API.ACCOUNT.INFO", []byte("{}"), 2*time.Second)
	if err == nil && accountMsg != nil {
		var accountResp struct {
			Type    string `json:"type"`
			Account struct {
				Name    string `json:"name"`
				Domain  string `json:"domain"`
				Imports struct {
					Count int `json:"count"`
				} `json:"imports"`
				Exports struct {
					Count int `json:"count"`
				} `json:"exports"`
			} `json:"account"`
			Limits struct {
				Connected int `json:"connected"`
				Subs      int `json:"subs"`
				Data      int `json:"data"`
				Payload   int `json:"payload"`
			} `json:"limits"`
		}
		if err := json.Unmarshal(accountMsg.Data, &accountResp); err == nil {
			accountName = accountResp.Account.Name
			importsCount = accountResp.Account.Imports.Count
			exportsCount = accountResp.Account.Exports.Count
			connectionsLimit = accountResp.Limits.Connected
			subsLimit = accountResp.Limits.Subs
			dataLimit = accountResp.Limits.Data
			payloadLimit = accountResp.Limits.Payload
		}
	}

	var serverResp struct {
		AuthRequired bool `json:"auth_required"`
		TLSRequired  bool `json:"tls_required"`
		TLSVerify    bool `json:"tls_verify"`
	}
	serverMsg, err := a.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), 2*time.Second)
	if err == nil && serverMsg != nil {
		json.Unmarshal(serverMsg.Data, &serverResp)
	}

	return map[string]interface{}{
		"account": map[string]interface{}{
			"name":    accountName,
			"imports": importsCount,
			"exports": exportsCount,
		},
		"limits": map[string]interface{}{
			"connections":   connectionsLimit,
			"subscriptions": subsLimit,
			"data":          dataLimit,
			"payload":       payloadLimit,
		},
		"server_security": map[string]interface{}{
			"auth_required": serverResp.AuthRequired,
			"tls_required":  serverResp.TLSRequired,
			"tls_verify":    serverResp.TLSVerify,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}, nil
}

func (a *App) GetAlerts() (interface{}, error) {
	return []interface{}{}, nil
}

func (a *App) GetSystemMetrics() (interface{}, error) {
	metrics, err := a.serverUseCase.GetSystemMetrics(context.Background())
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"memory": map[string]interface{}{
			"used":  metrics.MemoryUsed,
			"max":   metrics.MemoryMax,
			"usage": metrics.MemoryUsage,
		},
		"storage": map[string]interface{}{
			"used":  metrics.StorageUsed,
			"max":   metrics.StorageMax,
			"usage": metrics.StorageUsage,
		},
		"connections": metrics.Connections,
		"streams":     metrics.Streams,
		"consumers":   metrics.Consumers,
		"timestamp":   metrics.Timestamp,
	}, nil
}

func (a *App) GetSubjects() (*dto.SubjectsResponse, error) {
	subjects, err := a.serverUseCase.GetSubjects(context.Background())
	if err != nil {
		return nil, err
	}

	result := make([]dto.SubjectInfo, len(subjects))
	for i, s := range subjects {
		result[i] = dto.SubjectInfo{
			Name:     s.Name,
			Count:    s.Count,
			LastSeen: s.LastSeen,
		}
	}

	return &dto.SubjectsResponse{
		Subjects: result,
		Total:    len(result),
	}, nil
}

func (a *App) GetHistory(streamName, metricType, duration string) (interface{}, error) {
	if metricType == "" {
		metricType = "messages"
	}
	if duration == "" {
		duration = "24h"
	}

	return map[string]interface{}{
		"stream":   streamName,
		"metric":   metricType,
		"duration": duration,
		"data":     []interface{}{},
		"count":    0,
	}, nil
}
