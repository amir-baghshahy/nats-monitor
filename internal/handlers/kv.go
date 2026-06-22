package handlers

import (
	"encoding/json"
	"fmt"
	"strings"
	"net/http"
	"time"

	"github.com/amir-baghshahy/nats-horizon/internal/dto"
	"github.com/gin-gonic/gin"
	"github.com/nats-io/nats.go"
)

// normalizeBucketName removes the KV_ prefix if present
func normalizeBucketName(name string) string {
	if len(name) > 3 && name[:3] == "KV_" {
		return name[3:]
	}
	return name
}

// KVHandler handles KV store operations
type KVHandler struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewKVHandler creates a new KV handler
func NewKVHandler(nc *nats.Conn, js nats.JetStreamContext) *KVHandler {
	return &KVHandler{nc: nc, js: js}
}

// ListBuckets returns all KV buckets
// @Summary List KV buckets
// @Description Returns all JetStream Key-Value store buckets
// @Tags kv
// @Produce json
// @Success 200 {array} dto.KVBucketInfo
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets [get]
func (h *KVHandler) ListBuckets(c *gin.Context) {
	// List all keystores in the current account
	storeNames := []string{}
	offset := 0
	limit := 256

	for {
		// Get stream list with pagination
		req := fmt.Sprintf(`{"offset":%d,"limit":%d}`, offset, limit)
		msg, err := h.nc.Request("$JS.API.STREAM.LIST", []byte(req), 5*time.Second)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: fmt.Sprintf("Failed to list streams: %v", err)})
			return
		}

		var response struct {
			Streams []struct {
				Config struct {
					Name   string `json:"name"`
					Sealed bool   `json:"sealed"`
					Mirror *struct {
						Name string `json:"name"`
					} `json:"mirror"`
					Sources []struct {
						Name string `json:"name"`
					} `json:"sources"`
				} `json:"config"`
			} `json:"streams"`
			Total  int `json:"total"`
			Offset int `json:"offset"`
		}

		if err := json.Unmarshal(msg.Data, &response); err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: fmt.Sprintf("Failed to parse response: %v", err)})
			return
		}

		// Collect KV bucket names
		for _, stream := range response.Streams {
			name := stream.Config.Name

			// Skip sealed streams, mirrors, and source streams (not primary KV buckets)
			if stream.Config.Sealed || stream.Config.Mirror != nil || len(stream.Config.Sources) > 0 {
				continue
			}

			// Check if it's a KV bucket (has KV_ prefix)
			if len(name) > 3 && name[:3] == "KV_" {
				storeNames = append(storeNames, name)
			}
		}

		// Check if we've got all streams
		if offset+len(response.Streams) >= response.Total {
			break
		}
		offset += len(response.Streams)
	}

	// Get bucket information for each store
	buckets := []dto.KVBucketInfo{}
	for _, name := range storeNames {
		// Extract bucket name (remove KV_ prefix)
		bucketName := name[3:]

		kv, err := h.js.KeyValue(bucketName)
		if err != nil {
			// Try with full name
			kv, err = h.js.KeyValue(name)
			if err != nil {
				continue
			}
		}

		status, err := kv.Status()
		if err != nil {
			continue
		}

		buckets = append(buckets, dto.KVBucketInfo{
			Name:       name,
			BucketName: bucketName,
			Values:     status.Values(),
			Bytes:      status.Bytes(),
		})
	}

	c.JSON(http.StatusOK, buckets)
}

// GetBucket returns detailed bucket information
// @Summary Get a KV bucket
// @Description Returns detailed information about a single KV bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Success 200 {object} dto.KVBucketInfo
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name} [get]
func (h *KVHandler) GetBucket(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	status, err := kv.Status()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.KVBucketInfo{
		Name:       bucketName,
		BucketName: bucketName,
		Values:     status.Values(),
		Bytes:      status.Bytes(),
	})
}

// CreateBucket creates a new KV bucket
// @Summary Create a KV bucket
// @Description Creates a new JetStream Key-Value store bucket
// @Tags kv
// @Accept json
// @Produce json
// @Param request body object true "Bucket configuration" example({"name":"mybucket","history":1,"ttl":0,"max_bytes":0,"max_value_size":0,"compression":false,"replicas":1,"storage":"file"})
// @Success 201 {object} dto.KVBucketCreateResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets [post]
func (h *KVHandler) CreateBucket(c *gin.Context) {
	var req struct {
		Name         string `json:"name" binding:"required"`
		History      uint64 `json:"history"`
		TTL          uint64 `json:"ttl"`
		MaxBytes     uint64 `json:"max_bytes"`
		MaxValueSize uint64 `json:"max_value_size"`
		Compression  bool   `json:"compression"`
		Replicas     int    `json:"replicas"`
		Storage      string `json:"storage"` // "file" or "memory"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Validate bucket name
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Bucket name is required"})
		return
	}

	// Validate bucket name format (NATS requires valid names)
	for i, ch := range req.Name {
		if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '_' || ch == '-' || (i > 0 && (ch == '.'))) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid bucket name: must contain only letters, numbers, underscores, hyphens, and dots (cannot start with dot)"})
			return
		}
	}

	if len(req.Name) > 256 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bucket name too long (max 256 characters)"})
		return
	}

	// Validate payload sizes
	const maxPayloadSize = 1 << 30 // 1GB
	if req.MaxBytes > maxPayloadSize {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "max_bytes exceeds maximum allowed size"})
		return
	}
	if req.MaxValueSize > maxPayloadSize {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "max_value_size exceeds maximum allowed size"})
		return
	}

	// Determine storage type
	storage := nats.FileStorage
	if req.Storage == "memory" {
		storage = nats.MemoryStorage
	}

	// Set defaults
	history := uint8(1)
	if req.History > 0 && req.History <= 64 {
		history = uint8(req.History)
	}

	replicas := 1
	if req.Replicas > 5 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "replicas must be between 1 and 5"})
		return
	}
	if req.Replicas > 0 {
		replicas = req.Replicas
	}

	// Create the bucket with configuration
	kv, err := h.js.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:       req.Name,
		Description:  "Created via NATS Horizon UI",
		MaxBytes:     int64(req.MaxBytes),
		MaxValueSize: int32(req.MaxValueSize),
		History:      history,
		TTL:          time.Duration(req.TTL) * time.Second,
		Storage:      storage,
		Replicas:     replicas,
		Compression:  req.Compression,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: fmt.Sprintf("Failed to create bucket: %v", err)})
		return
	}

	status, err := kv.Status()
	if err != nil {
		c.JSON(http.StatusCreated, dto.KVBucketCreateResponse{
			Name:    req.Name,
			Values:  0,
			History: history,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.KVBucketCreateResponse{
		Name:    req.Name,
		Values:  status.Values(),
		History: history,
	})
}

// DeleteBucket deletes a KV bucket
// @Summary Delete a KV bucket
// @Description Deletes a JetStream Key-Value store bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Success 200 {object} dto.KVBucketDeleteResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name} [delete]
func (h *KVHandler) DeleteBucket(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))

	err := h.js.DeleteKeyValue(bucketName)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "does not exist") {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.KVBucketDeleteResponse{Message: "bucket deleted", Name: bucketName})
}

// ListKeys returns all keys in a bucket
// @Summary List keys in a KV bucket
// @Description Returns all keys (with values and revisions) in a KV bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Success 200 {array} dto.KVKeyEntry
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name}/keys [get]
func (h *KVHandler) ListKeys(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	// List all keys
	keysList, err := kv.Keys()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	keys := []dto.KVKeyEntry{}
	for _, key := range keysList {
		entry, err := kv.Get(key)
		if err != nil {
			continue
		}

		keys = append(keys, dto.KVKeyEntry{
			Key:      key,
			Value:    string(entry.Value()),
			Revision: entry.Revision(),
			Created:  entry.Created(),
		})
	}

	c.JSON(http.StatusOK, keys)
}

// GetKey returns a specific key from a bucket
// @Summary Get a KV key
// @Description Returns the value and revision of a single key in a KV bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Param key query string true "Key name"
// @Success 200 {object} dto.KVKeyEntry
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /kv/buckets/{name}/key [get]
func (h *KVHandler) GetKey(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))
	key := c.Query("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "key parameter required"})
		return
	}

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	entry, err := kv.Get(key)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "key not found"})
		return
	}

	c.JSON(http.StatusOK, dto.KVKeyEntry{
		Key:      key,
		Value:    string(entry.Value()),
		Revision: entry.Revision(),
		Created:  entry.Created(),
	})
}

// GetKeyHistory returns the history of a key
// @Summary Get KV key history
// @Description Returns the revision history of a single key in a KV bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Param key query string true "Key name"
// @Success 200 {array} dto.KVKeyHistoryEntry
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name}/history [get]
func (h *KVHandler) GetKeyHistory(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))
	key := c.Query("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "key parameter required"})
		return
	}

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	// Get history watcher
	watcher, err := kv.Watch(key, nil, nats.IgnoreDeletes(), nats.UpdatesOnly())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	defer watcher.Stop()

	history := []dto.KVKeyHistoryEntry{}
	for entry := range watcher.Updates() {
		if entry == nil {
			break
		}

		history = append(history, dto.KVKeyHistoryEntry{
			Key:       entry.Key(),
			Value:     string(entry.Value()),
			Revision:  entry.Revision(),
			Created:   entry.Created(),
			Operation: entry.Operation().String(),
		})
	}

	c.JSON(http.StatusOK, history)
}

// PutKey creates or updates a key
// @Summary Put a KV key
// @Description Creates or updates a key in a KV bucket
// @Tags kv
// @Accept json
// @Produce json
// @Param name path string true "Bucket name"
// @Param request body object true "Key/value to write" example({"key":"foo","value":"bar"})
// @Success 200 {object} dto.KVKeyPutResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name}/key [put]
func (h *KVHandler) PutKey(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))

	var req struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	_, err = kv.Put(req.Key, []byte(req.Value))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.KVKeyPutResponse{Message: "key created/updated", Key: req.Key})
}

// DeleteKey deletes a key
// @Summary Delete a KV key
// @Description Deletes a key from a KV bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Param key query string true "Key name"
// @Success 200 {object} dto.KVKeyDeleteResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name}/key [delete]
func (h *KVHandler) DeleteKey(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))
	key := c.Query("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "key parameter required"})
		return
	}

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	err = kv.Delete(key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.KVKeyDeleteResponse{Message: "key deleted", Key: key})
}

// PurgeBucket removes all deleted keys from a bucket
// @Summary Purge a KV bucket
// @Description Removes all deleted-key tombstones from a KV bucket
// @Tags kv
// @Produce json
// @Param name path string true "Bucket name"
// @Success 200 {object} dto.KVPurgeResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /kv/buckets/{name}/purge [post]
func (h *KVHandler) PurgeBucket(c *gin.Context) {
	bucketName := normalizeBucketName(c.Param("name"))

	kv, err := h.js.KeyValue(bucketName)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "bucket not found"})
		return
	}

	err = kv.PurgeDeletes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.KVPurgeResponse{Message: "bucket purged", Name: bucketName})
}
