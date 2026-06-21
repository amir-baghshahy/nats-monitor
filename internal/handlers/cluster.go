package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/amir-baghshahy/nats-monitor/internal/dto"
	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

// ClusterHandler handles cluster monitoring operations
type ClusterHandler struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewClusterHandler creates a new cluster handler
func NewClusterHandler(nc *nats.Conn, js nats.JetStreamContext) *ClusterHandler {
	return &ClusterHandler{nc: nc, js: js}
}

// ClusterInfo represents cluster information
type ClusterInfo struct {
	Name     string     `json:"name"`
	Leader   string     `json:"leader"`
	Replicas []NodeInfo `json:"replicas"`
	Healthy  bool       `json:"healthy"`
}

// NodeInfo represents information about a cluster node
type NodeInfo struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Current bool   `json:"current"`
	Healthy bool   `json:"healthy"`
	Lag     uint64 `json:"lag"`
	Active  bool   `json:"active"`
}

// GetClusterInfo returns cluster information
// @Summary Get cluster information
// @Description Returns JetStream cluster topology and server information
// @Tags cluster
// @Produce json
// @Success 200 {object} dto.ClusterInfoResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /cluster/info [get]
func (h *ClusterHandler) GetClusterInfo(c *gin.Context) {
	// Get server info using $JS.API.SERVER.PING with fallback
	serverName := ""
	clusterName := "standalone"
	clusterURL := ""
	isClustered := false
	jsDomain := ""
	jsTier := "standard"
	jsAPI := "0"

	msg, err := h.nc.Request("$JS.API.SERVER.PING", []byte{}, 2*time.Second)
	if err == nil && msg != nil {
		var serverInfo struct {
			Name       string `json:"server_name"`
			Cluster    string `json:"cluster"`
			ClusterURL string `json:"cluster_url"`
		}
		if err := json.Unmarshal(msg.Data, &serverInfo); err != nil {
			log.Printf("Failed to unmarshal cluster info: %v", err)
		} else {
			serverName = serverInfo.Name
			clusterName = serverInfo.Cluster
			clusterURL = serverInfo.ClusterURL
			isClustered = serverInfo.Cluster != ""
			if !isClustered {
				clusterName = "standalone"
			}
		}
	}

	if serverName == "" {
		serverName = h.nc.ConnectedUrl()
	}

	// Get account info for additional cluster stats with fallback
	accountInfo, err := h.js.AccountInfo()
	if err == nil {
		jsDomain = accountInfo.Domain
		// Tier is a struct, use a simple string representation
		jsTier = "standard"
		jsAPI = fmt.Sprintf("%d", accountInfo.API.Level)
	}

	c.JSON(http.StatusOK, dto.ClusterInfoResponse{
		ClusterName: clusterName,
		IsClustered: isClustered,
		ServerName:  serverName,
		ClusterURL:  clusterURL,
		JetStream: dto.ClusterJetStreamInfo{
			Enabled:  true,
			Domain:   jsDomain,
			Tier:     jsTier,
			APILevel: jsAPI,
		},
	})
}

// GetClusterNodes returns information about cluster nodes
// @Summary Get cluster nodes
// @Description Returns information about each node in the NATS cluster
// @Tags cluster
// @Produce json
// @Success 200 {object} dto.ClusterNodesResponse
// @Router /cluster/nodes [get]
func (h *ClusterHandler) GetClusterNodes(c *gin.Context) {
	// Try to get cluster info from ROUTERZ
	msg, err := h.nc.Request("$SYS.CLUSTER.INFO", []byte{}, 2*time.Second)
	if err != nil {
		// If not available, return current connection info
		c.JSON(http.StatusOK, dto.ClusterNodesResponse{
			Nodes: []dto.ClusterNodeResponse{{
				ID:      h.nc.ConnectedServerId(),
				Name:    h.nc.ConnectedUrl(),
				Current: true,
				Healthy: h.nc.IsConnected(),
				Lag:     0,
				Active:  true,
			}},
			Clustered: false,
		})
		return
	}

	var clusterInfo struct {
		Name  string `json:"name"`
		Nodes []struct {
			ID      string `json:"name"`
			Current bool   `json:"current"`
			Offline bool   `json:"offline"`
			Active  bool   `json:"active"`
		} `json:"nodes"`
	}

	if err := json.Unmarshal(msg.Data, &clusterInfo); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	nodes := make([]dto.ClusterNodeResponse, 0, len(clusterInfo.Nodes))
	for _, node := range clusterInfo.Nodes {
		nodes = append(nodes, dto.ClusterNodeResponse{
			ID:      node.ID,
			Name:    node.ID,
			Current: node.Current,
			Healthy: !node.Offline,
			Lag:     0,
			Active:  node.Active,
		})
	}

	c.JSON(http.StatusOK, dto.ClusterNodesResponse{
		Nodes:       nodes,
		Clustered:   true,
		ClusterName: clusterInfo.Name,
	})
}

// GetStreamReplicas returns replication info for a stream
// @Summary Get stream replicas
// @Description Returns replication, mirror, source, and cluster placement info for a stream
// @Tags cluster
// @Produce json
// @Param name path string true "Stream name"
// @Success 200 {object} dto.ClusterStreamReplicaResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /cluster/streams/{name}/replicas [get]
func (h *ClusterHandler) GetStreamReplicas(c *gin.Context) {
	streamName := c.Param("name")

	info, err := h.js.StreamInfo(streamName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "stream not found"})
		return
	}

	placement := clusterPlacementToResponse(info.Config.Placement)
	mirror := clusterStreamSourceToResponse(info.Config.Mirror)
	sources := make([]dto.ClusterStreamSource, 0, len(info.Config.Sources))
	for _, source := range info.Config.Sources {
		if source != nil {
			sources = append(sources, dto.ClusterStreamSource{
				Name:   source.Name,
				Domain: source.Domain,
			})
		}
	}

	c.JSON(http.StatusOK, dto.ClusterStreamReplicaResponse{
		Stream:      streamName,
		Replicas:    info.Config.Replicas,
		Placement:   placement,
		Mirror:      mirror,
		Sources:     sources,
		Cluster:     clusterInfoToResponse(info.Cluster),
		IsClustered: info.Cluster != nil,
	})
}

// GetClusterHealth returns overall cluster health
// @Summary Get cluster health
// @Description Returns connection and JetStream health status of the cluster
// @Tags cluster
// @Produce json
// @Success 200 {object} dto.ClusterHealthResponse
// @Failure 503 {object} dto.ClusterHealthResponse
// @Router /cluster/health [get]
func (h *ClusterHandler) GetClusterHealth(c *gin.Context) {
	// Get server health
	health := dto.ClusterHealthResponse{
		Connected: h.nc.IsConnected(),
		Status:    "ok",
	}

	if !h.nc.IsConnected() {
		health.Status = "disconnected"
		c.JSON(http.StatusServiceUnavailable, health)
		return
	}

	status := h.nc.Status()
	health.ServerStatus = status.String()

	health.ConnectedServer = &dto.ClusterConnectedServer{
		ID:  h.nc.ConnectedServerId(),
		URL: h.nc.ConnectedUrl(),
	}

	accountInfo, err := h.js.AccountInfo()
	if err != nil {
		health.JetStream = &dto.ClusterJetStreamHealth{Status: "error", Error: err.Error()}
	} else {
		health.JetStream = &dto.ClusterJetStreamHealth{
			Status: "ok",
			Domain: accountInfo.Domain,
			Tiers:  accountInfo.Tier,
		}
	}

	c.JSON(http.StatusOK, health)
}

func clusterPlacementToResponse(placement *nats.Placement) *dto.ClusterPlacementResponse {
	if placement == nil {
		return nil
	}
	return &dto.ClusterPlacementResponse{
		Cluster: placement.Cluster,
		Tags:    placement.Tags,
	}
}

func clusterStreamSourceToResponse(source *nats.StreamSource) *dto.ClusterStreamSource {
	if source == nil {
		return nil
	}
	return &dto.ClusterStreamSource{
		Name:   source.Name,
		Domain: source.Domain,
	}
}

func clusterInfoToResponse(info *nats.ClusterInfo) *dto.ClusterStreamClusterResponse {
	if info == nil {
		return nil
	}

	replicas := make([]dto.ClusterInfoPeerResponse, 0, len(info.Replicas))
	for _, replica := range info.Replicas {
		if replica == nil {
			continue
		}
		replicas = append(replicas, dto.ClusterInfoPeerResponse{
			Name:    replica.Name,
			Current: replica.Current,
			Offline: replica.Offline,
			Active:  uint64(replica.Active),
			Lag:     replica.Lag,
		})
	}

	leaderSince := ""
	if info.LeaderSince != nil {
		leaderSince = info.LeaderSince.Format(time.RFC3339)
	}

	return &dto.ClusterStreamClusterResponse{
		Name:           info.Name,
		RaftGroup:      info.RaftGroup,
		Leader:         info.Leader,
		LeaderSince:    leaderSince,
		SystemAccount:  info.SystemAcc,
		TrafficAccount: info.TrafficAcc,
		Replicas:       replicas,
	}
}
