package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/amir-baghshahy/nats-monitor/internal/dto"
	"github.com/amir-baghshahy/nats-monitor/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

func storageTypeToString(storage int) string {
	switch storage {
	case 0:
		return "file"
	case 1:
		return "memory"
	default:
		return fmt.Sprintf("%d", storage)
	}
}

// ExportHandler handles data export operations
type ExportHandler struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewExportHandler creates a new export handler
func NewExportHandler(nc *nats.Conn, js nats.JetStreamContext) *ExportHandler {
	return &ExportHandler{nc: nc, js: js}
}

// ExportFormat represents the export format
type ExportFormat string

const (
	FormatJSON ExportFormat = "json"
	FormatCSV  ExportFormat = "csv"
	FormatTXT  ExportFormat = "txt"
)

// ExportRequest represents an export request
type ExportRequest struct {
	ResourceType string                 `json:"resource_type"` // "stream", "consumer", "metrics", "messages"
	ResourceName string                 `json:"resource_name"`
	Format       ExportFormat           `json:"format"`
	Options      map[string]interface{} `json:"options"`
}

// ExportStream exports stream data
// @Summary Export a stream
// @Description Exports stream data in the requested format (json, csv, txt)
// @Tags export
// @Produce json
// @Param name path string true "Stream name"
// @Param format query string false "Export format (json, csv, txt)" default(json)
// @Param include_messages query boolean false "Include messages in the export"
// @Success 200 {file} file "Exported stream data"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /export/streams/{name} [get]
func (h *ExportHandler) ExportStream(c *gin.Context) {
	streamName := c.Param("name")
	format := ExportFormat(c.DefaultQuery("format", "json"))
	includeMessages := c.Query("include_messages") == "true"

	info, err := h.js.StreamInfo(streamName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "stream not found"})
		return
	}

	switch format {
	case FormatCSV:
		h.exportStreamCSV(c, info, includeMessages)
	case FormatJSON:
		h.exportStreamJSON(c, info, includeMessages)
	case FormatTXT:
		h.exportStreamTXT(c, info, includeMessages)
	default:
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "unsupported format"})
	}
}

// exportStreamCSV exports stream data as CSV
func (h *ExportHandler) exportStreamCSV(c *gin.Context, info *nats.StreamInfo, includeMessages bool) {
	c.Writer.Header().Set("Content-Type", "text/csv")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-%s.csv", info.Config.Name, time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"Property", "Value"})
	writer.Write([]string{"Name", info.Config.Name})
	writer.Write([]string{"Subjects", strings.Join(info.Config.Subjects, ", ")})
	writer.Write([]string{"Messages", fmt.Sprintf("%d", info.State.Msgs)})
	writer.Write([]string{"Bytes", fmt.Sprintf("%d", info.State.Bytes)})
	writer.Write([]string{"Consumers", fmt.Sprintf("%d", info.State.Consumers)})
	writer.Write([]string{"Created", info.State.FirstTime.Format(time.RFC3339)})
	writer.Write([]string{"Storage", storageTypeToString(int(info.Config.Storage))})
	writer.Write([]string{"Replicas", fmt.Sprintf("%d", info.Config.Replicas)})
}

// exportStreamJSON exports stream data as JSON
func (h *ExportHandler) exportStreamJSON(c *gin.Context, info *nats.StreamInfo, includeMessages bool) {
	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-%s.json", info.Config.Name, time.Now().Format("2006-01-02")))

	data := gin.H{
		"exported_at": time.Now().Format(time.RFC3339),
		"stream": gin.H{
			"name":     info.Config.Name,
			"subjects": info.Config.Subjects,
			"config": gin.H{
				"subjects":     info.Config.Subjects,
				"retention":    info.Config.Retention,
				"max_age":      info.Config.MaxAge,
				"max_bytes":    info.Config.MaxBytes,
				"max_msg_size": info.Config.MaxMsgSize,
				"storage":      storageTypeToString(int(info.Config.Storage)),
				"replicas":     info.Config.Replicas,
			},
			"state": gin.H{
				"messages":  info.State.Msgs,
				"bytes":     info.State.Bytes,
				"consumers": info.State.Consumers,
				"first_seq": info.State.FirstSeq,
				"last_seq":  info.State.LastSeq,
				"created":   info.State.FirstTime.Format(time.RFC3339),
			},
		},
	}

	json.NewEncoder(c.Writer).Encode(data)
}

// exportStreamTXT exports stream data as plain text
func (h *ExportHandler) exportStreamTXT(c *gin.Context, info *nats.StreamInfo, includeMessages bool) {
	c.Writer.Header().Set("Content-Type", "text/plain")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-%s.txt", info.Config.Name, time.Now().Format("2006-01-02")))

	output := fmt.Sprintf(`
NATS Stream Export
==================
Stream Name: %s
Export Date: %s

Configuration
-------------
Subjects: %s
Retention: %s
Max Age: %v
Max Bytes: %d
Storage: %s
Replicas: %d

State
-----
Messages: %d
Bytes: %d
Consumers: %d
First Sequence: %d
Last Sequence: %d
Created: %s
`,
		info.Config.Name,
		time.Now().Format(time.RFC3339),
		strings.Join(info.Config.Subjects, ", "),
		info.Config.Retention,
		info.Config.MaxAge,
		info.Config.MaxBytes,
		storageTypeToString(int(info.Config.Storage)),
		info.Config.Replicas,
		info.State.Msgs,
		info.State.Bytes,
		info.State.Consumers,
		info.State.FirstSeq,
		info.State.LastSeq,
		info.State.FirstTime.Format(time.RFC3339),
	)

	c.Writer.WriteString(output)
}

// ExportConsumer exports consumer data
// @Summary Export a consumer
// @Description Exports consumer data in the requested format (json, csv, txt)
// @Tags export
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Param format query string false "Export format (json, csv, txt)" default(json)
// @Success 200 {file} file "Exported consumer data"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /export/streams/{name}/consumers/{consumer} [get]
func (h *ExportHandler) ExportConsumer(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")
	format := ExportFormat(c.DefaultQuery("format", "json"))

	info, err := h.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "consumer not found"})
		return
	}

	switch format {
	case FormatCSV:
		h.exportConsumerCSV(c, streamName, info)
	case FormatJSON:
		h.exportConsumerJSON(c, streamName, info)
	case FormatTXT:
		h.exportConsumerTXT(c, streamName, info)
	default:
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "unsupported format"})
	}
}

// exportConsumerCSV exports consumer data as CSV
func (h *ExportHandler) exportConsumerCSV(c *gin.Context, streamName string, info *nats.ConsumerInfo) {
	c.Writer.Header().Set("Content-Type", "text/csv")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-%s.csv", info.Name, time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"Property", "Value"})
	writer.Write([]string{"Consumer Name", info.Name})
	writer.Write([]string{"Stream", streamName})
	writer.Write([]string{"Created", info.Created.Format(time.RFC3339)})
	writer.Write([]string{"Pending Messages", fmt.Sprintf("%d", info.NumPending)})
	writer.Write([]string{"Delivered", fmt.Sprintf("%d", info.Delivered.Stream)})
	writer.Write([]string{"Ack Floor", fmt.Sprintf("%d", info.AckFloor.Stream)})
	writer.Write([]string{"Ack Policy", utils.AckPolicyToString(int(info.Config.AckPolicy))})
	writer.Write([]string{"Deliver Policy", utils.DeliverPolicyToString(int(info.Config.DeliverPolicy))})
	writer.Write([]string{"Replay Policy", utils.ReplayPolicyToString(int(info.Config.ReplayPolicy))})
	writer.Write([]string{"Max Deliver", fmt.Sprintf("%d", info.Config.MaxDeliver)})
}

// exportConsumerJSON exports consumer data as JSON
func (h *ExportHandler) exportConsumerJSON(c *gin.Context, streamName string, info *nats.ConsumerInfo) {
	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-%s.json", info.Name, time.Now().Format("2006-01-02")))

	data := gin.H{
		"exported_at": time.Now().Format(time.RFC3339),
		"stream":      streamName,
		"consumer": gin.H{
			"name":    info.Name,
			"created": info.Created.Format(time.RFC3339),
			"config": gin.H{
				"durable":        info.Config.Durable,
				"ack_policy":     utils.AckPolicyToString(int(info.Config.AckPolicy)),
				"deliver_policy": utils.DeliverPolicyToString(int(info.Config.DeliverPolicy)),
				"replay_policy":  utils.ReplayPolicyToString(int(info.Config.ReplayPolicy)),
				"max_deliver":    info.Config.MaxDeliver,
				"filter_subject": info.Config.FilterSubject,
			},
			"state": gin.H{
				"pending":   info.NumPending,
				"delivered": info.Delivered,
				"ack_floor": info.AckFloor,
			},
		},
	}

	json.NewEncoder(c.Writer).Encode(data)
}

// exportConsumerTXT exports consumer data as plain text
func (h *ExportHandler) exportConsumerTXT(c *gin.Context, streamName string, info *nats.ConsumerInfo) {
	c.Writer.Header().Set("Content-Type", "text/plain")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-%s.txt", info.Name, time.Now().Format("2006-01-02")))

	output := fmt.Sprintf(`
NATS Consumer Export
====================
Consumer Name: %s
Stream: %s
Export Date: %s

Configuration
-------------
Durable: %s
Ack Policy: %s
Deliver Policy: %s
Replay Policy: %s
Max Deliver: %d
Filter Subject: %s

State
-----
Pending Messages: %d
Delivered: %d
Ack Floor: %d
Created: %s
`,
		info.Name,
		streamName,
		time.Now().Format(time.RFC3339),
		info.Config.Durable,
		utils.AckPolicyToString(int(info.Config.AckPolicy)),
		utils.DeliverPolicyToString(int(info.Config.DeliverPolicy)),
		utils.ReplayPolicyToString(int(info.Config.ReplayPolicy)),
		info.Config.MaxDeliver,
		info.Config.FilterSubject,
		info.NumPending,
		info.Delivered.Stream,
		info.AckFloor.Stream,
		info.Created.Format(time.RFC3339),
	)

	c.Writer.WriteString(output)
}

// ExportMessages exports messages from a stream
// @Summary Export messages from a stream
// @Description Exports messages from a stream, optionally filtered by subject, as JSON
// @Tags export
// @Accept json
// @Produce json
// @Param name path string true "Stream name"
// @Param subject query string false "Filter subject"
// @Param request body object false "Export options" example({"subject":"orders.created","limit":1000})
// @Success 200 {file} file "Exported messages"
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /export/streams/{name}/messages [post]
func (h *ExportHandler) ExportMessages(c *gin.Context) {
	streamName := c.Param("name")
	subject := c.Query("subject")
	limit := 1000

	var req struct {
		Subject string `json:"subject"`
		Limit   int    `json:"limit"`
	}
	c.ShouldBindJSON(&req)

	if req.Subject != "" {
		subject = req.Subject
	}
	if req.Limit > 0 && req.Limit <= 10000 {
		limit = req.Limit
	}

	consumerName := fmt.Sprintf("export-%s-%d", streamName, time.Now().UnixNano())

	cfg := &nats.ConsumerConfig{
		Durable:       consumerName,
		AckPolicy:     nats.AckNonePolicy,
		DeliverPolicy: nats.DeliverAllPolicy,
		FilterSubject: subject,
	}

	if _, err := h.js.AddConsumer(streamName, cfg); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: fmt.Sprintf("failed to create consumer: %v", err)})
		return
	}
	defer h.js.DeleteConsumer(streamName, consumerName)

	msgInfo, err := h.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-messages.json", streamName))

	messages := []gin.H{}
	sub, err := h.js.PullSubscribe(streamName, consumerName, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	defer sub.Unsubscribe()

	for i := 0; i < int(msgInfo.NumPending) && len(messages) < limit; i++ {
		msg, err := sub.NextMsg(2 * time.Second)
		if err != nil {
			break
		}

		meta, err := msg.Metadata()
		if err != nil {
			continue
		}
		messages = append(messages, gin.H{
			"subject":   msg.Subject,
			"sequence":  meta.Sequence,
			"data":      string(msg.Data),
			"timestamp": meta.Timestamp.Format(time.RFC3339),
		})
	}

	json.NewEncoder(c.Writer).Encode(gin.H{
		"exported_at": time.Now().Format(time.RFC3339),
		"stream":      streamName,
		"filter":      subject,
		"count":       len(messages),
		"messages":    messages,
	})
}

// ExportAllStreams exports all streams
// @Summary Export all streams
// @Description Exports a summary of all streams as JSON
// @Tags export
// @Produce json
// @Success 200 {file} file "Exported streams summary"
// @Failure 500 {object} dto.ErrorResponse
// @Router /export/streams [get]
func (h *ExportHandler) ExportAllStreams(c *gin.Context) {

	msg, err := h.nc.Request("$JS.API.STREAM.LIST", []byte("{}"), 2*time.Second)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var response struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
			State struct {
				Messages uint64 `json:"messages"`
				Bytes    uint64 `json:"bytes"`
			} `json:"state"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(msg.Data, &response); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=streams-%s.json", time.Now().Format("2006-01-02")))

	streams := make([]gin.H, 0, len(response.Streams))
	for _, stream := range response.Streams {
		streams = append(streams, gin.H{
			"name":     stream.Config.Name,
			"messages": stream.State.Messages,
			"bytes":    stream.State.Bytes,
		})
	}

	json.NewEncoder(c.Writer).Encode(gin.H{
		"exported_at": time.Now().Format(time.RFC3339),
		"count":       len(streams),
		"streams":     streams,
	})
}
