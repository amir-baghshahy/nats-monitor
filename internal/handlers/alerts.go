package handlers

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
	"nats-monitoring/internal/dto"
)

// AlertSeverity represents the severity level of an alert
type AlertSeverity string

const (
	SeverityInfo     AlertSeverity = "info"
	SeverityWarning  AlertSeverity = "warning"
	SeverityCritical AlertSeverity = "critical"
)

// AlertCondition represents the condition to trigger an alert
type AlertCondition struct {
	Type      string `json:"type"`      // "lag", "latency", "messages", "consumer_lag", "storage"
	Stream    string `json:"stream"`    // Optional stream filter
	Consumer  string `json:"consumer"`  // Optional consumer filter
	Threshold int64  `json:"threshold"` // Threshold value
	Operator  string `json:"operator"`  // ">", "<", "=", ">=", "<="
}

// Alert represents an alert configuration
type Alert struct {
	ID           string         `json:"id"`
	Name         string         `json:"name"`
	Description  string         `json:"description"`
	Condition    AlertCondition `json:"condition"`
	Severity     AlertSeverity  `json:"severity"`
	Enabled      bool           `json:"enabled"`
	Channels     []string       `json:"channels"` // Notification channels: "email", "webhook", "slack"
	Cooldown     time.Duration  `json:"cooldown"`
	LastTrigger  time.Time      `json:"last_trigger"`
	TriggerCount int            `json:"trigger_count"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// AlertTrigger represents a triggered alert instance
type AlertTrigger struct {
	AlertID     string                 `json:"alert_id"`
	AlertName   string                 `json:"alert_name"`
	Severity    AlertSeverity          `json:"severity"`
	Message     string                 `json:"message"`
	Data        map[string]interface{} `json:"data"`
	TriggeredAt time.Time              `json:"triggered_at"`
	Acked       bool                   `json:"acked"`
	AckedAt     *time.Time             `json:"acked_at,omitempty"`
	AckedBy     string                 `json:"acked_by,omitempty"`
}

// AlertsHandler handles alert management
type AlertsHandler struct {
	nc       *nats.Conn
	js       nats.JetStreamContext
	alerts   map[string]*Alert
	triggers []*AlertTrigger
	mu       sync.RWMutex
	ticker   *time.Ticker
	stopChan chan struct{}
}

// NewAlertsHandler creates a new alerts handler
func NewAlertsHandler(nc *nats.Conn, js nats.JetStreamContext) *AlertsHandler {
	h := &AlertsHandler{
		nc:       nc,
		js:       js,
		alerts:   make(map[string]*Alert),
		triggers: make([]*AlertTrigger, 0),
		stopChan: make(chan struct{}),
	}

	// Start alert checking goroutine
	h.startChecker()

	return h
}

// Stop stops the alert checker
func (h *AlertsHandler) Stop() {
	close(h.stopChan)
	if h.ticker != nil {
		h.ticker.Stop()
	}
}

// startChecker starts the background alert checker
func (h *AlertsHandler) startChecker() {
	h.ticker = time.NewTicker(30 * time.Second)

	go func() {
		for {
			select {
			case <-h.ticker.C:
				h.checkAlerts()
			case <-h.stopChan:
				return
			}
		}
	}()
}

// checkAlerts evaluates all enabled alerts
func (h *AlertsHandler) checkAlerts() {
	h.mu.RLock()
	alerts := make([]*Alert, 0, len(h.alerts))
	for _, alert := range h.alerts {
		if alert.Enabled {
			alerts = append(alerts, alert)
		}
	}
	h.mu.RUnlock()

	now := time.Now()
	for _, alert := range alerts {
		// Check cooldown
		if !alert.LastTrigger.IsZero() && now.Sub(alert.LastTrigger) < alert.Cooldown {
			continue
		}

		// Evaluate condition
		triggered, data, err := h.evaluateCondition(alert.Condition)
		if err != nil {
			continue
		}

		if triggered {
			h.triggerAlert(alert, fmt.Sprintf("%s: %s", alert.Condition.Type, formatConditionData(alert.Condition, data)), data)
		}
	}
}

// evaluateCondition evaluates an alert condition
func (h *AlertsHandler) evaluateCondition(condition AlertCondition) (bool, map[string]interface{}, error) {
	data := make(map[string]interface{})

	switch condition.Type {
	case "lag":
		lag, err := h.getConsumerLag(condition.Stream, condition.Consumer)
		if err != nil {
			return false, nil, err
		}
		data["lag"] = lag
		return compareValues(lag, condition.Threshold, condition.Operator), data, nil

	case "storage":
		bytes, err := h.getStreamStorage(condition.Stream)
		if err != nil {
			return false, nil, err
		}
		data["bytes"] = bytes
		return compareValues(bytes, condition.Threshold, condition.Operator), data, nil

	case "messages":
		count, err := h.getStreamMessageCount(condition.Stream)
		if err != nil {
			return false, nil, err
		}
		data["messages"] = count
		return compareValues(count, condition.Threshold, condition.Operator), data, nil

	case "latency":
		data["latency_ms"] = 0
		return false, data, nil

	default:
		return false, nil, fmt.Errorf("unknown condition type: %s", condition.Type)
	}
}

// compareValues compares two values based on operator
func compareValues(actual, threshold int64, operator string) bool {
	switch operator {
	case ">":
		return actual > threshold
	case "<":
		return actual < threshold
	case ">=":
		return actual >= threshold
	case "<=":
		return actual <= threshold
	case "=":
		return actual == threshold
	default:
		return false
	}
}

// formatConditionData formats condition data for message
func formatConditionData(condition AlertCondition, data map[string]interface{}) string {
	switch condition.Type {
	case "lag":
		return fmt.Sprintf("Consumer lag is %v (threshold: %s %d)", data["lag"], condition.Operator, condition.Threshold)
	case "storage":
		return fmt.Sprintf("Storage usage is %v bytes (threshold: %s %d)", data["bytes"], condition.Operator, condition.Threshold)
	case "messages":
		return fmt.Sprintf("Message count is %v (threshold: %s %d)", data["messages"], condition.Operator, condition.Threshold)
	default:
		return fmt.Sprintf("Condition met: %v", data)
	}
}

// triggerAlert triggers an alert
func (h *AlertsHandler) triggerAlert(alert *Alert, message string, data map[string]interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	now := time.Now()
	trigger := &AlertTrigger{
		AlertID:     alert.ID,
		AlertName:   alert.Name,
		Severity:    alert.Severity,
		Message:     message,
		Data:        data,
		TriggeredAt: now,
		Acked:       false,
	}

	h.triggers = append(h.triggers, trigger)

	alert.LastTrigger = now
	alert.TriggerCount++
	alert.UpdatedAt = now

	if len(h.triggers) > 1000 {
		h.triggers = h.triggers[len(h.triggers)-1000:]
	}

	h.sendNotifications(trigger, alert.Channels)
}

// sendNotifications sends alert notifications
func (h *AlertsHandler) sendNotifications(trigger *AlertTrigger, channels []string) {
	// Placeholder for notification sending
	// In production, this would send to email, Slack, webhook, etc.
}

// getConsumerLag gets the current consumer lag
func (h *AlertsHandler) getConsumerLag(streamName, consumerName string) (int64, error) {
	if streamName == "" || consumerName == "" {
		return 0, fmt.Errorf("stream and consumer required")
	}

	consumers, err := h.js.ConsumerInfo(streamName, consumerName)
	if err != nil {
		return 0, err
	}

	return int64(consumers.NumPending), nil
}

// getStreamStorage gets stream storage usage
func (h *AlertsHandler) getStreamStorage(streamName string) (int64, error) {
	info, err := h.js.StreamInfo(streamName)
	if err != nil {
		return 0, err
	}
	return int64(info.State.Bytes), nil
}

// getStreamMessageCount gets stream message count
func (h *AlertsHandler) getStreamMessageCount(streamName string) (int64, error) {
	info, err := h.js.StreamInfo(streamName)
	if err != nil {
		return 0, err
	}
	return int64(info.State.Msgs), nil
}

// ListAlerts returns all alerts
// @Summary List alerts
// @Description Returns all configured alert definitions
// @Tags alerts
// @Produce json
// @Success 200 {array} Alert
// @Router /alerts [get]
func (h *AlertsHandler) ListAlerts(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	alerts := make([]*Alert, 0, len(h.alerts))
	for _, alert := range h.alerts {
		alerts = append(alerts, alert)
	}

	c.JSON(http.StatusOK, alerts)
}

// CreateAlert creates a new alert
// @Summary Create an alert
// @Description Creates a new alert configuration
// @Tags alerts
// @Accept json
// @Produce json
// @Param request body Alert true "Alert configuration"
// @Success 201 {object} Alert
// @Failure 400 {object} dto.ErrorResponse
// @Router /alerts [post]
func (h *AlertsHandler) CreateAlert(c *gin.Context) {
	var alert Alert
	if err := c.ShouldBindJSON(&alert); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	alert.ID = fmt.Sprintf("alert-%d", time.Now().UnixNano())
	alert.CreatedAt = time.Now()
	alert.UpdatedAt = time.Now()

	if alert.Cooldown == 0 {
		alert.Cooldown = 5 * time.Minute
	}

	h.mu.Lock()
	h.alerts[alert.ID] = &alert
	h.mu.Unlock()

	c.JSON(http.StatusCreated, alert)
}

// GetAlert returns a specific alert
// @Summary Get an alert
// @Description Returns a single alert configuration by ID
// @Tags alerts
// @Produce json
// @Param id path string true "Alert ID"
// @Success 200 {object} Alert
// @Failure 404 {object} dto.ErrorResponse
// @Router /alerts/{id} [get]
func (h *AlertsHandler) GetAlert(c *gin.Context) {
	id := c.Param("id")

	h.mu.RLock()
	alert, exists := h.alerts[id]
	h.mu.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "alert not found"})
		return
	}

	c.JSON(http.StatusOK, alert)
}

// UpdateAlert updates an alert
// @Summary Update an alert
// @Description Updates an existing alert configuration
// @Tags alerts
// @Accept json
// @Produce json
// @Param id path string true "Alert ID"
// @Param request body Alert true "Alert configuration"
// @Success 200 {object} Alert
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /alerts/{id} [put]
func (h *AlertsHandler) UpdateAlert(c *gin.Context) {
	id := c.Param("id")

	var updates Alert
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	alert, exists := h.alerts[id]
	if !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "alert not found"})
		return
	}

	// Update fields
	alert.Name = updates.Name
	alert.Description = updates.Description
	alert.Condition = updates.Condition
	alert.Severity = updates.Severity
	alert.Enabled = updates.Enabled
	alert.Channels = updates.Channels
	alert.Cooldown = updates.Cooldown
	alert.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, alert)
}

// DeleteAlert deletes an alert
// @Summary Delete an alert
// @Description Deletes an alert configuration by ID
// @Tags alerts
// @Produce json
// @Param id path string true "Alert ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /alerts/{id} [delete]
func (h *AlertsHandler) DeleteAlert(c *gin.Context) {
	id := c.Param("id")

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.alerts[id]; !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "alert not found"})
		return
	}

	delete(h.alerts, id)

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "alert deleted"})
}

// ListTriggers returns alert triggers
// @Summary List alert triggers
// @Description Returns triggered alert instances, optionally filtered
// @Tags alerts
// @Produce json
// @Param alert_id query string false "Filter by alert ID"
// @Param acked query string false "Filter by acked state (true/false)"
// @Success 200 {array} AlertTrigger
// @Router /alerts/triggers [get]
func (h *AlertsHandler) ListTriggers(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// Filter by query params
	alertID := c.Query("alert_id")
	acked := c.Query("acked")

	triggers := make([]*AlertTrigger, 0)
	for _, trigger := range h.triggers {
		if alertID != "" && trigger.AlertID != alertID {
			continue
		}
		if acked != "" {
			if acked == "true" && !trigger.Acked {
				continue
			}
			if acked == "false" && trigger.Acked {
				continue
			}
		}
		triggers = append(triggers, trigger)
	}

	if len(triggers) > 100 {
		triggers = triggers[len(triggers)-100:]
	}

	c.JSON(http.StatusOK, triggers)
}

// AckTrigger acknowledges a trigger
// @Summary Acknowledge an alert trigger
// @Description Acknowledges one or more triggers for the given alert ID
// @Tags alerts
// @Accept json
// @Produce json
// @Param id path string true "Alert ID"
// @Param request body object false "Acknowledging user" example({"user":"alice"})
// @Success 200 {object} dto.SuccessResponse
// @Router /alerts/triggers/{id}/ack [post]
func (h *AlertsHandler) AckTrigger(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		User string `json:"user"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		req.User = "anonymous"
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	for _, trigger := range h.triggers {
		if trigger.AlertID == id && !trigger.Acked {
			now := time.Now()
			trigger.Acked = true
			trigger.AckedAt = &now
			trigger.AckedBy = req.User
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "trigger acknowledged"})
}
