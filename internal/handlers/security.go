package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

// SecurityHandler handles security-related operations
type SecurityHandler struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewSecurityHandler creates a new security handler
func NewSecurityHandler(nc *nats.Conn, js nats.JetStreamContext) *SecurityHandler {
	return &SecurityHandler{nc: nc, js: js}
}

// AccountInfo represents NATS account information
type AccountInfo struct {
	Name        string          `json:"name"`
	Imports     int             `json:"imports"`
	Exports     int             `json:"exports"`
	Responses   int             `json:"responses"`
	ConnLimits  int             `json:"conn_limits"`
	SubLimits   int             `json:"sub_limits"`
	LEnables    int             `json:"lenables"`
	Data        int             `json:"data"`
	Memory      int             `json:"memory"`
	Storage     int             `json:"storage"`
	Streams     int             `json:"streams"`
	Consumers   int             `json:"consumers"`
	Permissions map[string]bool `json:"permissions"`
}

// User represents a NATS user
type User struct {
	Name        string          `json:"name"`
	Account     string          `json:"account"`
	Permissions UserPermissions `json:"permissions"`
	Enabled     bool            `json:"enabled"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// UserPermissions represents user permissions
type UserPermissions struct {
	Publish   map[string]string `json:"publish"`
	Subscribe map[string]string `json:"subscribe"`
}

// GetSecurityInfo returns security and account information
// @Summary Get security info
// @Description Returns account information, limits, and server security settings
// @Tags security
// @Produce json
// @Success 200 {object} object "security info"
// @Router /security/info [get]
func (h *SecurityHandler) GetSecurityInfo(c *gin.Context) {
	// Get account info with fallback
	accountName := "Unknown"
	importsCount := 0
	exportsCount := 0
	connectionsLimit := 0
	subsLimit := 0
	dataLimit := 0
	payloadLimit := 0

	accountMsg, err := h.nc.Request("$JS.API.ACCOUNT.INFO", []byte("{}"), 2*time.Second)
	if err == nil && accountMsg != nil {
		var accountResp struct {
			Type    string `json:"type"`
			Account struct {
				Name    string `json:"name"`
				Domain  string `json:"domain"`
				Imports struct {
					Count int `json:"count"`
				} `json:"imports"`
				Exports struct {
					Count int `json:"count"`
				} `json:"exports"`
			} `json:"account"`
			Limits struct {
				Connected int `json:"connected"`
				Subs      int `json:"subs"`
				Data      int `json:"data"`
				Payload   int `json:"payload"`
			} `json:"limits"`
		}
		if err := json.Unmarshal(accountMsg.Data, &accountResp); err != nil {
			log.Printf("Failed to unmarshal account info: %v", err)
		} else {
			accountName = accountResp.Account.Name
			importsCount = accountResp.Account.Imports.Count
			exportsCount = accountResp.Account.Exports.Count
			connectionsLimit = accountResp.Limits.Connected
			subsLimit = accountResp.Limits.Subs
			dataLimit = accountResp.Limits.Data
			payloadLimit = accountResp.Limits.Payload
		}
	}

	// Get server info with fallback
	var serverResp struct {
		AuthRequired bool `json:"auth_required"`
		TLSRequired  bool `json:"tls_required"`
		TLSVerify    bool `json:"tls_verify"`
	}
	serverMsg, err := h.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), 2*time.Second)
	if err == nil && serverMsg != nil {
		if err := json.Unmarshal(serverMsg.Data, &serverResp); err != nil {
			log.Printf("Failed to unmarshal server info: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"account": gin.H{
			"name":    accountName,
			"imports": importsCount,
			"exports": exportsCount,
		},
		"limits": gin.H{
			"connections":   connectionsLimit,
			"subscriptions": subsLimit,
			"data":          dataLimit,
			"payload":       payloadLimit,
		},
		"server_security": gin.H{
			"auth_required": serverResp.AuthRequired,
			"tls_required":  serverResp.TLSRequired,
			"tls_verify":    serverResp.TLSVerify,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetUsers is not implemented. NATS user management requires operator-level
// JWT/NKey tooling that is outside the scope of this monitoring service.
// @Summary List users
// @Description Returns NATS users (not implemented)
// @Tags security
// @Produce json
// @Success 200 {array} User
// @Failure 501 {object} dto.ErrorResponse
// @Router /security/users [get]
func (h *SecurityHandler) GetUsers(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{Error: "user management is not implemented; configure users via the NATS operator tooling (nsc/nk)"})
}

// CreateUser is not implemented. NATS user management requires operator-level
// JWT/NKey tooling that is outside the scope of this monitoring service.
// @Summary Create a user
// @Description Creates a NATS user (not implemented)
// @Tags security
// @Accept json
// @Produce json
// @Param request body User true "User to create"
// @Success 201 {object} User
// @Failure 501 {object} dto.ErrorResponse
// @Router /security/users [post]
func (h *SecurityHandler) CreateUser(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{Error: "user management is not implemented; configure users via the NATS operator tooling (nsc/nk)"})
}

// UpdateUser is not implemented. NATS user management requires operator-level
// JWT/NKey tooling that is outside the scope of this monitoring service.
// @Summary Update a user
// @Description Updates a NATS user (not implemented)
// @Tags security
// @Accept json
// @Produce json
// @Param name path string true "User name"
// @Param request body User true "User update"
// @Success 200 {object} User
// @Failure 501 {object} dto.ErrorResponse
// @Router /security/users/{name} [put]
func (h *SecurityHandler) UpdateUser(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{Error: "user management is not implemented; configure users via the NATS operator tooling (nsc/nk)"})
}

// DeleteUser is not implemented. NATS user management requires operator-level
// JWT/NKey tooling that is outside the scope of this monitoring service.
// @Summary Delete a user
// @Description Deletes a NATS user (not implemented)
// @Tags security
// @Produce json
// @Param name path string true "User name"
// @Success 200 {object} dto.SuccessResponse
// @Failure 501 {object} dto.ErrorResponse
// @Router /security/users/{name} [delete]
func (h *SecurityHandler) DeleteUser(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, dto.ErrorResponse{Error: "user management is not implemented; configure users via the NATS operator tooling (nsc/nk)"})
}

// GetAuditLogs returns audit logs (placeholder for demo)
// @Summary Get audit logs
// @Description Returns audit log entries
// @Tags security
// @Produce json
// @Success 200 {array} object
// @Router /security/audit [get]
func (h *SecurityHandler) GetAuditLogs(c *gin.Context) {
	// In a real implementation, this would query an audit log stream
	logs := []gin.H{
		{
			"timestamp": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
			"action":    "user_created",
			"user":      "admin",
			"resource":  "service-user",
			"details":   "Created new service user",
		},
		{
			"timestamp": time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			"action":    "stream_created",
			"user":      "admin",
			"resource":  "orders-stream",
			"details":   "Created new stream for orders",
		},
		{
			"timestamp": time.Now().Add(-3 * time.Hour).Format(time.RFC3339),
			"action":    "permission_granted",
			"user":      "admin",
			"resource":  "orders.>",
			"details":   "Granted publish permission for orders.>",
		},
	}

	c.JSON(http.StatusOK, logs)
}

// GetConnectionStatus returns connection security status
// @Summary Get connection security status
// @Description Returns server details and connection security (auth/TLS) status
// @Tags security
// @Produce json
// @Success 200 {object} object "connection status"
// @Router /security/connections [get]
func (h *SecurityHandler) GetConnectionStatus(c *gin.Context) {
	serverName := "NATS Server"
	serverHost := "Unknown"
	serverPort := 4222
	serverVersion := "Unknown"
	authRequired := false
	tlsRequired := false
	tlsVerify := false

	serverMsg, err := h.nc.Request("$SYS.REQ.SERVER.PING", []byte("{}"), 2*time.Second)
	if err == nil && serverMsg != nil {
		var serverResp struct {
			Name         string `json:"server_name"`
			Host         string `json:"host"`
			Port         int    `json:"port"`
			AuthRequired bool   `json:"auth_required"`
			TLSRequired  bool   `json:"tls_required"`
			TLSVerify    bool   `json:"tls_verify"`
			Version      string `json:"version"`
		}
		if err := json.Unmarshal(serverMsg.Data, &serverResp); err != nil {
			log.Printf("Failed to unmarshal connection status: %v", err)
		} else {
			serverName = serverResp.Name
			serverHost = serverResp.Host
			serverPort = serverResp.Port
			serverVersion = serverResp.Version
			authRequired = serverResp.AuthRequired
			tlsRequired = serverResp.TLSRequired
			tlsVerify = serverResp.TLSVerify
		}
	}

	connections := h.nc.Status()

	c.JSON(http.StatusOK, gin.H{
		"server": gin.H{
			"name":    serverName,
			"host":    serverHost,
			"port":    serverPort,
			"version": serverVersion,
		},
		"security": gin.H{
			"auth_required": authRequired,
			"tls_required":  tlsRequired,
			"tls_verify":    tlsVerify,
		},
		"status": connections.String(),
	})
}
