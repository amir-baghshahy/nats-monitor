package dto

type ConsumerResponse struct {
	Name       string                  `json:"name"`
	Stream     string                  `json:"stream"`
	Status     string                  `json:"status"`
	Lag        uint64                  `json:"lag"`
	AckRate    string                  `json:"ack_rate"`
	NumPending uint64                  `json:"num_pending"`
	Paused     bool                    `json:"paused"`
	Config     *ConsumerConfigResponse `json:"config"`
}

type ConsumerConfigResponse struct {
	Durable       string `json:"durable"`
	AckPolicy     string `json:"ack_policy"`
	DeliverPolicy string `json:"deliver_policy"`
	ReplayPolicy  string `json:"replay_policy"`
	MaxDeliver    int64  `json:"max_deliver"`
}

type CreateConsumerRequest struct {
	Name          string `json:"name" binding:"required"`
	Durable       string `json:"durable,omitempty"`
	AckPolicy     string `json:"ack_policy" binding:"omitempty,oneof=none all explicit"`
	DeliverPolicy string `json:"deliver_policy" binding:"omitempty,oneof=all last new"`
	ReplayPolicy  string `json:"replay_policy" binding:"omitempty,oneof=instant original"`
	MaxDeliver    int    `json:"max_deliver" binding:"omitempty,min=-2"`
	FilterSubject string `json:"filter_subject,omitempty"`
}

type UpdateConsumerRequest struct {
	AckPolicy     string `json:"ack_policy" binding:"omitempty,oneof=none all explicit"`
	DeliverPolicy string `json:"deliver_policy" binding:"omitempty,oneof=all last new"`
	ReplayPolicy  string `json:"replay_policy" binding:"omitempty,oneof=instant original"`
	MaxDeliver    int    `json:"max_deliver" binding:"omitempty,min=-2"`
}

type ResetLagRequest struct {
	Sequence uint64 `json:"sequence"`
}

type ResetLagResponse struct {
	Message     string `json:"message"`
	NewSequence uint64 `json:"new_sequence"`
}

type ReplayRequest struct {
	StartSequence uint64 `json:"start_seq"`
	EndSequence   uint64 `json:"end_seq"`
	FilterSubject string `json:"filter_subject"`
}

type ReplayResponse struct {
	ReplayID string `json:"replay_id"`
	Message  string `json:"message"`
}

type PendingMessagesResponse struct {
	Consumer      string           `json:"consumer"`
	Stream        string           `json:"stream"`
	NumPending    uint64           `json:"num_pending"`
	NumAckPending uint64           `json:"num_ack_pending"`
	Messages      []PendingMessage `json:"messages"`
}

type PendingMessage struct {
	Sequence     uint64 `json:"sequence"`
	Subject      string `json:"subject"`
	Data         string `json:"data"`
	Timestamp    string `json:"timestamp"`
	NumDelivered int    `json:"num_delivered"`
	NumPending   uint64 `json:"num_pending"`
	Stream       string `json:"stream"`
	Consumer     string `json:"consumer"`
}

type AckMessageRequest struct {
	Sequence uint64 `json:"sequence" binding:"required"`
}

type AckMessageResponse struct {
	Message  string `json:"message"`
	Sequence uint64 `json:"sequence"`
}

type NackMessageRequest struct {
	Sequence uint64 `json:"sequence" binding:"required"`
	Delay    int64  `json:"delay"` // Redelivery delay in seconds
}

type AckTermMessageRequest struct {
	Sequence uint64 `json:"sequence" binding:"required"`
}
