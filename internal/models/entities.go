package models

import "time"

// Stream represents a NATS JetStream stream
type Stream struct {
	Name       string    `json:"name"`
	Subjects   []string  `json:"subjects"`
	Storage    string    `json:"storage"`
	Retention  string    `json:"retention"`
	Replicas   int       `json:"replicas"`
	Messages   uint64    `json:"messages"`
	Bytes      uint64    `json:"bytes"`
	Consumers  int       `json:"consumers"`
	NumPending uint64    `json:"num_pending"`
	FirstSeq   uint64    `json:"first_seq"`
	LastSeq    uint64    `json:"last_seq"`
	FirstTs    time.Time `json:"first_ts"`
	LastTs     time.Time `json:"last_ts"`
	CreatedAt  time.Time `json:"created_at"`
}

// StreamConfig represents stream configuration (for compatibility)
type StreamConfig struct {
	Name      string   `json:"name"`
	Subjects  []string `json:"subjects"`
	Storage   string   `json:"storage"`
	Retention string   `json:"retention"`
	Replicas  int      `json:"replicas"`
}

// StreamState represents stream state (for compatibility)
type StreamState struct {
	Messages    uint64    `json:"messages"`
	Bytes       uint64    `json:"bytes"`
	Consumers   int       `json:"consumers"`
	FirstSeq    uint64    `json:"first_seq"`
	LastSeq     uint64    `json:"last_seq"`
	FirstTs     time.Time `json:"first_ts"`
	LastTs      time.Time `json:"last_ts"`
	NumPending  uint64    `json:"num_pending"`
	DeleteMarks uint64    `json:"delete_marks"`
	MaxAge      string    `json:"max_age"`
	MaxBytes    uint64    `json:"max_bytes"`
}

// StreamWithConfig wraps a stream with config and state for API responses
type StreamWithConfig struct {
	Config *StreamConfig `json:"config"`
	State  *StreamState  `json:"state"`
}

// ToStreamWithConfig converts a Stream to StreamWithConfig format
func (s *Stream) ToStreamWithConfig() *StreamWithConfig {
	return &StreamWithConfig{
		Config: &StreamConfig{
			Name:      s.Name,
			Subjects:  s.Subjects,
			Storage:   s.Storage,
			Retention: s.Retention,
			Replicas:  s.Replicas,
		},
		State: &StreamState{
			Messages:    s.Messages,
			Bytes:       s.Bytes,
			Consumers:   s.Consumers,
			NumPending:  s.NumPending,
			FirstSeq:    s.FirstSeq,
			LastSeq:     s.LastSeq,
			FirstTs:     s.FirstTs,
			LastTs:      s.LastTs,
			DeleteMarks: 0,
			MaxAge:      "",
			MaxBytes:    0,
		},
	}
}

// Consumer represents a NATS JetStream consumer
type Consumer struct {
	Name          string    `json:"name"`
	Stream        string    `json:"stream"`
	Status        string    `json:"status"`
	Lag           uint64    `json:"lag"`
	AckRate       string    `json:"ack_rate"`
	NumPending    uint64    `json:"num_pending"`
	Paused        bool      `json:"paused"`
	Durable       bool      `json:"durable"`
	AckPolicy     string    `json:"ack_policy"`
	DeliverPolicy string    `json:"deliver_policy"`
	ReplayPolicy  string    `json:"replay_policy"`
	MaxDeliver    int       `json:"max_deliver"`
	CreatedAt     time.Time `json:"created_at"`
}

// ConsumerConfig represents consumer configuration (for compatibility)
type ConsumerConfig struct {
	Durable       string `json:"durable"`
	AckPolicy     string `json:"ack_policy"`
	DeliverPolicy string `json:"deliver_policy"`
	ReplayPolicy  string `json:"replay_policy"`
	MaxDeliver    int64  `json:"max_deliver"`
}

// ConsumerWithConfig wraps a consumer with config for API responses
type ConsumerWithConfig struct {
	Name       string          `json:"name"`
	Stream     string          `json:"stream"`
	Status     string          `json:"status"`
	Lag        uint64          `json:"lag"`
	AckRate    string          `json:"ack_rate"`
	NumPending uint64          `json:"num_pending"`
	Paused     bool            `json:"paused"`
	Config     *ConsumerConfig `json:"config"`
}

// ToConsumerWithConfig converts a Consumer to ConsumerWithConfig format
func (c *Consumer) ToConsumerWithConfig() *ConsumerWithConfig {
	durable := ""
	if c.Durable {
		durable = c.Name
	}
	return &ConsumerWithConfig{
		Name:       c.Name,
		Stream:     c.Stream,
		Status:     c.Status,
		Lag:        c.Lag,
		AckRate:    c.AckRate,
		NumPending: c.NumPending,
		Paused:     c.Paused,
		Config: &ConsumerConfig{
			Durable:       durable,
			AckPolicy:     c.AckPolicy,
			DeliverPolicy: c.DeliverPolicy,
			ReplayPolicy:  c.ReplayPolicy,
			MaxDeliver:    int64(c.MaxDeliver),
		},
	}
}

// Connection represents a NATS client connection
type Connection struct {
	CID          uint64    `json:"cid"`
	Type         string    `json:"type"`
	Name         string    `json:"name"`
	User         string    `json:"user"`
	IP           string    `json:"ip"`
	Port         int       `json:"port,omitempty"`
	Server       string    `json:"server"`
	ServerID     string    `json:"server_id,omitempty"`
	SubsCount    int       `json:"subs_count"`
	RTT          string    `json:"rtt,omitempty"`
	PendingBytes int64     `json:"pending_bytes,omitempty"`
	InMsgs       int64     `json:"in_msgs,omitempty"`
	OutMsgs      int64     `json:"out_msgs,omitempty"`
	InBytes      int64     `json:"in_bytes,omitempty"`
	OutBytes     int64     `json:"out_bytes,omitempty"`
	ConnectedAt  time.Time `json:"connected_at"`
	LastActivity time.Time `json:"last_activity"`
}

// Message represents a message in a stream
type Message struct {
	Subject   string              `json:"subject"`
	Sequence  uint64              `json:"sequence"`
	Data      []byte              `json:"data"`
	Headers   map[string][]string `json:"headers"`
	Timestamp time.Time           `json:"timestamp"`
}

// ServerInfo represents NATS server information
type ServerInfo struct {
	ServerID  string `json:"server_id"`
	Version   string `json:"version"`
	Connected bool   `json:"connected"`
	Host      string `json:"host"`
	Port      int    `json:"port"`
}

// LagResetRequest represents a request to reset consumer lag
type LagResetRequest struct {
	StreamName   string `json:"stream_name"`
	ConsumerName string `json:"consumer_name"`
	Sequence     uint64 `json:"sequence"`
}

// ReplayRequest represents a request to replay messages
type ReplayRequest struct {
	StreamName    string `json:"stream_name"`
	ConsumerName  string `json:"consumer_name"`
	StartSequence uint64 `json:"start_sequence"`
	EndSequence   uint64 `json:"end_sequence"`
	FilterSubject string `json:"filter_subject"`
}

// PauseRequest represents a request to pause a consumer
type PauseRequest struct {
	StreamName   string `json:"stream_name"`
	ConsumerName string `json:"consumer_name"`
}

// ResumeRequest represents a request to resume a consumer
type ResumeRequest struct {
	StreamName   string `json:"stream_name"`
	ConsumerName string `json:"consumer_name"`
}
