package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/config"
)

// NotificationChannel represents a notification destination

// NotificationChannel represents a notification destination
type NotificationChannel struct {
	Type    string                 `json:"type"`   // "slack", "webhook", "email"
	Config  map[string]interface{} `json:"config"` // Channel-specific configuration
	Enabled bool                   `json:"enabled"`
}

// SlackWebhook represents a Slack webhook configuration
type SlackWebhook struct {
	URL       string `json:"url"`
	Channel   string `json:"channel"`
	Username  string `json:"username"`
	IconEmoji string `json:"icon_emoji"`
}

// WebhookConfig represents a generic webhook configuration
type WebhookConfig struct {
	URL            string            `json:"url"`
	Method         string            `json:"method"`
	Headers        map[string]string `json:"headers"`
	TimeoutSeconds int               `json:"timeout_seconds"`
}

// EmailConfig represents an email configuration
type EmailConfig struct {
	SMTPHost string `json:"smtp_host"`
	SMTPPort int    `json:"smtp_port"`
	Username string `json:"username"`
	Password string `json:"password"`
	From     string `json:"from"`
	To       string `json:"to"`
	Subject  string `json:"subject"`
	UseTLS   bool   `json:"use_tls"`
}

// AlertTrigger represents the trigger data for notifications
type AlertTrigger struct {
	AlertID     string                 `json:"alert_id"`
	AlertName   string                 `json:"alert_name"`
	Severity    AlertSeverity          `json:"severity"`
	Message     string                 `json:"message"`
	Data        map[string]interface{} `json:"data"`
	TriggeredAt time.Time              `json:"triggered_at"`
	Acked       bool                   `json:"acked"`
}

// AlertSeverity represents the severity level
type AlertSeverity string

// NotificationService handles sending notifications to various channels
type NotificationService struct {
	channels []NotificationChannel
	client   *http.Client
}

// NewNotificationService creates a new notification service
func NewNotificationService() *NotificationService {
	return &NotificationService{
		channels: make([]NotificationChannel, 0),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// AddChannel adds a notification channel
func (s *NotificationService) AddChannel(channel NotificationChannel) {
	s.channels = append(s.channels, channel)
}

// RemoveChannel removes a notification channel by type
func (s *NotificationService) RemoveChannel(channelType string) {
	filtered := make([]NotificationChannel, 0)
	for _, ch := range s.channels {
		if ch.Type != channelType {
			filtered = append(filtered, ch)
		}
	}
	s.channels = filtered
}

// SendAlertNotification sends an alert notification to all enabled channels
func (s *NotificationService) SendAlertNotification(trigger AlertTrigger, emailAddr, webhookURL, slackWebhookURL string) error {
	// Send to email if address provided
	if emailAddr != "" {
		emailChannel := NotificationChannel{
			Type:    "email",
			Enabled: true,
			Config: map[string]interface{}{
				"to":      emailAddr,
				"subject": fmt.Sprintf("Alert: %s", trigger.AlertName),
			},
		}
		if err := s.sendEmailNotification(emailChannel, trigger); err != nil {
			log.Printf("Failed to send email notification: %v", err)
		}
	}

	// Send to webhook if URL provided
	if webhookURL != "" {
		webhookChannel := NotificationChannel{
			Type:    "webhook",
			Enabled: true,
			Config: map[string]interface{}{
				"url": webhookURL,
			},
		}
		if err := s.sendWebhookNotification(webhookChannel, trigger); err != nil {
			log.Printf("Failed to send webhook notification: %v", err)
		}
	}

	// Send to Slack if webhook URL provided
	if slackWebhookURL != "" {
		slackChannel := NotificationChannel{
			Type:    "slack",
			Enabled: true,
			Config: map[string]interface{}{
				"url": slackWebhookURL,
			},
		}
		if err := s.sendSlackNotification(slackChannel, trigger); err != nil {
			log.Printf("Failed to send Slack notification: %v", err)
		}
	}

	return nil
}

// sendSlackNotification sends a notification to Slack
func (s *NotificationService) sendSlackNotification(channel NotificationChannel, trigger AlertTrigger) error {
	config := SlackWebhook{
		URL:       getStringConfig(channel.Config, "url", ""),
		Channel:   getStringConfig(channel.Config, "channel", "#alerts"),
		Username:  getStringConfig(channel.Config, "username", "NATS Horizon"),
		IconEmoji: getStringConfig(channel.Config, "icon_emoji", ":warning:"),
	}

	if config.URL == "" {
		return fmt.Errorf("Slack webhook URL is required")
	}

	// Determine color based on severity
	color := "#36a64f" // green
	switch trigger.Severity {
	case "warning":
		color = "#ff9800" // orange
	case "critical":
		color = "#ff0000" // red
	}

	payload := map[string]interface{}{
		"channel":    config.Channel,
		"username":   config.Username,
		"icon_emoji": config.IconEmoji,
		"attachments": []map[string]interface{}{
			{
				"color": color,
				"fields": []map[string]interface{}{
					{
						"title": "Alert",
						"value": trigger.AlertName,
						"short": false,
					},
					{
						"title": "Severity",
						"value": string(trigger.Severity),
						"short": true,
					},
					{
						"title": "Time",
						"value": trigger.TriggeredAt.Format(time.RFC3339),
						"short": true,
					},
					{
						"title": "Message",
						"value": trigger.Message,
						"short": false,
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal Slack payload: %w", err)
	}

	resp, err := s.client.Post(config.URL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send Slack webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Slack webhook returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// sendWebhookNotification sends a notification to a generic webhook
func (s *NotificationService) sendWebhookNotification(channel NotificationChannel, trigger AlertTrigger) error {
	config := WebhookConfig{
		URL:            getStringConfig(channel.Config, "url", ""),
		Method:         getStringConfig(channel.Config, "method", "POST"),
		TimeoutSeconds: getIntConfig(channel.Config, "timeout_seconds", 30),
		Headers:        make(map[string]string),
	}

	// Extract headers
	if headers, ok := channel.Config["headers"].(map[string]interface{}); ok {
		for k, v := range headers {
			if vs, ok := v.(string); ok {
				config.Headers[k] = vs
			}
		}
	}

	if config.URL == "" {
		return fmt.Errorf("Webhook URL is required")
	}

	// Create payload
	payload := map[string]interface{}{
		"alert_id":     trigger.AlertID,
		"alert_name":   trigger.AlertName,
		"severity":     string(trigger.Severity),
		"message":      trigger.Message,
		"data":         trigger.Data,
		"triggered_at": trigger.TriggeredAt.Format(time.RFC3339),
		"acked":        trigger.Acked,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	// Create request
	req, err := http.NewRequest(config.Method, config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create webhook request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	for k, v := range config.Headers {
		req.Header.Set(k, v)
	}

	// Send request
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("webhook returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// sendEmailNotification sends an email notification
func (s *NotificationService) sendEmailNotification(channel NotificationChannel, trigger AlertTrigger) error {
	cfg := config.Get()
	
	config := EmailConfig{
		SMTPHost: getStringConfig(channel.Config, "smtp_host", cfg.SMTPHost),
		SMTPPort: getIntConfig(channel.Config, "smtp_port", cfg.SMTPPort),
		Username: getStringConfig(channel.Config, "username", cfg.SMTPUsername),
		Password: getStringConfig(channel.Config, "password", cfg.SMTPPassword),
		From:     getStringConfig(channel.Config, "from", cfg.SMTPFrom),
		To:       getStringConfig(channel.Config, "to", ""),
		Subject:  getStringConfig(channel.Config, "subject", fmt.Sprintf("Alert: %s", trigger.AlertName)),
		UseTLS:   getBoolConfig(channel.Config, "use_tls", true),
	}

	if config.To == "" {
		return fmt.Errorf("Email recipient is required")
	}

	// Build HTML email body
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.container { max-width: 600px; margin: 0 auto; }
.header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
.content { background: #f4f4f4; padding: 20px; border-radius: 0 0 8px 8px; }
.severity-info { color: #17a2b8; }
.severity-warning { color: #ffc107; font-weight: bold; }
.severity-critical { color: #dc3545; font-weight: bold; }
.footer { margin-top: 20px; font-size: 12px; color: #666; }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h2>🚨 NATS Horizon Alert</h2>
</div>
<div class="content">
<h3>%s</h3>
<p class="severity-%s"><strong>Severity:</strong> %s</p>
<p><strong>Time:</strong> %s</p>
<p><strong>Message:</strong> %s</p>
<pre>%+v</pre>
</div>
<div class="footer">
<p>This alert was generated by NATS Horizon Monitoring Platform</p>
</div>
</div>
</body>
</html>`,
		trigger.AlertName,
		string(trigger.Severity),
		string(trigger.Severity),
		trigger.TriggeredAt.Format(time.RFC3339),
		trigger.Message,
		trigger.Data,
	)

	// Create message with proper MIME headers
	message := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		config.From, config.To, config.Subject, body)

	// Connect to SMTP server
	addr := fmt.Sprintf("%s:%d", config.SMTPHost, config.SMTPPort)

	var auth smtp.Auth
	if config.Username != "" && config.Password != "" {
		auth = smtp.PlainAuth("", config.Username, config.Password, config.SMTPHost)
	}

	var err error
	if config.UseTLS {
		err = smtp.SendMail(addr, auth, config.From, []string{config.To}, []byte(message))
	} else {
		err = smtp.SendMail(addr, auth, config.From, []string{config.To}, []byte(message))
	}

	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("Email notification sent to %s for alert %s", config.To, trigger.AlertName)
	return nil
}

// Helper functions for config extraction
func getStringConfig(config map[string]interface{}, key, defaultValue string) string {
	if val, ok := config[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultValue
}

func getIntConfig(config map[string]interface{}, key string, defaultValue int) int {
	if val, ok := config[key]; ok {
		switch v := val.(type) {
		case int:
			return v
		case float64:
			return int(v)
		}
	}
	return defaultValue
}

func getBoolConfig(config map[string]interface{}, key string, defaultValue bool) bool {
	if val, ok := config[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return defaultValue
}
