package config

import (
	"fmt"
	"math/rand"
	"net"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	ServerPort   string
	ResolvedPort int
	GinMode      string

	// NATS
	NATSURL string

	// CORS
	CORSAllowedOrigins string

	// Pagination
	DefaultPageSize int
	MaxPageSize     int

	// Port selection behavior
	PortRangeStart int
	PortRangeEnd   int
	AutoPort       bool
}

func Load() (*Config, error) {

	_ = godotenv.Load()

	cfg := &Config{
		// Server
		ServerPort:     getEnv("PORT", getEnv("SERVER_PORT", "3000")),
		GinMode:        getEnv("GIN_MODE", "debug"),
		PortRangeStart: getEnvInt("PORT_RANGE_START", 3001),
		PortRangeEnd:   getEnvInt("PORT_RANGE_END", 3020),
		AutoPort:       getEnvBool("AUTO_PORT", true),

		// NATS
		NATSURL: getEnv("NATS_URL", "nats://localhost:4222"),

		// CORS
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "*"),

		// Pagination
		DefaultPageSize: getEnvInt("DEFAULT_PAGE_SIZE", 25),
		MaxPageSize:     getEnvInt("MAX_PAGE_SIZE", 100),
	}

	port, err := ResolvePort(cfg)
	if err != nil {
		return nil, err
	}
	cfg.ResolvedPort = port

	if cfg.NATSURL == "" {
		return nil, fmt.Errorf("NATS_URL is required")
	}

	return cfg, nil
}

// ResolvePort finds an available port starting from the configured default.
// Behavior:
//  1. If AUTO_PORT=false, use the exact SERVER_PORT value.
//  2. Try the default port (e.g. 3000).
//  3. If busy, sweep sequentially through [PORT_RANGE_START, PORT_RANGE_END).
//  4. If still nothing, pick a random port in [PORT_RANGE_START, 10000).
func ResolvePort(cfg *Config) (int, error) {
	if !cfg.AutoPort {
		p, err := strconv.Atoi(cfg.ServerPort)
		if err != nil {
			return 0, fmt.Errorf("invalid SERVER_PORT: %w", err)
		}
		return p, nil
	}

	defaultPort, _ := strconv.Atoi(cfg.ServerPort)

	// Try default first
	if isPortFree(defaultPort) {
		return defaultPort, nil
	}

	// Sequential sweep through configured range
	for p := cfg.PortRangeStart; p < cfg.PortRangeEnd; p++ {
		if isPortFree(p) {
			return p, nil
		}
	}

	// Fallback: random from a wider pool
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < 50; i++ {
		p := rng.Intn(10000-cfg.PortRangeStart) + cfg.PortRangeStart
		if isPortFree(p) {
			return p, nil
		}
	}

	return 0, fmt.Errorf("no available port found in range %d-%d", cfg.PortRangeStart, cfg.PortRangeEnd)
}

func isPortFree(port int) bool {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return false
	}
	ln.Close()
	return true
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}
