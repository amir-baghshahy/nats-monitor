package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

// HistoryHandler handles historical data analysis
type HistoryHandler struct {
	nc       *nats.Conn
	js       nats.JetStreamContext
	history  map[string][]DataPoint
	mu       sync.RWMutex
	ticker   *time.Ticker
	stopChan chan struct{}
}

// DataPoint represents a single data point in history
type DataPoint struct {
	Timestamp int64   `json:"timestamp"`
	Value     float64 `json:"value"`
}

// NewHistoryHandler creates a new history handler
func NewHistoryHandler(nc *nats.Conn, js nats.JetStreamContext) *HistoryHandler {
	h := &HistoryHandler{
		nc:       nc,
		js:       js,
		history:  make(map[string][]DataPoint),
		stopChan: make(chan struct{}),
	}

	h.startCollector()
	return h
}

// Stop stops the history collector
func (h *HistoryHandler) Stop() {
	close(h.stopChan)
	if h.ticker != nil {
		h.ticker.Stop()
	}
}

// startCollector starts collecting historical data
func (h *HistoryHandler) startCollector() {
	h.ticker = time.NewTicker(1 * time.Minute)

	go func() {
		h.collectData() // collect immediately so history isn't empty on first load
		for {
			select {
			case <-h.ticker.C:
				h.collectData()
			case <-h.stopChan:
				return
			}
		}
	}()
}

// collectData collects current metrics and stores them in history
func (h *HistoryHandler) collectData() {
	h.mu.Lock()
	defer h.mu.Unlock()

	now := time.Now()

	// Collect stream metrics
	msg, err := h.nc.Request("$JS.API.STREAM.LIST", []byte("{}"), 2*time.Second)
	if err != nil {
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
		return
	}

	// Remove history for streams that no longer exist
	activeStreams := make(map[string]bool, len(response.Streams))
	for _, s := range response.Streams {
		activeStreams[s.Config.Name] = true
	}
	for key := range h.history {
		parts := splitString(key, ":")
		if len(parts) == 2 && !activeStreams[parts[0]] {
			delete(h.history, key)
		}
	}

	const maxPoints = 10080 // 7 days of per-minute data
	for _, stream := range response.Streams {
		// Messages history
		msgKey := stream.Config.Name + ":messages"
		h.history[msgKey] = append(h.history[msgKey], DataPoint{
			Timestamp: now.Unix(),
			Value:     float64(stream.State.Messages),
		})
		if len(h.history[msgKey]) > maxPoints {
			h.history[msgKey] = h.history[msgKey][len(h.history[msgKey])-maxPoints:]
		}

		// Bytes history
		bytesKey := stream.Config.Name + ":bytes"
		h.history[bytesKey] = append(h.history[bytesKey], DataPoint{
			Timestamp: now.Unix(),
			Value:     float64(stream.State.Bytes),
		})
		if len(h.history[bytesKey]) > maxPoints {
			h.history[bytesKey] = h.history[bytesKey][len(h.history[bytesKey])-maxPoints:]
		}
	}
}

// GetStreamHistory returns historical data for a stream
// @Summary Get stream history
// @Description Returns historical metric data points for a stream
// @Tags history
// @Produce json
// @Param name path string true "Stream name"
// @Param type query string false "Metric type (messages, bytes)" default(messages)
// @Param duration query string false "Time window (1h, 6h, 24h, 7d)" default(24h)
// @Success 200 {object} object "stream history"
// @Router /history/streams/{name} [get]
func (h *HistoryHandler) GetStreamHistory(c *gin.Context) {
	streamName := c.Param("name")
	metricType := c.DefaultQuery("type", "messages") // messages, bytes
	duration := c.DefaultQuery("duration", "24h")

	// Calculate cutoff time
	var cutoff time.Time
	switch duration {
	case "1h":
		cutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		cutoff = time.Now().Add(-6 * time.Hour)
	case "24h":
		cutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		cutoff = time.Now().Add(-7 * 24 * time.Hour)
	default:
		cutoff = time.Now().Add(-24 * time.Hour)
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	key := streamName + ":" + metricType
	data := h.history[key]

	// Filter by time
	result := make([]DataPoint, 0)
	for _, point := range data {
		if time.Unix(point.Timestamp, 0).After(cutoff) {
			result = append(result, point)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"stream":   streamName,
		"metric":   metricType,
		"duration": duration,
		"data":     result,
		"count":    len(result),
	})
}

// GetAnalysis returns statistical analysis of metrics
// @Summary Get stream metric analysis
// @Description Returns statistical analysis (min/max/avg/trend) of a stream metric
// @Tags history
// @Produce json
// @Param name path string true "Stream name"
// @Param type query string false "Metric type (messages, bytes)" default(messages)
// @Param duration query string false "Time window (1h, 6h, 24h, 7d)" default(24h)
// @Success 200 {object} object "metric analysis"
// @Router /history/streams/{name}/analysis [get]
func (h *HistoryHandler) GetAnalysis(c *gin.Context) {
	streamName := c.Param("name")
	metricType := c.DefaultQuery("type", "messages")
	duration := c.DefaultQuery("duration", "24h")

	// Calculate cutoff time
	var cutoff time.Time
	switch duration {
	case "1h":
		cutoff = time.Now().Add(-1 * time.Hour)
	case "6h":
		cutoff = time.Now().Add(-6 * time.Hour)
	case "24h":
		cutoff = time.Now().Add(-24 * time.Hour)
	case "7d":
		cutoff = time.Now().Add(-7 * 24 * time.Hour)
	default:
		cutoff = time.Now().Add(-24 * time.Hour)
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	key := streamName + ":" + metricType
	data := h.history[key]

	// Filter by time and calculate statistics
	var values []float64
	for _, point := range data {
		if time.Unix(point.Timestamp, 0).After(cutoff) {
			values = append(values, point.Value)
		}
	}

	if len(values) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"stream":   streamName,
			"metric":   metricType,
			"duration": duration,
			"analysis": gin.H{},
		})
		return
	}

	// Calculate statistics
	min := values[0]
	max := values[0]
	sum := 0.0
	for _, v := range values {
		if v < min {
			min = v
		}
		if v > max {
			max = v
		}
		sum += v
	}
	avg := sum / float64(len(values))

	// Calculate trend (last vs first)
	trend := 0.0
	if len(values) >= 2 {
		trend = ((values[len(values)-1] - values[0]) / values[0]) * 100
	}

	// Calculate growth rate
	growthRate := 0.0
	if len(values) >= 2 {
		firstValue := values[0]
		lastValue := values[len(values)-1]
		if firstValue > 0 {
			growthRate = ((lastValue - firstValue) / firstValue) * 100
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"stream":   streamName,
		"metric":   metricType,
		"duration": duration,
		"analysis": gin.H{
			"min":         min,
			"max":         max,
			"avg":         avg,
			"sum":         sum,
			"count":       len(values),
			"trend":       trend,
			"growth_rate": growthRate,
			"range":       max - min,
		},
	})
}

// GetReport returns a summary report of all streams
// @Summary Get history report
// @Description Returns a summary report of all streams with latest metric values
// @Tags history
// @Produce json
// @Param duration query string false "Time window" default(24h)
// @Success 200 {object} object "history report"
// @Router /history/report [get]
func (h *HistoryHandler) GetReport(c *gin.Context) {
	duration := c.DefaultQuery("duration", "24h")

	h.mu.RLock()
	defer h.mu.RUnlock()

	// Get unique stream names
	streamNames := make(map[string]bool)
	for key := range h.history {
		parts := splitString(key, ":")
		if len(parts) == 2 {
			streamNames[parts[0]] = true
		}
	}

	// Generate report for each stream
	report := make([]gin.H, 0)
	for streamName := range streamNames {
		msgKey := streamName + ":messages"
		bytesKey := streamName + ":bytes"

		msgData := h.history[msgKey]
		bytesData := h.history[bytesKey]

		var latestMsg, latestBytes float64
		if len(msgData) > 0 {
			latestMsg = msgData[len(msgData)-1].Value
		}
		if len(bytesData) > 0 {
			latestBytes = bytesData[len(bytesData)-1].Value
		}

		report = append(report, gin.H{
			"stream":      streamName,
			"messages":    latestMsg,
			"bytes":       latestBytes,
			"data_points": len(msgData) + len(bytesData),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"duration":     duration,
		"generated_at": time.Now().Format(time.RFC3339),
		"streams":      report,
	})
}

// Helper function to split string
func splitString(s string, sep string) []string {
	for i := 0; i <= len(s)-len(sep); i++ {
		if s[i:i+len(sep)] == sep {
			return []string{s[:i], s[i+len(sep):]}
		}
	}
	return []string{s}
}
