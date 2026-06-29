package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/config"
)

// AlertStore handles persistence of alerts to JSON file
type AlertStore struct {
	mu       sync.RWMutex
	alerts   []PersistedAlert
	filePath string
}

// PersistedAlert represents an alert stored on disk
type PersistedAlert struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	Description     string          `json:"description"`
	Condition       AlertCondition  `json:"condition"`
	Severity        string          `json:"severity"`
	Enabled         bool            `json:"enabled"`
	Channels        []string        `json:"channels"`
	EmailAddress    string          `json:"email_address"`
	WebhookURL      string          `json:"webhook_url"`
	SlackWebhookURL string          `json:"slack_webhook_url"`
	Cooldown        time.Duration   `json:"cooldown"`
	LastTrigger     time.Time       `json:"last_trigger"`
	TriggerCount    int             `json:"trigger_count"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// AlertCondition represents the condition to trigger an alert
type AlertCondition struct {
	Type      string `json:"type"`
	Stream    string `json:"stream"`
	Consumer  string `json:"consumer"`
	Threshold int64  `json:"threshold"`
	Operator  string `json:"operator"`
}

var (
	storeInstance *AlertStore
	storeOnce     sync.Once
)

// GetAlertStore returns the singleton AlertStore
func GetAlertStore() *AlertStore {
	storeOnce.Do(func() {
		storeInstance = &AlertStore{
			alerts:   make([]PersistedAlert, 0),
			filePath: getAlertStorePath(),
		}
		storeInstance.load()
	})
	return storeInstance
}

func getAlertStorePath() string {
	execPath, err := os.Executable()
	if err == nil {
		execDir := filepath.Dir(execPath)
		return filepath.Join(execDir, "nats-horizon-alerts.json")
	}
	if cwd, err := os.Getwd(); err == nil {
		return filepath.Join(cwd, "nats-horizon-alerts.json")
	}
	return "nats-horizon-alerts.json"
}

// load reads alerts from file
func (s *AlertStore) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("failed to read alerts: %w", err)
	}

	return json.Unmarshal(data, &s.alerts)
}

// save writes alerts to file
func (s *AlertStore) save() error {
	data, err := json.MarshalIndent(s.alerts, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal alerts: %w", err)
	}

	return os.WriteFile(s.filePath, data, 0600)
}

// GetAll returns all alerts
func (s *AlertStore) GetAll() []PersistedAlert {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]PersistedAlert, len(s.alerts))
	copy(result, s.alerts)
	return result
}

// GetByID returns an alert by ID
func (s *AlertStore) GetByID(id string) (*PersistedAlert, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for i := range s.alerts {
		if s.alerts[i].ID == id {
			return &s.alerts[i], true
		}
	}
	return nil, false
}

// SaveOrUpdate saves a new alert or updates existing one
func (s *AlertStore) SaveOrUpdate(alert PersistedAlert) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Update existing
	for i := range s.alerts {
		if s.alerts[i].ID == alert.ID {
			alert.CreatedAt = s.alerts[i].CreatedAt
			alert.UpdatedAt = time.Now()
			s.alerts[i] = alert
			return s.save()
		}
	}

	// Add new
	alert.CreatedAt = time.Now()
	alert.UpdatedAt = time.Now()
	s.alerts = append(s.alerts, alert)
	return s.save()
}

// Delete removes an alert by ID
func (s *AlertStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filtered := make([]PersistedAlert, 0, len(s.alerts))
	for _, a := range s.alerts {
		if a.ID != id {
			filtered = append(filtered, a)
		}
	}

	if len(filtered) == len(s.alerts) {
		return fmt.Errorf("alert not found")
	}

	s.alerts = filtered
	return s.save()
}

// GetEnabled returns all enabled alerts
func (s *AlertStore) GetEnabled() []PersistedAlert {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]PersistedAlert, 0)
	for _, a := range s.alerts {
		if a.Enabled {
			result = append(result, a)
		}
	}
	return result
}

// UpdateLastTrigger updates the last trigger time and count
func (s *AlertStore) UpdateLastTrigger(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.alerts {
		if s.alerts[i].ID == id {
			s.alerts[i].LastTrigger = time.Now()
			s.alerts[i].TriggerCount++
			s.alerts[i].UpdatedAt = time.Now()
			return s.save()
		}
	}
	return fmt.Errorf("alert not found")
}

// SyncFromConfig syncs alerts from config (for migration)
func (s *AlertStore) SyncFromConfig() {
	cfg := config.Get()
	if cfg == nil {
		return
	}
	// This can be used to migrate from config-based alerts to store-based
}
