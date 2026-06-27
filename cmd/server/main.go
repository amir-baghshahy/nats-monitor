package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/config"
	"github.com/amir-baghshahy/nats-horizon/internal/handlers"
	"github.com/amir-baghshahy/nats-horizon/internal/middleware"
	"github.com/amir-baghshahy/nats-horizon/internal/repositories"
	servicespkg "github.com/amir-baghshahy/nats-horizon/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

//	@title			NATS Horizon API
//	@version		1.0
//	@description	Comprehensive API for monitoring and managing NATS JetStream instances.
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	NATS Horizon Project
//	@contact.url	http://github.com/nats-horizon

//	@license.name	Apache-2.0
//	@license.url	https://opensource.org/licenses/Apache-2.0

//	@BasePath	/api
//	@schemes	http https

// NATSConnection manages the NATS connection
type NATSConnection struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewNATSConnection creates a new NATS connection
func NewNATSConnection(url string) (*NATSConnection, error) {
	nc, err := nats.Connect(url,
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(2*time.Second),
		nats.Timeout(30*time.Second),
		nats.DrainTimeout(30*time.Second),
		nats.PingInterval(2*time.Minute),
		nats.MaxPingsOutstanding(5),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			log.Printf("NATS disconnected: %v", err)
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			log.Printf("NATS reconnected to %s", nc.ConnectedUrl())
		}),
	)
	if err != nil {
		return nil, err
	}

	if err := nc.Flush(); err != nil {
		nc.Close()
		return nil, err
	}

	if !nc.IsConnected() {
		nc.Close()
		return nil, fmt.Errorf("failed to establish connection")
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, err
	}

	return &NATSConnection{nc: nc, js: js}, nil
}

// Close closes the NATS connection
func (n *NATSConnection) Close() {
	if n.nc != nil {
		n.nc.Close()
	}
}

// IsConnected returns whether NATS is connected
func (n *NATSConnection) IsConnected() bool {
	return n.nc != nil && n.nc.IsConnected()
}

// CORSMiddleware creates a CORS middleware with configurable origins
func CORSMiddleware(allowedOrigins string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowed := false
		if allowedOrigins == "*" {
			allowed = true
		} else {
			for _, allowedOrigin := range strings.Split(allowedOrigins, ",") {
				if strings.TrimSpace(allowedOrigin) == origin {
					allowed = true
					break
				}
			}
		}

		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	gin.SetMode(cfg.GinMode)

	log.Printf("Connecting to NATS at %s...", cfg.NATSURL)
	natsConn, err := NewNATSConnection(cfg.NATSURL)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v\n\n"+
			"Please ensure:\n"+
			"1. NATS_URL is set correctly in .env or environment\n"+
			"2. NATS server is running and accessible\n"+
			"3. Any required authentication is configured", err)
	}
	log.Println("Connected to NATS")
	defer natsConn.Close()

	streamRepo := repositories.NewNATSStreamRepository(natsConn.nc, natsConn.js)
	consumerRepo := repositories.NewNATSConsumerRepository(natsConn.nc, natsConn.js)
	messageRepo := repositories.NewNATSMessageRepository(natsConn.nc, natsConn.js)

	streamUseCase := servicespkg.NewStreamUseCase(streamRepo)
	consumerUseCase := servicespkg.NewConsumerUseCase(consumerRepo)
	messageUseCase := servicespkg.NewMessageUseCase(messageRepo)
	serverUseCase := servicespkg.NewServerUseCase(natsConn.nc, natsConn.js)

	// Initialize audit service
	auditService := servicespkg.NewAuditService(natsConn.nc, natsConn.js)
	if err := auditService.Initialize(); err != nil {
		log.Printf("Failed to initialize audit service: %v", err)
		// Continue anyway - audit logs won't be available but app should still work
	}

	// Initialize notification service
	notificationService := servicespkg.NewNotificationService()

	// Add default notification channels from environment or config
	// This would typically be loaded from config file or environment variables
	// For now, channels can be added via API

	streamHandler := handlers.NewStreamHandler(streamUseCase)
	consumerHandler := handlers.NewConsumerHandler(consumerUseCase, messageUseCase, natsConn.nc, natsConn.js)
	serverHandler := handlers.NewServerHandler(serverUseCase, messageUseCase, streamUseCase)
	coreNATSHandler := handlers.NewCoreNATShandler(natsConn.nc)
	kvHandler := handlers.NewKVHandler(natsConn.nc, natsConn.js)
	clusterHandler := handlers.NewClusterHandler(natsConn.nc, natsConn.js)
	alertsHandler := handlers.NewAlertsHandler(natsConn.nc, natsConn.js, notificationService)
	metricsHandler := handlers.NewMetricsHandler(natsConn.nc, natsConn.js)
	exportHandler := handlers.NewExportHandler(natsConn.nc, natsConn.js)
	securityHandler := handlers.NewSecurityHandler(natsConn.nc, natsConn.js, auditService)
	historyHandler := handlers.NewHistoryHandler(natsConn.nc, natsConn.js)
	defer metricsHandler.Stop()
	tenancyHandler := handlers.NewTenancyHandler(cfg.NATSURL, natsConn.nc)
	defer historyHandler.Stop()
	defer alertsHandler.Stop()

	sseHub := handlers.NewSSEHub(natsConn.nc)
	go sseHub.MonitorStreams()
	go sseHub.MonitorConsumers()
	defer sseHub.Close()

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(middleware.PanicRecovery())
	r.Use(CORSMiddleware(cfg.CORSAllowedOrigins))
	r.Use(middleware.AuditMiddleware(auditService))

	// Start audit cleanup goroutine
	go middleware.AuditCleanupMiddleware(auditService)

	apiGroup := r.Group("/api")
	{
		apiGroup.GET("/health", handlers.HealthCheck(serverUseCase))
		apiGroup.GET("/server/info", serverHandler.GetServerInfo)
		apiGroup.GET("/account/info", serverHandler.GetAccountInfo)
		apiGroup.GET("/dashboard/stats", serverHandler.GetDashboardStats)
		apiGroup.GET("/events", sseHub.HandleSSE)

		apiGroup.GET("/consumers/:name", consumerHandler.GetConsumerByName)
		apiGroup.GET("/consumers", consumerHandler.ListAll)

		apiGroup.GET("/connections", serverHandler.GetConnections)
		apiGroup.DELETE("/connections/:id", serverHandler.TerminateConnection)

		// Core NATS Pub/Sub
		apiGroup.POST("/core/publish", coreNATSHandler.PublishMessage)
		apiGroup.POST("/core/request", coreNATSHandler.Request)
		apiGroup.GET("/core/subscribe", coreNATSHandler.Subscribe)
		apiGroup.GET("/core/subscriptions", coreNATSHandler.GetActiveSubscriptions)
		apiGroup.GET("/core/services", coreNATSHandler.GetServiceDiscovery)
		apiGroup.GET("/core/monitor", coreNATSHandler.MonitorTraffic)

		apiGroup.GET("/subjects", serverHandler.GetSubjects)
		apiGroup.GET("/metrics/system", serverHandler.GetSystemMetrics)
		apiGroup.GET("/metrics/rates", serverHandler.GetRateMetrics)

		apiGroup.GET("/messages", serverHandler.GetMessages)
		apiGroup.GET("/messages/page", serverHandler.GetStreamMessagesByPage)

		apiGroup.GET("/streams", streamHandler.ListStreams)
		apiGroup.POST("/streams", streamHandler.CreateStream)

		apiGroup.GET("/streams/:name/consumers/:consumer", consumerHandler.GetConsumer)
		apiGroup.POST("/streams/:name/consumers", consumerHandler.CreateConsumer)
		apiGroup.PUT("/streams/:name/consumers/:consumer", consumerHandler.UpdateConsumer)
		apiGroup.DELETE("/streams/:name/consumers/:consumer", consumerHandler.DeleteConsumer)
		apiGroup.POST("/streams/:name/consumers/:consumer/lag-reset", consumerHandler.ResetLag)
		apiGroup.POST("/streams/:name/consumers/:consumer/replay", consumerHandler.Replay)
		apiGroup.POST("/streams/:name/consumers/:consumer/pause", consumerHandler.Pause)
		apiGroup.POST("/streams/:name/consumers/:consumer/resume", consumerHandler.Resume)

		apiGroup.GET("/streams/:name", streamHandler.GetStream)
		apiGroup.PUT("/streams/:name", streamHandler.UpdateStream)
		apiGroup.DELETE("/streams/:name", streamHandler.DeleteStream)
		apiGroup.POST("/streams/:name/purge", streamHandler.PurgeStream)

		apiGroup.DELETE("/streams/:name/messages/:sequence", consumerHandler.DeleteStreamMessage)
		apiGroup.POST("/streams/:name/messages/publish", consumerHandler.PublishMessage)

		// KV Store routes
		apiGroup.GET("/kv/buckets", kvHandler.ListBuckets)
		apiGroup.POST("/kv/buckets", kvHandler.CreateBucket)
		apiGroup.GET("/kv/buckets/:name", kvHandler.GetBucket)
		apiGroup.DELETE("/kv/buckets/:name", kvHandler.DeleteBucket)
		apiGroup.GET("/kv/buckets/:name/keys", kvHandler.ListKeys)
		apiGroup.GET("/kv/buckets/:name/key", kvHandler.GetKey)
		apiGroup.GET("/kv/buckets/:name/history", kvHandler.GetKeyHistory)
		apiGroup.PUT("/kv/buckets/:name/key", kvHandler.PutKey)
		apiGroup.DELETE("/kv/buckets/:name/key", kvHandler.DeleteKey)
		apiGroup.POST("/kv/buckets/:name/purge", kvHandler.PurgeBucket)


		// Consumer Ack Management routes
		apiGroup.GET("/streams/:name/consumers/:consumer/pending", consumerHandler.GetPendingMessages)
		apiGroup.POST("/streams/:name/consumers/:consumer/ack", consumerHandler.AckMessage)
		apiGroup.POST("/streams/:name/consumers/:consumer/nack", consumerHandler.NackMessage)
		apiGroup.POST("/streams/:name/consumers/:consumer/term", consumerHandler.AckTermMessage)

		// Cluster Monitoring routes
		apiGroup.GET("/cluster/info", clusterHandler.GetClusterInfo)
		apiGroup.GET("/cluster/nodes", clusterHandler.GetClusterNodes)
		apiGroup.GET("/cluster/health", clusterHandler.GetClusterHealth)
		apiGroup.GET("/cluster/streams/:name/replicas", clusterHandler.GetStreamReplicas)

		// Metrics routes
		apiGroup.GET("/metrics", metricsHandler.GetMetrics)
		apiGroup.GET("/metrics/streams/:name", metricsHandler.GetStreamMetrics)
		apiGroup.GET("/metrics/streams/:name/consumers/:consumer", metricsHandler.GetConsumerMetrics)

		// Alerts routes
		apiGroup.GET("/alerts", alertsHandler.ListAlerts)
		apiGroup.POST("/alerts", alertsHandler.CreateAlert)
		apiGroup.GET("/alerts/:id", alertsHandler.GetAlert)
		apiGroup.PUT("/alerts/:id", alertsHandler.UpdateAlert)
		apiGroup.DELETE("/alerts/:id", alertsHandler.DeleteAlert)
		apiGroup.POST("/alerts/check", alertsHandler.CheckAlertsNow)
		apiGroup.GET("/alerts/triggers", alertsHandler.ListTriggers)
		apiGroup.POST("/alerts/triggers/:id/ack", alertsHandler.AckTrigger)

		// Export routes
		apiGroup.GET("/export/streams", exportHandler.ExportAllStreams)
		apiGroup.GET("/export/streams/:name", exportHandler.ExportStream)
		apiGroup.POST("/export/streams/:name/messages", exportHandler.ExportMessages)
		apiGroup.GET("/export/streams/:name/consumers/:consumer", exportHandler.ExportConsumer)

		// Security routes
		apiGroup.GET("/security/info", securityHandler.GetSecurityInfo)
		apiGroup.GET("/security/users", securityHandler.GetUsers)
		apiGroup.POST("/security/users", securityHandler.CreateUser)
		apiGroup.PUT("/security/users/:name", securityHandler.UpdateUser)
		apiGroup.DELETE("/security/users/:name", securityHandler.DeleteUser)
		apiGroup.GET("/security/audit", securityHandler.GetAuditLogs)
		apiGroup.GET("/security/connections", securityHandler.GetConnectionStatus)

		// Tenancy routes
		apiGroup.GET("/tenancy/connections", tenancyHandler.ListConnections)
		apiGroup.POST("/tenancy/connections", tenancyHandler.CreateConnection)
		apiGroup.GET("/tenancy/connections/:id", tenancyHandler.GetConnection)
		apiGroup.PUT("/tenancy/connections/:id", tenancyHandler.UpdateConnection)
		apiGroup.DELETE("/tenancy/connections/:id", tenancyHandler.DeleteConnection)
		apiGroup.POST("/tenancy/connections/test", tenancyHandler.TestConnection)
		apiGroup.GET("/tenancy/connections/:id/default", tenancyHandler.SetDefaultConnection)
		apiGroup.GET("/tenancy/status", tenancyHandler.GetConnectionStatus)
		// History routes
		apiGroup.GET("/history/streams/:name", historyHandler.GetStreamHistory)
		apiGroup.GET("/history/streams/:name/analysis", historyHandler.GetAnalysis)
		apiGroup.GET("/history/report", historyHandler.GetReport)
	}

	r.Static("/assets", "./web/dist/assets")
	r.NoRoute(func(c *gin.Context) {
		c.File("./web/dist/index.html")
	})

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.ResolvedPort),
		Handler: r,
	}

	if cfg.ServerPort != strconv.Itoa(cfg.ResolvedPort) {
		log.Printf("Port %s was busy, using random port %d instead", cfg.ServerPort, cfg.ResolvedPort)
	}
	log.Printf("Server starting on http://localhost:%d", cfg.ResolvedPort)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	log.Println("Server exited")
}
