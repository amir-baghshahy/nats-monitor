package handlers

import (
	"encoding/base64"
	"net/http"
	"strconv"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/constants"
	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/amir-baghshahy/nats-horizon/internal/models"
	"github.com/amir-baghshahy/nats-horizon/internal/services"

	"github.com/gin-gonic/gin"
)

// ServerHandler handles server-related HTTP requests
type ServerHandler struct {
	useCase        *services.ServerUseCase
	messageUseCase *services.MessageUseCase
	streamUseCase  *services.StreamUseCase
}

// NewServerHandler creates a new server handler
func NewServerHandler(useCase *services.ServerUseCase, messageUseCase *services.MessageUseCase, streamUseCase *services.StreamUseCase) *ServerHandler {
	return &ServerHandler{useCase: useCase, messageUseCase: messageUseCase, streamUseCase: streamUseCase}
}

// GetDashboardStats returns dashboard statistics
// @Summary Get dashboard statistics
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} dto.DashboardStatsResponse
// @Failure 503 {object} dto.DashboardStatsResponse
// @Router /dashboard/stats [get]
func (h *ServerHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.useCase.GetDashboardStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, dto.DashboardStatsResponse{
			ServerStatus: "disconnected",
		})
		return
	}

	c.JSON(http.StatusOK, dto.DashboardStatsResponse{
		Streams:      stats.Streams,
		Consumers:    stats.Consumers,
		Messages:     stats.Messages,
		Bytes:        stats.Bytes,
		Connections:  stats.Connections,
		ServerStatus: stats.Status,
	})
}

// GetAccountInfo returns detailed JetStream account information
// @Summary Get JetStream account information
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} object "Account information"
// @Failure 500 {object} dto.ErrorResponse
// @Router /account/info [get]
func (h *ServerHandler) GetAccountInfo(c *gin.Context) {
	info, err := h.useCase.GetAccountInfo(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get account info",
			Details: err.Error(),
		})
		return
	}

	// Create a simplified account info response
	response := gin.H{
		"memory":  info.Memory,
		"storage": info.Storage,
		"streams": info.Streams,
		"consumers": gin.H{
			"count": info.Consumers,
		},
		"limits": gin.H{
			"max_memory":    info.MaxMemory,
			"max_storage":   info.MaxStorage,
			"max_streams":   info.MaxStreams,
			"max_consumers": info.MaxConsumers,
		},
		"domain": info.Domain,
	}

	c.JSON(http.StatusOK, response)
}

// GetConnections returns connection info
// @Summary Get NATS connections
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} dto.ConnectionsResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /connections [get]
func (h *ServerHandler) GetConnections(c *gin.Context) {
	conns, err := h.useCase.GetConnections(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get connections",
			Details: err.Error(),
		})
		return
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
			ConnectedAt:  formatTime(conn.ConnectedAt),
			LastActivity: formatTime(conn.LastActivity),
		}
	}

	c.JSON(http.StatusOK, dto.ConnectionsResponse{
		Connections: connections,
		Total:       conns.Total,
	})
}

// GetSubjects returns subject information from stream configurations
// @Summary Get subject information
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} dto.SubjectsResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /subjects [get]
func (h *ServerHandler) GetSubjects(c *gin.Context) {
	subjects, err := h.useCase.GetSubjects(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get subjects",
			Details: err.Error(),
		})
		return
	}

	result := make([]dto.SubjectInfo, len(subjects))
	for i, s := range subjects {
		result[i] = dto.SubjectInfo{
			Name:     s.Name,
			Count:    s.Count,
			LastSeen: s.LastSeen,
		}
	}

	c.JSON(http.StatusOK, dto.SubjectsResponse{
		Subjects: result,
		Total:    len(result),
	})
}

// GetMessages returns messages from a stream
// @Summary Get stream messages
// @Description Lists messages from a stream
// @Tags messages
// @Produce json
// @Param stream query string true "Stream name"
// @Param limit query int false "Maximum number of messages to return" default(25)
// @Success 200 {object} dto.StreamMessagesResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /messages [get]
func (h *ServerHandler) GetMessages(c *gin.Context) {
	stream := c.Query("stream")
	if stream == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "stream parameter required"})
		return
	}

	limit := 25
	if value := c.Query("limit"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > constants.MaxFetchCount {
		limit = constants.MaxFetchCount
	}

	messages, err := h.messageUseCase.ListMessages(c.Request.Context(), stream, models.MessageFilter{
		Limit: limit,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get messages",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.StreamMessagesResponse{
		Stream:   stream,
		Messages: toStreamMessages(messages),
		Total:    len(messages),
	})
}

// GetStreamMessagesByPage returns paginated messages from a stream
// @Summary Get paginated stream messages
// @Description Returns paginated messages from a stream.
// @Tags messages
// @Produce json
// @Param stream query string true "Stream name"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(25)
// @Success 200 {object} dto.PaginatedMessagesResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /messages/page [get]
func (h *ServerHandler) GetStreamMessagesByPage(c *gin.Context) {
	stream := c.Query("stream")
	if stream == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "stream parameter required"})
		return
	}

	page := 1
	if value := c.Query("page"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 25
	if value := c.Query("page_size"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			pageSize = parsed
		}
	}
	if pageSize > constants.MaxFetchCount {
		pageSize = constants.MaxFetchCount
	}

	// Get stream info for total count and sequence bounds
	streamInfo, err := h.streamUseCase.GetStream(c.Request.Context(), stream)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Stream not found", Details: err.Error()})
		return
	}

	total := streamInfo.Messages

	offset := uint64((page - 1) * pageSize)
	var startSeq uint64
	if offset < total {
		startSeq = streamInfo.FirstSeq + offset
	} else {
		startSeq = streamInfo.LastSeq + 1
	}

	messages, err := h.messageUseCase.ListMessages(c.Request.Context(), stream, models.MessageFilter{
		Limit:    pageSize,
		Sequence: startSeq,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get messages",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.PaginatedMessagesResponse{
		Stream:   stream,
		Page:     page,
		PageSize: pageSize,
		Total:    int(total),
		Messages: toStreamMessages(messages),
	})
}

func toStreamMessages(messages []*models.Message) []dto.StreamMessage {
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
	return result
}

// GetSystemMetrics returns system metrics from NATS server
// @Summary Get system metrics
// @Tags metrics
// @Accept json
// @Produce json
// @Success 200 {object} object "System metrics"
// @Failure 500 {object} dto.ErrorResponse
// @Router /metrics/system [get]
func (h *ServerHandler) GetSystemMetrics(c *gin.Context) {
	metrics, err := h.useCase.GetSystemMetrics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get system metrics",
			Details: err.Error(),
		})
		return
	}

	response := gin.H{
		"memory": gin.H{
			"used":  metrics.MemoryUsed,
			"max":   metrics.MemoryMax,
			"usage": metrics.MemoryUsage,
		},
		"storage": gin.H{
			"used":  metrics.StorageUsed,
			"max":   metrics.StorageMax,
			"usage": metrics.StorageUsage,
		},
		"connections": metrics.Connections,
		"streams":     metrics.Streams,
		"consumers":   metrics.Consumers,
		"timestamp":   metrics.Timestamp,
	}

	c.JSON(http.StatusOK, response)
}

// GetRateMetrics returns message rate metrics for streams
// @Summary Get rate metrics
// @Tags metrics
// @Accept json
// @Produce json
// @Param duration query int false "Duration in seconds" default(60)
// @Success 200 {object} object "Rate metrics"
// @Failure 500 {object} dto.ErrorResponse
// @Router /metrics/rates [get]
func (h *ServerHandler) GetRateMetrics(c *gin.Context) {
	duration := 60
	if d := c.Query("duration"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			duration = parsed
		}
	}

	metrics, err := h.useCase.GetRateMetrics(c.Request.Context(), duration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get rate metrics",
			Details: err.Error(),
		})
		return
	}

	streamMetrics := make([]gin.H, len(metrics))
	for i, m := range metrics {
		streamMetrics[i] = gin.H{
			"name":     m.Name,
			"messages": m.Messages,
			"bytes":    m.Bytes,
			"first_ts": m.FirstTs,
			"last_ts":  m.LastTs,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"streams":   streamMetrics,
		"duration":  duration,
		"timestamp": time.Now().Unix(),
	})
}

// TerminateConnection handles DELETE /connections/:id
// @Summary Terminate a connection
// @Tags health
// @Accept json
// @Produce json
// @Param id path string true "Connection ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /connections/{id} [delete]
func (h *ServerHandler) TerminateConnection(c *gin.Context) {
	id := c.Param("id")
	if err := h.useCase.TerminateConnection(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to terminate connection",
			Details: err.Error(),
			Code:    id,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Connection terminated successfully"})
}

// HealthCheck handles GET /health
// @Summary Get system health status
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} dto.HealthResponse
// @Failure 503 {object} dto.HealthResponse
// @Router /health [get]
func HealthCheck(useCase *services.ServerUseCase) gin.HandlerFunc {
	return func(c *gin.Context) {
		conns, err := useCase.GetConnections(c.Request.Context())
		if err != nil || !conns.Connected {
			c.JSON(http.StatusServiceUnavailable, dto.HealthResponse{
				Status: "unhealthy",
				NATS:   "disconnected",
			})
			return
		}
		c.JSON(http.StatusOK, dto.HealthResponse{
			Status:    "ok",
			NATS:      "connected",
			Timestamp: time.Now().Format(time.RFC3339),
		})
	}
}

// GetServerInfo handles GET /server/info
// @Summary Get server information
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} object "Server information"
// @Router /server/info [get]
func (h *ServerHandler) GetServerInfo(c *gin.Context) {
	info, err := h.useCase.GetServerInfo(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get server info",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, info)
}

// formatTime converts time.Time to ISO string format

func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
