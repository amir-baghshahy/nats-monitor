package dto

// DashboardStatsResponse represents dashboard statistics
type DashboardStatsResponse struct {
	Streams      int    `json:"streams"`
	Consumers    int    `json:"consumers"`
	Messages     uint64 `json:"messages"`
	Bytes        uint64 `json:"bytes"`
	Connections  int    `json:"connections"`
	ServerStatus string `json:"server_status"`
}

// AccountInfoResponse represents account information
type AccountInfoResponse struct {
	ID        string `json:"id"`
	JetStream bool   `json:"jetstream_enabled"`
	Domain    string `json:"domain"`
	APIUrl    string `json:"api_url"`
	URL       string `json:"url"`
}

// ConnectionInfo represents a NATS connection
type ConnectionInfo struct {
	CID          uint64 `json:"cid"`
	Type         string `json:"type"`
	Name         string `json:"name"`
	User         string `json:"user"`
	IP           string `json:"ip"`
	Server       string `json:"server"`
	SubsCount    int    `json:"subs_count"`
	ConnectedAt  string `json:"connected_at"`
	LastActivity string `json:"last_activity"`
}

// ConnectionsResponse represents the connections list response
type ConnectionsResponse struct {
	Connections []ConnectionInfo `json:"connections"`
	Total       int              `json:"total"`
}

// SubjectInfo represents subject information
type SubjectInfo struct {
	Name     string `json:"name"`
	Count    int64  `json:"count"`
	LastSeen string `json:"last_seen,omitempty"`
}

// SubjectsResponse represents the subjects list response
type SubjectsResponse struct {
	Subjects []SubjectInfo `json:"subjects"`
	Total    int           `json:"total"`
}

// SystemMetricsResponse represents system metrics
type SystemMetricsResponse struct {
	Memory       MemoryMetrics `json:"memory"`
	CPU          CPUMetrics    `json:"cpu"`
	Connections  int           `json:"connections"`
	Subscribers  int           `json:"subscribers"`
	MessagesSent int64         `json:"messages_sent"`
	MessagesRecv int64         `json:"messages_received"`
}

// MemoryMetrics represents memory metrics
type MemoryMetrics struct {
	Used    uint64  `json:"used"`
	Total   uint64  `json:"total"`
	Percent float64 `json:"percent"`
}

// CPUMetrics represents CPU metrics
type CPUMetrics struct {
	Percent float64 `json:"percent"`
}

// RateMetricsResponse represents rate metrics
type RateMetricsResponse struct {
	MessagesSentPerSec float64 `json:"messages_sent_per_sec"`
	MessagesRecvPerSec float64 `json:"messages_recv_per_sec"`
	BytesSentPerSec    uint64  `json:"bytes_sent_per_sec"`
	BytesRecvPerSec    uint64  `json:"bytes_recv_per_sec"`
}

// PublishMessageResponse represents a publish message response
type PublishMessageResponse struct {
	Success   bool   `json:"success"`
	Subject   string `json:"subject"`
	Size      int    `json:"size"`
	Timestamp int64  `json:"timestamp"`
}

// RequestMessageRequest represents a request message request
type RequestMessageRequest struct {
	Subject string              `json:"subject" binding:"required"`
	Payload string              `json:"payload"`
	Headers map[string][]string `json:"headers"`
	Timeout int                 `json:"timeout"`
}

// MessageInfo represents a NATS message with metadata
type MessageInfo struct {
	Subject    string              `json:"subject"`
	Data       string              `json:"data"`
	DataBase64 string              `json:"data_base64"`
	Reply      string              `json:"reply,omitempty"`
	Headers    map[string][]string `json:"headers,omitempty"`
	Timestamp  int64               `json:"timestamp"`
	Size       int                 `json:"size"`
}

// SSEConnectionMessage represents SSE connection message
type SSEConnectionMessage struct {
	Type      string `json:"type"`
	Subject   string `json:"subject,omitempty"`
	Timestamp int64  `json:"timestamp"`
}

// SubscriptionsResponse represents subscriptions info
type SubscriptionsResponse struct {
	Status    string `json:"status"`
	Connected bool   `json:"connected"`
	Server    string `json:"server"`
	Count     int    `json:"count"`
}

// ServiceDiscoveryResponse represents service discovery info
type ServiceDiscoveryResponse struct {
	Connected    bool   `json:"connected"`
	Status       string `json:"status"`
	ServerURL    string `json:"server_url"`
	ServerCount  int    `json:"server_count"`
	ServerName   string `json:"server_name"`
	Version      string `json:"version"`
	Host         string `json:"host"`
	Port         int    `json:"port"`
	MaxPayload   int64  `json:"max_payload"`
	AuthRequired bool   `json:"auth_required"`
	TLSRequired  bool   `json:"tls_required"`
}
