package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/amir-baghshahy/nats-monitor/internal/constants"
	"github.com/amir-baghshahy/nats-monitor/internal/dto"
	"github.com/amir-baghshahy/nats-monitor/internal/models"
	usecase "github.com/amir-baghshahy/nats-monitor/internal/services"
	"github.com/amir-baghshahy/nats-monitor/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

// ConsumerHandler handles HTTP requests for consumers
type ConsumerHandler struct {
	useCase        *usecase.ConsumerUseCase
	messageUseCase *usecase.MessageUseCase
	nc             *nats.Conn            // For cross-stream operations (e.g., finding consumer by name across streams)
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
		useCase:        useCase,
		messageUseCase: messageUseCase,
		nc:             nc,
		js:             js,
	}
}

// ListConsumers handles GET /consumers
// @Summary List consumers for a stream
// @Tags consumers
// @Accept json
// @Produce json
// @Param stream query string true "Stream name"
// @Success 200 {array} dto.ConsumerResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /consumers [get]
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
// @Summary Get consumer details
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Success 200 {object} dto.ConsumerResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer} [get]
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
// @Summary Create a consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param request body dto.CreateConsumerRequest true "Consumer creation request"
// @Success 201 {object} dto.ConsumerResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers [post]
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

	consumer := &models.Consumer{
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
// @Summary Update a consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param request body dto.UpdateConsumerRequest true "Consumer update request"
// @Success 200 {object} dto.ConsumerResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer} [put]
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

	consumer := &models.Consumer{
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
// @Summary Delete a consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer} [delete]
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

// ResetLag handles POST /streams/:name/consumers/:consumer/lag-reset
// @Summary Reset consumer lag
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param request body dto.ResetLagRequest false "Reset lag options"
// @Success 200 {object} dto.ResetLagResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/lag-reset [post]
func (h *ConsumerHandler) ResetLag(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.ResetLagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Sequence = 0 // Default to 0 if body is empty
	}

	resetReq := &models.LagResetRequest{
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
// @Summary Replay messages to consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param request body dto.ReplayRequest false "Replay options"
// @Success 200 {object} dto.ReplayResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/replay [post]
func (h *ConsumerHandler) Replay(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	var req dto.ReplayRequest
	c.ShouldBindJSON(&req) // Don't fail if body is empty

	replayReq := &models.ReplayRequest{
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
// @Summary Pause a consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/pause [post]
func (h *ConsumerHandler) Pause(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	req := &models.PauseRequest{
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
// @Summary Resume a paused consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/resume [post]
func (h *ConsumerHandler) Resume(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	req := &models.ResumeRequest{
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

// pauseSentinel is the MaxDeliver value used to mark a paused consumer.
// -2 is chosen because NATS uses -1 for unlimited and 0 as the Go zero-value
// default, so -2 cannot be confused with either a default or an unlimited consumer.
const pauseSentinel = -2

// fetchStreamNames returns the list of stream names by querying NATS.
func (h *ConsumerHandler) fetchStreamNames() ([]string, error) {
	streamMsg, err := h.nc.Request(
		constants.APIStreamList,
		[]byte{},
		constants.DefaultRequestTimeout,
	)
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

	if err := json.Unmarshal(streamMsg.Data, &streamResponse); err != nil {
		return nil, fmt.Errorf("failed to parse stream list: %w", err)
	}

	names := make([]string, 0, len(streamResponse.Streams))
	for _, s := range streamResponse.Streams {
		names = append(names, s.Config.Name)
	}
	return names, nil
}

// ListAll handles GET /consumers without stream filter
// @Summary List all consumers across all streams
// @Tags consumers
// @Accept json
// @Produce json
// @Success 200 {array} dto.ConsumerResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /consumers [get]
func (h *ConsumerHandler) ListAll(c *gin.Context) {
	streamNames, err := h.fetchStreamNames()
	if err != nil {
		status := http.StatusInternalServerError
		if strings.HasPrefix(err.Error(), "NATS unavailable") {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, dto.ErrorResponse{Error: err.Error()})
		return
	}

	type consumerListResponse struct {
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

	type streamResult struct {
		streamName string
		consumers  []dto.ConsumerResponse
	}

	results := make([]streamResult, len(streamNames))
	var wg sync.WaitGroup
	wg.Add(len(streamNames))

	for i, name := range streamNames {
		i, name := i, name
		go func() {
			defer wg.Done()
			subject := fmt.Sprintf("%s.%s", constants.APIConsumerList, name)
			msg, err := h.nc.Request(subject, []byte{}, constants.DefaultRequestTimeout)
			if err != nil {
				return
			}

			var response consumerListResponse
			if err := json.Unmarshal(msg.Data, &response); err != nil {
				return
			}

			consumers := make([]dto.ConsumerResponse, 0, len(response.Consumers))
			for _, consumer := range response.Consumers {
				durable := consumer.Config.Durable
				if durable == "" {
					durable = consumer.Name
				}
				consumers = append(consumers, dto.ConsumerResponse{
					Name:       consumer.Name,
					Stream:     name,
					Status:     "active",
					Lag:        consumer.State.NumPending,
					AckRate:    "",
					NumPending: consumer.State.NumPending,
					Paused:     consumer.Config.MaxDeliver == pauseSentinel,
					Config: &dto.ConsumerConfigResponse{
						Durable:       durable,
						AckPolicy:     consumer.Config.AckPolicy,
						DeliverPolicy: consumer.Config.DeliverPolicy,
						ReplayPolicy:  consumer.Config.ReplayPolicy,
						MaxDeliver:    int64(consumer.Config.MaxDeliver),
					},
				})
			}
			results[i] = streamResult{streamName: name, consumers: consumers}
		}()
	}

	wg.Wait()

	allConsumers := []dto.ConsumerResponse{}
	for _, r := range results {
		allConsumers = append(allConsumers, r.consumers...)
	}

	c.JSON(http.StatusOK, allConsumers)
}

// GetConsumerByName handles GET /consumers/:name
// @Summary Get consumer by name across all streams
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Consumer name"
// @Success 200 {object} dto.ConsumerResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /consumers/{name} [get]
func (h *ConsumerHandler) GetConsumerByName(c *gin.Context) {
	name := c.Param("name")

	streamNames, err := h.fetchStreamNames()
	if err != nil {
		status := http.StatusInternalServerError
		if strings.HasPrefix(err.Error(), "NATS unavailable") {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, dto.ErrorResponse{Error: err.Error()})
		return
	}

	for _, streamName := range streamNames {
		consumerInfo, err := h.js.ConsumerInfo(streamName, name)
		if err == nil && consumerInfo != nil {
			durable := consumerInfo.Config.Durable
			if durable == "" {
				durable = consumerInfo.Name
			}

			c.JSON(http.StatusOK, dto.ConsumerResponse{
				Name:       consumerInfo.Name,
				Stream:     streamName,
				Status:     "active",
				Lag:        consumerInfo.NumPending,
				AckRate:    "",
				NumPending: consumerInfo.NumPending,
				Paused:     consumerInfo.Config.MaxDeliver == pauseSentinel,
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

// DeleteStreamMessage handles DELETE /streams/:name/messages/:sequence
// @Summary Delete a message from a stream
// @Tags messages
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param sequence path string true "Message sequence number"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/messages/{sequence} [delete]
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
// @Summary Publish a message to a stream
// @Tags messages
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param request body dto.PublishMessageRequest true "Message to publish"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/messages/publish [post]
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
// @Summary Get pending messages for a consumer
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param limit query int false "Maximum number of messages to return" default(25)
// @Success 200 {object} dto.PendingMessagesResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/pending [get]
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
// @Summary Acknowledge a message
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param request body dto.AckMessageRequest true "Acknowledgment request"
// @Success 200 {object} dto.AckMessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/ack [post]
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

	if err := h.useCase.AckMessage(c.Request.Context(), streamName, consumerName, req.Sequence); err != nil {
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
// @Summary Negatively acknowledge a message
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param request body dto.NackMessageRequest true "Negative acknowledgment request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/nack [post]
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

	if err := h.useCase.NackMessage(c.Request.Context(), streamName, consumerName, req.Sequence); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to negatively acknowledge message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Message negatively acknowledged"})
}

// AckTermMessage handles POST /streams/:name/consumers/:consumer/term
// @Summary Terminate a message
// @Tags consumers
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param request body dto.AckTermMessageRequest true "Termination request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/consumers/{consumer}/term [post]
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

	if err := h.useCase.TerminateMessage(c.Request.Context(), streamName, consumerName, req.Sequence); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to terminate message",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Message acknowledged and terminated"})
}
