package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
	"nats-monitoring/internal/constants"
	"nats-monitoring/internal/domain"
	"nats-monitoring/internal/dto"
	"nats-monitoring/internal/usecase"
	"nats-monitoring/internal/utils"
)

// ConsumerHandler handles HTTP requests for consumers
type ConsumerHandler struct {
	useCase        *usecase.ConsumerUseCase
	messageUseCase  *usecase.MessageUseCase
	nc             *nats.Conn // For cross-stream operations (e.g., finding consumer by name across streams)
	js             nats.JetStreamContext // For cross-stream operations
}

// NewConsumerHandler creates a new consumer handler
func NewConsumerHandler(
	useCase *usecase.ConsumerUseCase,
	messageUseCase *usecase.MessageUseCase,
	nc *nats.Conn,
	js nats.JetStreamContext,
) *ConsumerHandler {
	return &ConsumerHandler{
		useCase:       useCase,
		messageUseCase: messageUseCase,
		nc:            nc,
		js:            js,
	}
}

// ============================================================================
// Basic CRUD Operations
// ============================================================================

// ListConsumers handles GET /consumers
func (h *ConsumerHandler) ListConsumers(c *gin.Context) {
	streamName := c.Query("stream")
	if streamName == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "stream query parameter is required",
		})
		return
	}

	consumers, err := h.useCase.ListConsumers(c.Request.Context(), streamName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to list consumers",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ConsumersToResponse(consumers))
}

// GetConsumer handles GET /streams/:name/consumers/:consumer
func (h *ConsumerHandler) GetConsumer(c *gin.Context) {
	streamName := c.Param("name")
	name := c.Param("consumer")

	consumer, err := h.useCase.GetConsumer(c.Request.Context(), streamName, name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Consumer not found",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ConsumerToResponse(consumer))
}

// CreateConsumer handles POST /streams/:name/consumers
func (h *ConsumerHandler) CreateConsumer(c *gin.Context) {
	streamName := c.Param("name")
	var req dto.CreateConsumerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	consumer := &domain.Consumer{
		Name:          req.Name,
		AckPolicy:     req.AckPolicy,
		DeliverPolicy: req.DeliverPolicy,
		ReplayPolicy:  req.ReplayPolicy,
		MaxDeliver:    req.MaxDeliver,
		Stream:        streamName,
	}

	result, err := h.useCase.CreateConsumer(c.Request.Context(), streamName, consumer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create consumer",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, utils.ConsumerToResponse(result))
}

// UpdateConsumer handles PUT /streams/:name/consumers/:consumer
func (h *ConsumerHandler) UpdateConsumer(c *gin.Context) {
	streamName := c.Param("name")
	name := c.Param("consumer")
	var req dto.UpdateConsumerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	consumer := &domain.Consumer{
		Name:          name,
		AckPolicy:     req.AckPolicy,
		DeliverPolicy: req.DeliverPolicy,
		ReplayPolicy:  req.ReplayPolicy,
		MaxDeliver:    req.MaxDeliver,
		Stream:        streamName,
	}

	result, err := h.useCase.UpdateConsumer(c.Request.Context(), streamName, consumer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update consumer",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ConsumerToResponse(result))
}

// DeleteConsumer handles DELETE /streams/:name/consumers/:consumer
func (h *ConsumerHandler) DeleteConsumer(c *gin.Context) {
	streamName := c.Param("name")
	name := c.Param("consumer")

	if err := h.useCase.DeleteConsumer(c.Request.Context(), streamName, name); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete consumer",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Consumer deleted successfully"})
}

// ============================================================================
// Consumer Operations
// ============================================================================

// ResetLag handles POST /streams/:name/consumers/:consumer/lag-reset
func (h *ConsumerHandler) ResetLag(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.ResetLagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Sequence = 0 // Default to 0 if body is empty
	}

	resetReq := &domain.LagResetRequest{
		StreamName:   streamName,
		ConsumerName: consumerName,
		Sequence:     req.Sequence,
	}

	if err := h.useCase.ResetLag(c.Request.Context(), resetReq); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to reset lag",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.ResetLagResponse{
		Message:     "Lag reset successful",
		NewSequence: req.Sequence,
	})
}

// Replay handles POST /streams/:name/consumers/:consumer/replay
func (h *ConsumerHandler) Replay(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.ReplayRequest
	c.ShouldBindJSON(&req) // Don't fail if body is empty

	replayReq := &domain.ReplayRequest{
		StreamName:    streamName,
		ConsumerName:  consumerName,
		StartSequence: req.StartSequence,
		EndSequence:   req.EndSequence,
		FilterSubject: req.FilterSubject,
	}

	replayID, err := h.useCase.ReplayMessages(c.Request.Context(), replayReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to start replay",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.ReplayResponse{
		ReplayID: replayID,
		Message:  "Replay started",
	})
}

// Pause handles POST /streams/:name/consumers/:consumer/pause
func (h *ConsumerHandler) Pause(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	req := &domain.PauseRequest{
		StreamName:   streamName,
		ConsumerName: consumerName,
	}

	if err := h.useCase.PauseConsumer(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to pause consumer",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Consumer paused successfully"})
}

// Resume handles POST /streams/:name/consumers/:consumer/resume
func (h *ConsumerHandler) Resume(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	req := &domain.ResumeRequest{
		StreamName:   streamName,
		ConsumerName: consumerName,
	}

	if err := h.useCase.ResumeConsumer(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to resume consumer",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Consumer resumed successfully"})
}

// ============================================================================
// Cross-Stream Operations (Direct NATS Access)
// ============================================================================

// ListAll handles GET /consumers without stream filter
func (h *ConsumerHandler) ListAll(c *gin.Context) {
	streamMsg, err := h.nc.Request(
		constants.APIStreamList,
		[]byte{},
		constants.DefaultRequestTimeout,
	)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{
			Error: "NATS unavailable",
		})
		return
	}

	var streamResponse struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(streamMsg.Data, &streamResponse); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to parse stream list",
			Details: err.Error(),
		})
		return
	}

	allConsumers := []dto.ConsumerResponse{}

	for _, stream := range streamResponse.Streams {
		subject := fmt.Sprintf("%s.%s", constants.APIConsumerList, stream.Config.Name)
		msg, err := h.nc.Request(subject, []byte{}, constants.DefaultRequestTimeout)
		if err != nil {
			continue
		}

		var response struct {
			Consumers []struct {
				Name   string `json:"name"`
				Config struct {
					Durable       string `json:"durable"`
					AckPolicy     string `json:"ack_policy"`
					DeliverPolicy string `json:"deliver_policy"`
					ReplayPolicy  string `json:"replay_policy"`
					MaxDeliver    int    `json:"max_deliver"`
				} `json:"config"`
				State struct {
					NumPending uint64 `json:"num_pending"`
				} `json:"state"`
			} `json:"consumers"`
		}

		if err := json.Unmarshal(msg.Data, &response); err != nil {
			continue
		}

		for _, consumer := range response.Consumers {
			durable := consumer.Config.Durable
			if durable == "" {
				durable = consumer.Name
			}

			allConsumers = append(allConsumers, dto.ConsumerResponse{
				Name:       consumer.Name,
				Stream:     stream.Config.Name,
				Status:     "active",
				Lag:        consumer.State.NumPending,
				AckRate:    "",
				NumPending: consumer.State.NumPending,
				Paused:     consumer.Config.MaxDeliver == 0,
				Config: &dto.ConsumerConfigResponse{
					Durable:       durable,
					AckPolicy:     consumer.Config.AckPolicy,
					DeliverPolicy: consumer.Config.DeliverPolicy,
					ReplayPolicy:  consumer.Config.ReplayPolicy,
					MaxDeliver:    int64(consumer.Config.MaxDeliver),
				},
			})
		}
	}

	c.JSON(http.StatusOK, allConsumers)
}

// GetConsumerByName handles GET /consumers/:name
func (h *ConsumerHandler) GetConsumerByName(c *gin.Context) {
	name := c.Param("name")

	streamMsg, err := h.nc.Request(
		constants.APIStreamList,
		[]byte{},
		constants.DefaultRequestTimeout,
	)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{
			Error: "NATS unavailable",
		})
		return
	}

	var streamResponse struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(streamMsg.Data, &streamResponse); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to parse stream list",
			Details: err.Error(),
		})
		return
	}

	for _, stream := range streamResponse.Streams {
		consumerInfo, err := h.js.ConsumerInfo(stream.Config.Name, name)
		if err == nil && consumerInfo != nil {
			durable := consumerInfo.Config.Durable
			if durable == "" {
				durable = consumerInfo.Name
			}

			c.JSON(http.StatusOK, dto.ConsumerResponse{
				Name:       consumerInfo.Name,
				Stream:     stream.Config.Name,
				Status:     "active",
				Lag:        consumerInfo.NumPending,
				AckRate:    "",
				NumPending: consumerInfo.NumPending,
				Paused:     consumerInfo.Config.MaxDeliver == 0,
				Config: &dto.ConsumerConfigResponse{
					Durable:       durable,
					AckPolicy:     utils.AckPolicyToString(int(consumerInfo.Config.AckPolicy)),
					DeliverPolicy: utils.DeliverPolicyToString(int(consumerInfo.Config.DeliverPolicy)),
					ReplayPolicy:  utils.ReplayPolicyToString(int(consumerInfo.Config.ReplayPolicy)),
					MaxDeliver:    int64(consumerInfo.Config.MaxDeliver),
				},
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, dto.ErrorResponse{
		Error: "Consumer not found",
	})
}

// ============================================================================
// Message Operations
// ============================================================================

// DeleteStreamMessage handles DELETE /streams/:name/messages/:sequence
func (h *ConsumerHandler) DeleteStreamMessage(c *gin.Context) {
	streamName := c.Param("name")
	sequenceStr := c.Param("sequence")

	sequence, err := strconv.ParseUint(sequenceStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "Invalid sequence number",
		})
		return
	}

	if err := h.messageUseCase.DeleteMessage(c.Request.Context(), streamName, sequence); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Message deleted successfully"})
}

// PublishMessage handles POST /streams/:name/messages/publish
func (h *ConsumerHandler) PublishMessage(c *gin.Context) {
	var req dto.PublishMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	if len(req.Payload) > constants.MaxMessageSize {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: fmt.Sprintf("Message data exceeds maximum size of %d MB", constants.MaxMessageSize>>20),
		})
		return
	}

	if err := h.messageUseCase.PublishToStream(c.Request.Context(), req.Subject, []byte(req.Payload)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to publish message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Message published successfully"})
}

// GetPendingMessages handles GET /streams/:name/consumers/:consumer/pending
func (h *ConsumerHandler) GetPendingMessages(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")
	
	limit := constants.MaxFetchCount
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= constants.MaxFetchCount {
			limit = parsed
		}
	}

	messages, err := h.useCase.GetPendingMessages(c.Request.Context(), streamName, consumerName, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get pending messages",
			Details: err.Error(),
		})
		return
	}

	pendingMessages := make([]dto.PendingMessage, 0, len(messages))
	for _, msg := range messages {
		pendingMessages = append(pendingMessages, dto.PendingMessage{
			Sequence:  msg.Sequence,
			Subject:   msg.Subject,
			Data:      string(msg.Data),
			Timestamp: msg.Timestamp.Format(time.RFC3339),
			Stream:    streamName,
			Consumer:  consumerName,
		})
	}

	c.JSON(http.StatusOK, dto.PendingMessagesResponse{
		Consumer:   consumerName,
		Stream:     streamName,
		NumPending: uint64(len(messages)),
		Messages:   pendingMessages,
	})
}

// AckMessage handles POST /streams/:name/consumers/:consumer/ack
func (h *ConsumerHandler) AckMessage(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.AckMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	subject := fmt.Sprintf("$JS.ACK.%s.%s.%d", streamName, consumerName, req.Sequence)
	ackPayload := fmt.Sprintf(`{"stream":"%s","consumer":"%s","seq":%d}`, streamName, consumerName, req.Sequence)

	if err := h.nc.Publish(subject, []byte(ackPayload)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to acknowledge message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.AckMessageResponse{
		Message:  "Message acknowledged successfully",
		Sequence: req.Sequence,
	})
}

// NackMessage handles POST /streams/:name/consumers/:consumer/nack
func (h *ConsumerHandler) NackMessage(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.NackMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	nakPayload := map[string]interface{}{
		"stream":   streamName,
		"consumer": consumerName,
		"seq":      req.Sequence,
		"nak":      true,
	}
	if req.Delay > 0 {
		nakPayload["delay"] = req.Delay * 1_000_000_000 // Convert to nanoseconds
	}

	subject := fmt.Sprintf("$JS.ACK.%s.%s.%d", streamName, consumerName, req.Sequence)
	ackJSON, _ := json.Marshal(nakPayload)

	if err := h.nc.Publish(subject, ackJSON); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to negatively acknowledge message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Message negatively acknowledged"})
}

// AckTermMessage handles POST /streams/:name/consumers/:consumer/term
func (h *ConsumerHandler) AckTermMessage(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.AckTermMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	termPayload := map[string]interface{}{
		"stream":   streamName,
		"consumer": consumerName,
		"seq":      req.Sequence,
		"term":     true,
	}

	subject := fmt.Sprintf("$JS.ACK.%s.%s.%d", streamName, consumerName, req.Sequence)
	ackJSON, _ := json.Marshal(termPayload)

	if err := h.nc.Publish(subject, ackJSON); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to terminate message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Message acknowledged and terminated"})
}
