package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

// validateNATSURL rejects schemes other than nats:// and tls:// to prevent SSRF.
func validateNATSURL(raw string) error {
	u, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}
	scheme := strings.ToLower(u.Scheme)
	if scheme != "nats" && scheme != "tls" {
		return fmt.Errorf("URL scheme %q is not allowed; only nats:// and tls:// are permitted", u.Scheme)
	}
	if u.Host == "" {
		return fmt.Errorf("URL must include a host")
	}
	return nil
}

// ConnectionConfig represents a NATS connection configuration
type ConnectionConfig struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	URL         string    `json:"url"`
	Description string    `json:"description"`
	Enabled     bool      `json:"enabled"`
	IsDefault   bool      `json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ConnectionStatus represents the status of a connection
type ConnectionStatus struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Connected   bool   `json:"connected"`
	Healthy     bool   `json:"healthy"`
	Latency     string `json:"latency,omitempty"`
	Error       string `json:"error,omitempty"`
	LastChecked string `json:"last_checked"`
}

// TenancyHandler manages multi-tenancy connections
type TenancyHandler struct {
	connections map[string]*ConnectionConfig
	mu          sync.RWMutex
	nc          *nats.Conn
	// Map to track active NATS connections
	// In a real implementation, you'd maintain actual connection pools
}

// NewTenancyHandler creates a new tenancy handler
func NewTenancyHandler(natsURL string, nc *nats.Conn) *TenancyHandler {
	h := &TenancyHandler{
		connections: make(map[string]*ConnectionConfig),
		nc:          nc,
	}

	// Add default connection from environment
	// Extract server name from URL for better UX
	serverName := "NATS Server"
	if nc != nil && nc.IsConnected() {
		if msg, err := nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), 1*time.Second); err == nil && msg != nil {
			var serverResp struct {
				Name string `json:"server_name"`
			}
			if err := json.Unmarshal(msg.Data, &serverResp); err == nil && serverResp.Name != "" {
				serverName = serverResp.Name
			} else if err != nil {
				log.Printf("Failed to unmarshal server name: %v", err)
			}
		}
	}

	h.connections["default"] = &ConnectionConfig{
		ID:          "default",
		Name:        serverName,
		URL:         natsURL,
		Description: fmt.Sprintf("Default NATS connection (%s)", serverName),
		Enabled:     true,
		IsDefault:   true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	return h
}

// ListConnections returns all configured connections
//
//	@Summary		List tenancy connections
//	@Description	Returns all configured multi-tenancy NATS connections
//	@Tags			tenancy
//	@Produce		json
//	@Success		200	{object}	object	"connections list"
//	@Router			/tenancy/connections [get]
func (h *TenancyHandler) ListConnections(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	connections := make([]*ConnectionConfig, 0, len(h.connections))
	for _, conn := range h.connections {
		connections = append(connections, conn)
	}

	c.JSON(http.StatusOK, gin.H{
		"connections": connections,
		"count":       len(connections),
	})
}

// GetConnection returns a specific connection
//
//	@Summary		Get a tenancy connection
//	@Description	Returns a single configured NATS connection by ID
//	@Tags			tenancy
//	@Produce		json
//	@Param			id	path		string	true	"Connection ID"
//	@Success		200	{object}	ConnectionConfig
//	@Failure		404	{object}	dto.ErrorResponse
//	@Router			/tenancy/connections/{id} [get]
func (h *TenancyHandler) GetConnection(c *gin.Context) {
	id := c.Param("id")

	h.mu.RLock()
	conn, exists := h.connections[id]
	h.mu.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "connection not found"})
		return
	}

	c.JSON(http.StatusOK, conn)
}

// CreateConnection creates a new connection
//
//	@Summary		Create a tenancy connection
//	@Description	Creates a new multi-tenancy NATS connection configuration
//	@Tags			tenancy
//	@Accept			json
//	@Produce		json
//	@Param			request	body		ConnectionConfig	true	"Connection configuration"
//	@Success		201		{object}	ConnectionConfig
//	@Failure		400		{object}	dto.ErrorResponse
//	@Router			/tenancy/connections [post]
func (h *TenancyHandler) CreateConnection(c *gin.Context) {
	var req ConnectionConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if req.Name == "" || req.URL == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "name and url are required"})
		return
	}

	if err := validateNATSURL(req.URL); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Generate ID
	req.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	h.connections[req.ID] = &req

	c.JSON(http.StatusCreated, req)
}

// UpdateConnection updates a connection
//
//	@Summary		Update a tenancy connection
//	@Description	Updates an existing multi-tenancy NATS connection configuration
//	@Tags			tenancy
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string				true	"Connection ID"
//	@Param			request	body		ConnectionConfig	true	"Connection configuration"
//	@Success		200		{object}	ConnectionConfig
//	@Failure		400		{object}	dto.ErrorResponse
//	@Failure		404		{object}	dto.ErrorResponse
//	@Router			/tenancy/connections/{id} [put]
func (h *TenancyHandler) UpdateConnection(c *gin.Context) {
	id := c.Param("id")

	var req ConnectionConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	existing, exists := h.connections[id]
	if !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "connection not found"})
		return
	}

	// Update fields
	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.URL != "" {
		existing.URL = req.URL
	}
	if req.Description != "" {
		existing.Description = req.Description
	}
	existing.Enabled = req.Enabled
	existing.UpdatedAt = time.Now()

	c.JSON(http.StatusOK, existing)
}

// DeleteConnection deletes a connection
//
//	@Summary		Delete a tenancy connection
//	@Description	Deletes a multi-tenancy NATS connection configuration (the default connection cannot be deleted)
//	@Tags			tenancy
//	@Produce		json
//	@Param			id	path		string	true	"Connection ID"
//	@Success		200	{object}	dto.SuccessResponse
//	@Failure		400	{object}	dto.ErrorResponse
//	@Failure		404	{object}	dto.ErrorResponse
//	@Router			/tenancy/connections/{id} [delete]
func (h *TenancyHandler) DeleteConnection(c *gin.Context) {
	id := c.Param("id")

	h.mu.Lock()
	defer h.mu.Unlock()

	conn, exists := h.connections[id]
	if !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "connection not found"})
		return
	}

	// Prevent deleting default connection
	if conn.IsDefault {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "cannot delete default connection"})
		return
	}

	delete(h.connections, id)

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "connection deleted"})
}

// TestConnection tests a connection configuration
//
//	@Summary		Test a connection
//	@Description	Attempts to connect to a NATS URL and reports connectivity and latency
//	@Tags			tenancy
//	@Accept			json
//	@Produce		json
//	@Param			request	body		object	true	"Connection test request"	example({"url":"nats://localhost:4222"})
//	@Success		200		{object}	object	"connection test result"
//	@Failure		400		{object}	dto.ErrorResponse
//	@Router			/tenancy/connections/test [post]
func (h *TenancyHandler) TestConnection(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := validateNATSURL(req.URL); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Try to connect
	start := time.Now()
	nc, err := nats.Connect(req.URL,
		nats.Timeout(5*time.Second),
		nats.MaxReconnects(0),
	)
	latency := time.Since(start)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"connected": false,
			"healthy":   false,
			"error":     err.Error(),
			"latency":   latency.String(),
		})
		return
	}
	defer nc.Close()

	// Test with a ping
	if !nc.IsConnected() {
		c.JSON(http.StatusOK, gin.H{
			"connected": false,
			"healthy":   false,
			"error":     "connection established but not responsive",
		})
		return
	}

	// Try to get server info
	msg, err := nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), 2*time.Second)
	serverInfo := make(map[string]interface{})
	if err == nil {
		json.Unmarshal(msg.Data, &serverInfo)
	}

	c.JSON(http.StatusOK, gin.H{
		"connected": true,
		"healthy":   true,
		"latency":   latency.String(),
		"server":    serverInfo,
	})
}

// GetConnectionStatus returns status of all connections
//
//	@Summary		Get tenancy connection status
//	@Description	Returns the connectivity status of all configured connections
//	@Tags			tenancy
//	@Produce		json
//	@Success		200	{object}	object	"connection statuses"
//	@Router			/tenancy/status [get]
func (h *TenancyHandler) GetConnectionStatus(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	statuses := make([]ConnectionStatus, 0)

	for _, conn := range h.connections {
		if !conn.Enabled {
			statuses = append(statuses, ConnectionStatus{
				ID:          conn.ID,
				Name:        conn.Name,
				Connected:   false,
				Healthy:     false,
				Error:       "disabled",
				LastChecked: time.Now().Format(time.RFC3339),
			})
			continue
		}

		start := time.Now()
		nc, err := nats.Connect(conn.URL,
			nats.Timeout(3*time.Second),
			nats.MaxReconnects(0),
		)
		latency := time.Since(start)

		status := ConnectionStatus{
			ID:          conn.ID,
			Name:        conn.Name,
			LastChecked: time.Now().Format(time.RFC3339),
		}

		if err != nil {
			status.Connected = false
			status.Healthy = false
			status.Error = err.Error()
		} else {
			status.Connected = nc.IsConnected()
			status.Healthy = nc.IsConnected()
			status.Latency = latency.String()
			nc.Close()
		}

		statuses = append(statuses, status)
	}

	c.JSON(http.StatusOK, gin.H{
		"statuses": statuses,
		"count":    len(statuses),
	})
}

// SetDefaultConnection sets a connection as default
//
//	@Summary		Set default connection
//	@Description	Marks a connection as the default NATS connection
//	@Tags			tenancy
//	@Produce		json
//	@Param			id	path		string	true	"Connection ID"
//	@Success		200	{object}	ConnectionConfig
//	@Failure		404	{object}	dto.ErrorResponse
//	@Router			/tenancy/connections/{id}/default [get]
func (h *TenancyHandler) SetDefaultConnection(c *gin.Context) {
	id := c.Param("id")

	h.mu.Lock()
	defer h.mu.Unlock()

	conn, exists := h.connections[id]
	if !exists {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "connection not found"})
		return
	}

	// Remove default from others
	for key := range h.connections {
		h.connections[key].IsDefault = false
	}

	conn.IsDefault = true

	c.JSON(http.StatusOK, conn)
}
