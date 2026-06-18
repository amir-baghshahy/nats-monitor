package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"nats-monitoring/internal/dto"
	"nats-monitoring/internal/services"
)

// ServerHandler handles server-related HTTP requests
type ServerHandler struct {
	useCase *services.ServerUseCase
}

// NewServerHandler creates a new server handler
func NewServerHandler(useCase *services.ServerUseCase) *ServerHandler {
	return &ServerHandler{useCase: useCase}
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
			Server:       conn.Server,
			SubsCount:    conn.SubsCount,
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
// @Description Lists messages from a stream. This endpoint currently returns 501 until message retrieval is implemented.
// @Tags messages
// @Produce json
// @Param stream query string true "Stream name"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 501 {object} dto.ErrorResponse
// @Router /messages [get]
func (h *ServerHandler) GetMessages(c *gin.Context) {
	stream := c.Query("stream")
	if stream == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "stream parameter required",
		})
		return
	}

	// This still requires the use case to be implemented
	// For now, keeping the old logic but marking for refactoring
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{
		Error: "Endpoint requires refactoring",
	})
}

// GetStreamMessagesByPage returns paginated messages from a stream
// @Summary Get paginated stream messages
// @Description Returns paginated messages from a stream. This endpoint currently returns 501 until message retrieval is implemented.
// @Tags messages
// @Produce json
// @Param stream query string true "Stream name"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(25)
// @Failure 400 {object} dto.ErrorResponse
// @Failure 501 {object} dto.ErrorResponse
// @Router /messages/page [get]
func (h *ServerHandler) GetStreamMessagesByPage(c *gin.Context) {
	stream := c.Query("stream")
	if stream == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "stream parameter required",
		})
		return
	}

	// This still requires the use case to be implemented
	// For now, keeping the old logic but marking for refactoring
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{
		Error: "Endpoint requires refactoring",
	})
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
// @Failure 501 {object} dto.ErrorResponse
// @Router /connections/{id} [delete]
func (h *ServerHandler) TerminateConnection(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{
		Error:   "Connection termination requires NATS monitoring",
		Details: "Feature not available without NATS server monitoring enabled",
		Code:    id,
	})
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
func GetServerInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"server_id": "nats-monitoring",
		"version":   "1.0.0",
		"connected": true,
	})
}

// formatTime converts time.Time to ISO string format
func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
