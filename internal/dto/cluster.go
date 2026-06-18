package dto

type ClusterInfoResponse struct {
	ClusterName string               `json:"cluster_name"`
	IsClustered bool                 `json:"is_clustered"`
	ServerName  string               `json:"server_name"`
	ClusterURL  string               `json:"cluster_url,omitempty"`
	JetStream   ClusterJetStreamInfo `json:"jetstream"`
}

type ClusterJetStreamInfo struct {
	Enabled  bool   `json:"enabled"`
	Domain   string `json:"domain,omitempty"`
	Tier     string `json:"tier"`
	APILevel string `json:"api_level"`
}

type ClusterNodesResponse struct {
	Nodes       []ClusterNodeResponse `json:"nodes"`
	Clustered   bool                  `json:"clustered"`
	ClusterName string                `json:"cluster_name,omitempty"`
}

type ClusterNodeResponse struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Current bool   `json:"current"`
	Healthy bool   `json:"healthy"`
	Lag     uint64 `json:"lag"`
	Active  bool   `json:"active"`
}

type ClusterHealthResponse struct {
	Connected       bool                    `json:"connected"`
	Status          string                  `json:"status"`
	ServerStatus    string                  `json:"server_status,omitempty"`
	ConnectedServer *ClusterConnectedServer `json:"connected_server,omitempty"`
	JetStream       *ClusterJetStreamHealth `json:"jetstream,omitempty"`
}

type ClusterConnectedServer struct {
	ID  string `json:"id"`
	URL string `json:"url"`
}

type ClusterJetStreamHealth struct {
	Status string `json:"status"`
	Domain string `json:"domain,omitempty"`
	Tiers  any    `json:"tiers,omitempty"`
	Error  string `json:"error,omitempty"`
}

type ClusterStreamReplicaResponse struct {
	Stream      string                        `json:"stream"`
	Replicas    int                           `json:"replicas"`
	Placement   *ClusterPlacementResponse     `json:"placement,omitempty"`
	Mirror      *ClusterStreamSource          `json:"mirror,omitempty"`
	Sources     []ClusterStreamSource         `json:"sources,omitempty"`
	Cluster     *ClusterStreamClusterResponse `json:"cluster,omitempty"`
	IsClustered bool                          `json:"is_clustered"`
}

type ClusterPlacementResponse struct {
	Cluster string   `json:"cluster"`
	Tags    []string `json:"tags,omitempty"`
}

type ClusterStreamSource struct {
	Name   string `json:"name"`
	Domain string `json:"domain,omitempty"`
}

type ClusterStreamClusterResponse struct {
	Name           string                    `json:"name,omitempty"`
	RaftGroup      string                    `json:"raft_group,omitempty"`
	Leader         string                    `json:"leader,omitempty"`
	LeaderSince    string                    `json:"leader_since,omitempty"`
	SystemAccount  bool                      `json:"system_account,omitempty"`
	TrafficAccount string                    `json:"traffic_account,omitempty"`
	Replicas       []ClusterInfoPeerResponse `json:"replicas,omitempty"`
}

type ClusterInfoPeerResponse struct {
	Name    string `json:"name"`
	Current bool   `json:"current"`
	Offline bool   `json:"offline,omitempty"`
	Active  uint64 `json:"active"`
	Lag     uint64 `json:"lag,omitempty"`
}
