package services

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

const (
	AuditStreamName    = "AUDIT_LOGS"
	AuditStreamSubject = "audit.events"
	AuditMaxAge        = 30 * 24 * time.Hour // Keep logs for 30 days
	AuditMaxMessages   = 100000              // Maximum messages to keep
)

// AuditEvent represents an audit log entry
type AuditEvent struct {
	Timestamp string   `json:"timestamp"`
	Action    string   `json:"action"`
	User      string   `json:"user"`
	Resource  string   `json:"resource"`
	Details   string   `json:"details"`
	IPAddress string   `json:"ip_address,omitempty"`
	UserAgent string   `json:"user_agent,omitempty"`
	Metadata  Metadata `json:"metadata,omitempty"`
}

// Metadata contains additional context for audit events
type Metadata struct {
	StreamName    string `json:"stream_name,omitempty"`
	ConsumerName  string `json:"consumer_name,omitempty"`
	OperationType string `json:"operation_type,omitempty"`
	Status        string `json:"status,omitempty"`
}

// AuditService handles audit logging operations
type AuditService struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewAuditService creates a new audit service
func NewAuditService(nc *nats.Conn, js nats.JetStreamContext) *AuditService {
	return &AuditService{
		nc: nc,
		js: js,
	}
}

// Initialize creates the audit log stream if it doesn't exist
func (s *AuditService) Initialize() error {
	stream, err := s.js.StreamInfo(AuditStreamName)
	if err != nil {
		// Stream doesn't exist, create it
		_, err = s.js.AddStream(&nats.StreamConfig{
			Name:     AuditStreamName,
			Subjects: []string{AuditStreamSubject},
			MaxAge:   AuditMaxAge,
			MaxMsgs:  AuditMaxMessages,
			Storage:  nats.FileStorage,
			Discard:  nats.DiscardOld,
		})
		if err != nil {
			return fmt.Errorf("failed to create audit stream: %w", err)
		}
		log.Printf("Created audit log stream: %s", AuditStreamName)
	} else {
		log.Printf("Audit log stream already exists: %s", stream.Config.Name)
	}

	return nil
}

// LogEvent records an audit event
func (s *AuditService) LogEvent(event AuditEvent) error {
	if event.Timestamp == "" {
		event.Timestamp = time.Now().Format(time.RFC3339)
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal audit event: %w", err)
	}

	_, err = s.js.Publish(AuditStreamSubject, data)
	if err != nil {
		return fmt.Errorf("failed to publish audit event: %w", err)
	}

	return nil
}

// LogAction is a convenience method for logging actions
func (s *AuditService) LogAction(action, user, resource, details string, metadata Metadata) error {
	return s.LogEvent(AuditEvent{
		Timestamp: time.Now().Format(time.RFC3339),
		Action:    action,
		User:      user,
		Resource:  resource,
		Details:   details,
		Metadata:  metadata,
	})
}

// GetLogs retrieves audit logs with optional filtering
func (s *AuditService) GetLogs(offset int64, limit int64) ([]AuditEvent, error) {
	streamInfo, err := s.js.StreamInfo(AuditStreamName)
	if err != nil {
		// Stream might not exist yet or no permissions
		return []AuditEvent{}, nil // Return empty list instead of error
	}

	// If stream is empty, return empty list
	if streamInfo.State.Msgs == 0 {
		return []AuditEvent{}, nil
	}

	// Calculate the starting sequence (most recent first, with offset)
	startSeq := streamInfo.State.LastSeq - uint64(offset)
	if startSeq < streamInfo.State.FirstSeq {
		startSeq = streamInfo.State.FirstSeq
	}

	// Calculate end sequence based on limit
	endSeq := startSeq
	if startSeq > uint64(limit) {
		endSeq = startSeq - uint64(limit)
	}
	if endSeq < streamInfo.State.FirstSeq {
		endSeq = streamInfo.State.FirstSeq
	}

	var events []AuditEvent

	// Fetch messages from endSeq to startSeq (reverse chronological order)
	for seq := startSeq; seq >= endSeq && seq >= streamInfo.State.FirstSeq; seq-- {
		// GetMsg expects stream name and sequence number
		msg, err := s.js.GetMsg(AuditStreamName, seq)
		if err != nil {
			if err == nats.ErrMsgNotFound {
				continue // Skip missing messages
			}
			return nil, fmt.Errorf("failed to fetch audit log: %w", err)
		}

		var event AuditEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			log.Printf("Failed to unmarshal audit event at seq %d: %v", seq, err)
			continue
		}

		events = append(events, event)

		// Stop if we've reached the desired limit
		if int64(len(events)) >= limit {
			break
		}
	}

	return events, nil
}

// GetLogsByAction retrieves audit logs filtered by action type
func (s *AuditService) GetLogsByAction(action string, limit int64) ([]AuditEvent, error) {
	allEvents, err := s.GetLogs(0, limit*10) // Get more to filter
	if err != nil {
		return nil, err
	}

	var filtered []AuditEvent
	for _, event := range allEvents {
		if event.Action == action {
			filtered = append(filtered, event)
			if int64(len(filtered)) >= limit {
				break
			}
		}
	}

	return filtered, nil
}

// GetLogsByUser retrieves audit logs filtered by user
func (s *AuditService) GetLogsByUser(user string, limit int64) ([]AuditEvent, error) {
	allEvents, err := s.GetLogs(0, limit*10)
	if err != nil {
		return nil, err
	}

	var filtered []AuditEvent
	for _, event := range allEvents {
		if event.User == user {
			filtered = append(filtered, event)
			if int64(len(filtered)) >= limit {
				break
			}
		}
	}

	return filtered, nil
}

// Cleanup removes old audit logs based on retention policy
func (s *AuditService) Cleanup() error {
	// The stream configuration handles automatic cleanup via MaxAge and MaxMsgs
	// This method can be called manually to force cleanup if needed
	streamInfo, err := s.js.StreamInfo(AuditStreamName)
	if err != nil {
		return fmt.Errorf("failed to get stream info: %w", err)
	}

	// If we exceed max messages, purge old ones
	if streamInfo.State.Msgs > AuditMaxMessages {
		// Simple purge to keep under the limit
		if err := s.js.PurgeStream(AuditStreamName, nil); err != nil {
			return fmt.Errorf("failed to purge audit stream: %w", err)
		}
	}

	return nil
}
