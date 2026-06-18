package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
	"nats-monitoring/internal/constants"
	"nats-monitoring/internal/dto"
)

// CoreNATShandler handles Core NATS (non-JetStream) operations
type CoreNATShandler struct {
	nc            *nats.Conn
	mu            sync.RWMutex
	subscriptions map[string]int
}

// NewCoreNATShandler creates a new Core NATS handler
func NewCoreNATShandler(nc *nats.Conn) *CoreNATShandler {
	return &CoreNATShandler{
		nc:            nc,
		subscriptions: make(map[string]int),
	}
}

func (h *CoreNATShandler) trackSubscribe(subject string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.subscriptions[subject]++
}

func (h *CoreNATShandler) trackUnsubscribe(subject string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if count := h.subscriptions[subject]; count <= 1 {
		delete(h.subscriptions, subject)
		return
	}
	h.subscriptions[subject]--
}

func (h *CoreNATShandler) activeSubscriptions() []dto.ActiveSubscription {
	h.mu.RLock()
	defer h.mu.RUnlock()

	subscriptions := make([]dto.ActiveSubscription, 0, len(h.subscriptions))
	for subject, count := range h.subscriptions {
		subscriptions = append(subscriptions, dto.ActiveSubscription{
			Subject: subject,
			Count:   count,
		})
	}
	return subscriptions
}

// PublishMessage publishes a message to a NATS subject
// @Summary Publish a Core NATS message
// @Description Publishes a message to a NATS subject (non-JetStream)
// @Tags core-nats
// @Accept json
// @Produce json
// @Param request body dto.PublishMessageRequest true "Message to publish"
// @Success 200 {object} dto.PublishMessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /core/publish [post]
func (h *CoreNATShandler) PublishMessage(c *gin.Context) {
	var req dto.PublishMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	// Validate payload size
	if len(req.Payload) > constants.MaxMessageSize {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Payload too large",
			Details: fmt.Sprintf("Maximum size is %d bytes", constants.MaxMessageSize),
		})
		return
	}

	msg := &nats.Msg{
		Subject: req.Subject,
		Reply:   req.ReplyTo,
		Data:    []byte(req.Payload),
		Header:  nats.Header(req.Headers),
	}

	if err := h.nc.PublishMsg(msg); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to publish message",
			Details: err.Error(),
		})
		return
	}

	if err := h.nc.Flush(); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to flush connection",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.PublishMessageResponse{
		Success:   true,
		Subject:   req.Subject,
		Size:      len(req.Payload),
		Timestamp: time.Now().Unix(),
	})
}

// Request sends a request and waits for response
// @Summary Send a Core NATS request
// @Description Publishes a request message and waits for a reply (request/reply pattern)
// @Tags core-nats
// @Accept json
// @Produce json
// @Param request body dto.RequestMessageRequest true "Request message"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 408 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /core/request [post]
func (h *CoreNATShandler) Request(c *gin.Context) {
	var req dto.RequestMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	if !h.nc.IsConnected() {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{
			Error: "NATS not connected",
		})
		return
	}

	timeout := time.Duration(constants.DefaultRequestTimeout)
	if req.Timeout > 0 {
		timeout = time.Duration(req.Timeout) * time.Millisecond
	}

	msg := &nats.Msg{
		Subject: req.Subject,
		Data:    []byte(req.Payload),
		Header:  nats.Header(req.Headers),
	}

	inbox := nats.NewInbox()
	sub, err := h.nc.SubscribeSync(inbox)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create reply subscription",
			Details: err.Error(),
		})
		return
	}
	defer sub.Unsubscribe()

	msg.Reply = inbox

	if err := h.nc.PublishMsg(msg); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to publish request",
			Details: err.Error(),
		})
		return
	}

	if err := h.nc.Flush(); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to flush connection",
			Details: err.Error(),
		})
		return
	}

	msgResp, err := sub.NextMsg(timeout)
	if err != nil {
		if err == nats.ErrTimeout {
			c.JSON(http.StatusRequestTimeout, dto.ErrorResponse{
				Error: "Request timeout - no response received",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to receive response",
			Details: err.Error(),
		})
		return
	}

	headers := make(map[string][]string)
	for k, v := range msgResp.Header {
		headers[k] = v
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Subject:   msgResp.Subject,
		Sequence:  0, // Not available in this context
		Data:      string(msgResp.Data),
		Headers:   headers,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// Subscribe subscribes to a NATS subject with SSE
// @Summary Subscribe to a subject (SSE stream)
// @Description Opens a Server-Sent Events stream of messages published to the given subject
// @Tags core-nats
// @Produce text/event-stream
// @Param subject query string true "NATS subject to subscribe to"
// @Success 200 {string} string "text/event-stream"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /core/subscribe [get]
func (h *CoreNATShandler) Subscribe(c *gin.Context) {
	subject := c.Query("subject")
	if subject == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "subject parameter required",
		})
		return
	}

	if strings.HasPrefix(subject, "$SYS.") || strings.HasPrefix(subject, "$JS.") {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "subscription to internal system subjects is not allowed",
		})
		return
	}

	h.trackSubscribe(subject)
	defer h.trackUnsubscribe(subject)

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "Streaming not supported",
		})
		return
	}

	sub, err := h.nc.Subscribe(subject, func(msg *nats.Msg) {
		headers := make(map[string][]string)
		for k, v := range msg.Header {
			headers[k] = v
		}

		msgInfo := dto.MessageInfo{
			Subject:    msg.Subject,
			Data:       string(msg.Data),
			DataBase64: base64.StdEncoding.EncodeToString(msg.Data),
			Reply:      msg.Reply,
			Headers:    headers,
			Timestamp:  time.Now().Unix(),
			Size:       len(msg.Data),
		}

		data, _ := json.Marshal(msgInfo)
		c.Writer.Write([]byte("data: " + string(data) + "\n\n"))
		flusher.Flush()
	})
	if err != nil {
		log.Printf("Subscribe error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to subscribe",
			Details: err.Error(),
		})
		return
	}
	defer sub.Unsubscribe()

	connMsg := dto.SSEConnectionMessage{
		Type:      "connected",
		Subject:   subject,
		Timestamp: time.Now().Unix(),
	}
	connData, _ := json.Marshal(connMsg)
	c.Writer.Write([]byte("data: " + string(connData) + "\n\n"))
	flusher.Flush()

	notify := c.Writer.CloseNotify()
	ticker := time.NewTicker(time.Duration(constants.SSEKeepaliveInterval))
	defer ticker.Stop()

	for {
		select {
		case <-notify:
			return
		case <-ticker.C:
			c.Writer.Write([]byte(": keepalive\n\n"))
			flusher.Flush()
		}
	}
}

// GetActiveSubscriptions returns currently active subscriptions info
// @Summary Get active subscriptions info
// @Description Returns connection status and active subscription information
// @Tags core-nats
// @Produce json
// @Success 200 {object} dto.SubscriptionsResponse
// @Router /core/subscriptions [get]
func (h *CoreNATShandler) GetActiveSubscriptions(c *gin.Context) {
	h.mu.RLock()
	status := h.nc.Status()
	server := h.nc.ConnectedUrl()
	h.mu.RUnlock()

	subscriptions := h.activeSubscriptions()
	total := 0
	for _, subscription := range subscriptions {
		total += subscription.Count
	}

	c.JSON(http.StatusOK, dto.SubscriptionsResponse{
		Status:        status.String(),
		Connected:     h.nc.IsConnected(),
		Server:        server,
		Count:         total,
		Subscriptions: subscriptions,
	})
}

// GetServiceDiscovery returns information about services in the NATS cluster
// @Summary Get service discovery info
// @Description Returns connection and server discovery information for the NATS cluster
// @Tags core-nats
// @Produce json
// @Success 200 {object} dto.ServiceDiscoveryResponse
// @Router /core/services [get]
func (h *CoreNATShandler) GetServiceDiscovery(c *gin.Context) {
	status := h.nc.Status()

	var serverResp struct {
		ServerName   string `json:"server_name"`
		Version      string `json:"version"`
		HostName     string `json:"host"`
		Port         int    `json:"port"`
		AuthRequired bool   `json:"auth_required"`
		TLSRequired  bool   `json:"tls_required"`
		MaxPayload   int64  `json:"max_payload"`
	}

	serverInfo, err := h.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), constants.DefaultRequestTimeout)
	if err == nil && serverInfo != nil {
		_ = json.Unmarshal(serverInfo.Data, &serverResp)
	}

	connectedUrl := h.nc.ConnectedUrl()
	servers := h.nc.Servers()
	serverCount := 0
	if servers != nil {
		serverCount = len(servers)
	}

	c.JSON(http.StatusOK, dto.ServiceDiscoveryResponse{
		Connected:    h.nc.IsConnected(),
		Status:       status.String(),
		ServerURL:    connectedUrl,
		ServerCount:  serverCount,
		ServerName:   serverResp.ServerName,
		Version:      serverResp.Version,
		Host:         serverResp.HostName,
		Port:         serverResp.Port,
		MaxPayload:   serverResp.MaxPayload,
		AuthRequired: serverResp.AuthRequired,
		TLSRequired:  serverResp.TLSRequired,
	})
}

// MonitorTraffic starts a traffic monitoring session
// @Summary Monitor subject traffic (SSE stream)
// @Description Opens a Server-Sent Events stream of traffic for the given subjects
// @Tags core-nats
// @Produce text/event-stream
// @Param subjects query []string true "Subjects to monitor (repeatable)"
// @Success 200 {string} string "text/event-stream"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /core/monitor [get]
func (h *CoreNATShandler) MonitorTraffic(c *gin.Context) {
	subjects := c.QueryArray("subjects")
	if len(subjects) == 0 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "subjects parameter required; provide at least one subject to monitor",
		})
		return
	}

	for _, subject := range subjects {
		h.trackSubscribe(subject)
	}
	defer func() {
		for _, subject := range subjects {
			h.trackUnsubscribe(subject)
		}
	}()

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "Streaming not supported",
		})
		return
	}

	type TrafficStats struct {
		Subject  string
		Count    int64
		Bytes    int64
		LastSeen int64
	}
	stats := make(map[string]*TrafficStats)
	var mu sync.Mutex

	subs := make([]*nats.Subscription, 0, len(subjects))

	for _, subject := range subjects {
		sub, err := h.nc.Subscribe(subject, func(msg *nats.Msg) {
			mu.Lock()
			if _, exists := stats[msg.Subject]; !exists {
				stats[msg.Subject] = &TrafficStats{Subject: msg.Subject}
			}
			s := stats[msg.Subject]
			s.Count++
			s.Bytes += int64(len(msg.Data))
			s.LastSeen = time.Now().Unix()
			mu.Unlock()

			msgInfo := gin.H{
				"type":      "message",
				"subject":   msg.Subject,
				"reply":     msg.Reply,
				"size":      len(msg.Data),
				"timestamp": time.Now().Unix(),
			}

			if len(msg.Data) < 4096 {
				msgInfo["data"] = string(msg.Data)
				msgInfo["data_base64"] = base64.StdEncoding.EncodeToString(msg.Data)
			}

			data, _ := json.Marshal(msgInfo)
			c.Writer.Write([]byte("data: " + string(data) + "\n\n"))
			flusher.Flush()
		})
		if err != nil {
			log.Printf("Failed to subscribe to %s: %v", subject, err)
			continue
		}
		subs = append(subs, sub)
	}

	c.Writer.Write([]byte("event: connected\ndata: {\"type\":\"connected\",\"subjects\":" + fmt.Sprintf("%q", subjects) + "}\n\n"))
	flusher.Flush()

	notify := c.Writer.CloseNotify()
	ticker := time.NewTicker(time.Duration(constants.SSEStatsInterval))
	defer ticker.Stop()

	for {
		select {
		case <-notify:
			for _, sub := range subs {
				sub.Unsubscribe()
			}
			return
		case <-ticker.C:
			mu.Lock()
			statsList := make([]gin.H, 0, len(stats))
			for _, s := range stats {
				statsList = append(statsList, gin.H{
					"subject":   s.Subject,
					"count":     s.Count,
					"bytes":     s.Bytes,
					"last_seen": s.LastSeen,
				})
			}
			mu.Unlock()

			statsMsg := gin.H{
				"type":      "stats",
				"stats":     statsList,
				"timestamp": time.Now().Unix(),
			}
			data, _ := json.Marshal(statsMsg)
			c.Writer.Write([]byte("event: stats\ndata: " + string(data) + "\n\n"))
			flusher.Flush()
		}
	}
}
