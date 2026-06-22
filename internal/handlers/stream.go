package handlers

import (
	"net/http"
	"strings"

	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/amir-baghshahy/nats-horizon/internal/services"
	"github.com/amir-baghshahy/nats-horizon/internal/utils"
	"github.com/gin-gonic/gin"
)

// StreamHandler handles HTTP requests for streams
type StreamHandler struct {
	useCase *services.StreamUseCase
}

// NewStreamHandler creates a new stream handler
func NewStreamHandler(useCase *services.StreamUseCase) *StreamHandler {
	return &StreamHandler{useCase: useCase}
}

// ListStreams handles GET /streams
// @Summary List all streams
// @Tags streams
// @Accept json
// @Produce json
// @Success 200 {array} dto.StreamResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams [get]
func (h *StreamHandler) ListStreams(c *gin.Context) {
	streams, err := h.useCase.ListStreams(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to list streams",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, utils.StreamsToResponse(streams))
}

// GetStream handles GET /streams/:name
// @Summary Get stream details
// @Tags streams
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Success 200 {object} dto.StreamResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name} [get]
func (h *StreamHandler) GetStream(c *gin.Context) {
	name := c.Param("name")
	stream, err := h.useCase.GetStream(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Stream not found",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, utils.StreamToResponse(stream))
}

// CreateStream handles POST /streams
// @Summary Create a new stream
// @Tags streams
// @Accept json
// @Produce json
// @Param request body dto.CreateStreamRequest true "Stream creation request"
// @Success 201 {object} dto.StreamResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams [post]
func (h *StreamHandler) CreateStream(c *gin.Context) {
	var req dto.CreateStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	stream := &services.StreamCreate{
		Name:      req.Name,
		Subjects:  req.Subjects,
		Storage:   req.Storage,
		Retention: req.Retention,
		Replicas:  req.Replicas,
		MaxAge:    req.MaxAge,
		MaxBytes:  req.MaxBytes,
	}

	result, err := h.useCase.CreateStream(c.Request.Context(), stream)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create stream",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, utils.StreamToResponse(result))
}

// UpdateStream handles PUT /streams/:name
// @Summary Update a stream
// @Tags streams
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param request body dto.UpdateStreamRequest true "Stream update request"
// @Success 200 {object} dto.StreamResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name} [put]
func (h *StreamHandler) UpdateStream(c *gin.Context) {
	name := c.Param("name")
	var req dto.UpdateStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	stream := &services.StreamUpdate{
		Name:     name,
		Subjects: req.Subjects,
		Replicas: req.Replicas,
		MaxAge:   req.MaxAge,
		MaxBytes: req.MaxBytes,
	}

	result, err := h.useCase.UpdateStream(c.Request.Context(), stream)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "does not exist") {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Stream not found", Details: err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to update stream", Details: err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, utils.StreamToResponse(result))
}

// DeleteStream handles DELETE /streams/:name
// @Summary Delete a stream
// @Tags streams
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name} [delete]
func (h *StreamHandler) DeleteStream(c *gin.Context) {
	name := c.Param("name")
	if err := h.useCase.DeleteStream(c.Request.Context(), name); err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "does not exist") {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Stream not found", Details: err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to delete stream", Details: err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Stream deleted successfully"})
}

// PurgeStream handles POST /streams/:name/purge
// @Summary Purge messages from a stream
// @Tags streams
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param request body dto.PurgeStreamRequest false "Purge options"
// @Success 200 {object} dto.PurgeStreamResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /streams/{name}/purge [post]
func (h *StreamHandler) PurgeStream(c *gin.Context) {
	name := c.Param("name")
	var req dto.PurgeStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Details: err.Error(),
		})
		return
	}

	remaining, err := h.useCase.PurgeStream(c.Request.Context(), name, req.Subject, req.Sequence)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "does not exist") {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Stream not found", Details: err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to purge stream", Details: err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, dto.PurgeStreamResponse{
		Remaining: remaining,
		Message:   "Stream purged successfully",
	})
}
