package middleware

import (
	"log"
	"strings"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/services"
	"github.com/gin-gonic/gin"
)

// AuditMiddleware creates middleware that automatically logs important actions
func AuditMiddleware(auditSvc *services.AuditService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Process request first
		c.Next()

		// Only log successful requests (status < 400)
		if c.Writer.Status() >= 400 {
			return
		}

		// Determine if this request should be audited
		path := c.Request.URL.Path
		method := c.Request.Method

		// Define patterns that should be audited
		auditPatterns := []string{
			"/streams", "/consumers", "/kv/", "/security/", "/alerts/",
		}

		shouldAudit := false
		for _, pattern := range auditPatterns {
			if strings.Contains(path, pattern) {
				shouldAudit = true
				break
			}
		}

		if !shouldAudit {
			return
		}

		// Extract user from context or header
		user := "anonymous"
		if userHeader := c.GetHeader("X-User"); userHeader != "" {
			user = userHeader
		} else if userCtx, exists := c.Get("user"); exists {
			if userStr, ok := userCtx.(string); ok {
				user = userStr
			}
		}

		// Determine action and resource from the request
		action := determineAction(method, path)
		resource := determineResource(path, c)

		// Get metadata
		metadata := extractMetadata(c)

		// Create audit event
		details := buildDetails(method, path, c)

		if err := auditSvc.LogAction(action, user, resource, details, metadata); err != nil {
			log.Printf("Failed to log audit event: %v", err)
		}
	}
}

// determineAction converts HTTP method and path to audit action
func determineAction(method, path string) string {
	switch method {
	case "POST":
		if strings.Contains(path, "/purge") || strings.Contains(path, "/delete") {
			return "purge_delete"
		}
		return "create"
	case "PUT", "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	case "GET":
		return "view"
	default:
		return "access"
	}
}

// determineResource extracts the resource being accessed
func determineResource(path string, c *gin.Context) string {
	// Extract resource identifier from path
	parts := strings.Split(strings.Trim(path, "/"), "/")

	if len(parts) >= 2 {
		resourceType := parts[1] // e.g., "streams", "consumers"

		// Try to get specific resource name from params or path
		if len(parts) >= 3 {
			resourceName := parts[2]
			if resourceName != "" {
				return resourceType + "/" + resourceName
			}
		}

		return resourceType
	}

	return path
}

// extractMetadata creates audit metadata from the request context
func extractMetadata(c *gin.Context) services.Metadata {
	metadata := services.Metadata{}

	// Extract stream name if present
	if streamName := c.Param("name"); streamName != "" {
		metadata.StreamName = streamName
	}

	// Extract consumer name if present
	if consumerName := c.Param("consumer"); consumerName != "" {
		metadata.ConsumerName = consumerName
	}

	// Set operation type based on path
	path := c.Request.URL.Path
	switch {
	case strings.Contains(path, "/create"):
		metadata.OperationType = "creation"
	case strings.Contains(path, "/update"):
		metadata.OperationType = "update"
	case strings.Contains(path, "/delete"):
		metadata.OperationType = "deletion"
	case strings.Contains(path, "/purge"):
		metadata.OperationType = "purge"
	case strings.Contains(path, "/pause") || strings.Contains(path, "/resume"):
		metadata.OperationType = "state_change"
	case strings.Contains(path, "/replay"):
		metadata.OperationType = "replay"
	default:
		metadata.OperationType = "management"
	}

	// Set status based on response status
	metadata.Status = getStatusCodeString(c.Writer.Status())

	return metadata
}

// buildDetails creates a human-readable description of the action
func buildDetails(method, path string, c *gin.Context) string {
	actionMap := map[string]string{
		"POST":   "Created",
		"PUT":    "Updated",
		"PATCH":  "Modified",
		"DELETE": "Deleted",
		"GET":    "Viewed",
	}

	action, ok := actionMap[method]
	if !ok {
		action = "Accessed"
	}

	resource := determineResource(path, c)
	return action + " " + resource
}

// getStatusCodeString converts HTTP status code to string
func getStatusCodeString(status int) string {
	switch {
	case status >= 200 && status < 300:
		return "success"
	case status >= 300 && status < 400:
		return "redirect"
	case status >= 400 && status < 500:
		return "client_error"
	case status >= 500:
		return "server_error"
	default:
		return "unknown"
	}
}

// AuditCleanupMiddleware periodically cleans up old audit logs
func AuditCleanupMiddleware(auditSvc *services.AuditService) {
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	defer ticker.Stop()

	for range ticker.C {
		if err := auditSvc.Cleanup(); err != nil {
			log.Printf("Failed to cleanup audit logs: %v", err)
		} else {
			log.Println("Audit log cleanup completed successfully")
		}
	}
}
