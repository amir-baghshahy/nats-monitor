package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
	"nats-monitoring/internal/dto"
)

// MetricDataPoint represents a single metric data point
type MetricDataPoint struct {
	Timestamp int64   `json:"timestamp"`
	Value     float64 `json:"value"`
	Label     string  `json:"label,omitempty"`
}

// MetricSeries represents a time series of metrics
type MetricSeries struct {
	Name   string            `json:"name"`
	Labels map[string]string `json:"labels"`
	Data   []MetricDataPoint `json:"data"`
}

// MetricsResponse represents the metrics API response
type MetricsResponse struct {
	Streams   []MetricSeries `json:"streams"`
	Consumers []MetricSeries `json:"consumers"`
	System    []MetricSeries `json:"system"`
	Timestamp int64          `json:"timestamp"`
}

// MetricsHandler handles metrics collection and serving
type MetricsHandler struct {
	nc           *nats.Conn
	js           nats.JetStreamContext
	metricsCache *MetricsResponse
	mu           sync.RWMutex
	ticker       *time.Ticker
	stopChan     chan struct{}
}

// NewMetricsHandler creates a new metrics handler
func NewMetricsHandler(nc *nats.Conn, js nats.JetStreamContext) *MetricsHandler {
	h := &MetricsHandler{
		nc: nc,
		js: js,
		metricsCache: &MetricsResponse{
			Streams:   make([]MetricSeries, 0),
			Consumers: make([]MetricSeries, 0),
			System:    make([]MetricSeries, 0),
		},
		stopChan: make(chan struct{}),
	}

	// Start metrics collection
	h.startCollector()

	return h
}

// Stop stops the metrics collector
func (h *MetricsHandler) Stop() {
	close(h.stopChan)
	if h.ticker != nil {
		h.ticker.Stop()
	}
}

// startCollector starts the background metrics collector
func (h *MetricsHandler) startCollector() {
	// Initial collection
	h.collectMetrics()

	// Collect every 10 seconds
	h.ticker = time.NewTicker(10 * time.Second)

	go func() {
		for {
			select {
			case <-h.ticker.C:
				h.collectMetrics()
			case <-h.stopChan:
				return
			}
		}
	}()
}

// collectMetrics collects metrics from NATS
func (h *MetricsHandler) collectMetrics() {
	h.mu.Lock()
	defer h.mu.Unlock()

	now := time.Now()

	// Get stream list
	msg, err := h.nc.Request("$JS.API.STREAM.LIST", []byte("{}"), 2*time.Second)
	if err != nil {
		return
	}

	var streamList struct {
		Streams []struct {
			Config struct {
				Name string `json:"name"`
			} `json:"config"`
			State struct {
				Msgs  uint64 `json:"msgs"`
				Bytes uint64 `json:"bytes"`
			} `json:"state"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(msg.Data, &streamList); err != nil {
		return
	}

	// Create/update stream series
	streamNames := make(map[string]bool)
	for _, stream := range streamList.Streams {
		streamNames[stream.Config.Name] = true

		// Find existing series or create new
		var series *MetricSeries
		for i, s := range h.metricsCache.Streams {
			if s.Name == stream.Config.Name && s.Labels["type"] == "messages" {
				series = &h.metricsCache.Streams[i]
				break
			}
		}

		if series == nil {
			series = &MetricSeries{
				Name:   stream.Config.Name,
				Labels: map[string]string{"type": "messages"},
				Data:   make([]MetricDataPoint, 0),
			}
			h.metricsCache.Streams = append(h.metricsCache.Streams, *series)
			series = &h.metricsCache.Streams[len(h.metricsCache.Streams)-1]
		}

		// Add data point
		point := MetricDataPoint{
			Timestamp: now.Unix(),
			Value:     float64(stream.State.Msgs),
		}

		// Keep only last 100 points
		series.Data = append(series.Data, point)
		if len(series.Data) > 100 {
			series.Data = series.Data[len(series.Data)-100:]
		}

		// Add bytes series
		var bytesSeries *MetricSeries
		for i, s := range h.metricsCache.Streams {
			if s.Name == stream.Config.Name && s.Labels["type"] == "bytes" {
				bytesSeries = &h.metricsCache.Streams[i]
				break
			}
		}

		if bytesSeries == nil {
			bytesSeries = &MetricSeries{
				Name:   stream.Config.Name,
				Labels: map[string]string{"type": "bytes"},
				Data:   make([]MetricDataPoint, 0),
			}
			h.metricsCache.Streams = append(h.metricsCache.Streams, *bytesSeries)
			bytesSeries = &h.metricsCache.Streams[len(h.metricsCache.Streams)-1]
		}

		bytesPoint := MetricDataPoint{
			Timestamp: now.Unix(),
			Value:     float64(stream.State.Bytes),
		}

		bytesSeries.Data = append(bytesSeries.Data, bytesPoint)
		if len(bytesSeries.Data) > 100 {
			bytesSeries.Data = bytesSeries.Data[len(bytesSeries.Data)-100:]
		}
	}

	// Update timestamp
	h.metricsCache.Timestamp = now.Unix()
}

// GetMetrics returns the current metrics
// @Summary Get metrics
// @Description Returns collected stream metrics series, optionally filtered by stream, type and duration
// @Tags metrics
// @Produce json
// @Param stream query string false "Filter by stream name"
// @Param type query string false "Metric type (messages, bytes, lag)"
// @Param duration query string false "Time window (15m, 1h, 6h, 24h)" default(1h)
// @Success 200 {object} MetricsResponse
// @Router /metrics [get]
func (h *MetricsHandler) GetMetrics(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// Parse query parameters
	streamName := c.Query("stream")
	metricType := c.Query("type") // messages, bytes, lag
	duration := c.DefaultQuery("duration", "1h")

	// Calculate cutoff time
	var cutoff time.Time
	switch duration {
	case "15m":
		cutoff = time.Now().Add(-15 * time.Minute)
	case "1h":
		cutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		cutoff = time.Now().Add(-6 * time.Hour)
	case "24h":
		cutoff = time.Now().Add(-24 * time.Hour)
	default:
		cutoff = time.Now().Add(-1 * time.Hour)
	}

	// Filter metrics
	result := &MetricsResponse{
		Streams:   make([]MetricSeries, 0),
		Consumers: make([]MetricSeries, 0),
		System:    make([]MetricSeries, 0),
		Timestamp: h.metricsCache.Timestamp,
	}

	for _, series := range h.metricsCache.Streams {
		// Filter by stream name
		if streamName != "" && series.Name != streamName {
			continue
		}

		// Filter by type
		if metricType != "" && series.Labels["type"] != metricType {
			continue
		}

		// Filter data points by time
		filtered := MetricSeries{
			Name:   series.Name,
			Labels: series.Labels,
			Data:   make([]MetricDataPoint, 0),
		}

		for _, point := range series.Data {
			if time.Unix(point.Timestamp, 0).After(cutoff) {
				filtered.Data = append(filtered.Data, point)
			}
		}

		if len(filtered.Data) > 0 {
			result.Streams = append(result.Streams, filtered)
		}
	}

	c.JSON(http.StatusOK, result)
}

// GetStreamMetrics returns metrics for a specific stream
// @Summary Get stream metrics
// @Description Returns collected metric series for a specific stream
// @Tags metrics
// @Produce json
// @Param name path string true "Stream name"
// @Success 200 {object} object "stream metrics"
// @Router /metrics/streams/{name} [get]
func (h *MetricsHandler) GetStreamMetrics(c *gin.Context) {
	streamName := c.Param("name")

	h.mu.RLock()
	defer h.mu.RUnlock()

	result := make(map[string][]MetricDataPoint)

	for _, series := range h.metricsCache.Streams {
		if series.Name == streamName {
			result[series.Labels["type"]] = series.Data
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"stream":  streamName,
		"metrics": result,
	})
}

// GetConsumerMetrics returns metrics for consumers
// @Summary Get consumer metrics
// @Description Returns lag, delivery, and ack metrics for a specific consumer
// @Tags metrics
// @Produce json
// @Param name path string true "Stream name"
// @Param consumer path string true "Consumer name"
// @Success 200 {object} object "consumer metrics"
// @Failure 404 {object} dto.ErrorResponse
// @Router /metrics/streams/{name}/consumers/{consumer} [get]
func (h *MetricsHandler) GetConsumerMetrics(c *gin.Context) {
	streamName := c.Param("name")
	consumerName := c.Param("consumer")

	// Get consumer info
	info, err := h.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "consumer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stream":          streamName,
		"consumer":        consumerName,
		"lag":             info.NumPending,
		"delivered":       info.Delivered,
		"acked":           info.AckFloor,
		"processing_time": info.Config.AckWait.String(),
	})
}
