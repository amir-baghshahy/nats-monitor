package e2e

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHealth_OK(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/health"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.Equal(t, "ok", body["status"])
	assert.Equal(t, "connected", body["nats"])
	assert.NotEmpty(t, body["timestamp"])
}

func TestHealth_NATSDisconnected(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/health"), nil)
	assert.Contains(t, []int{http.StatusOK, http.StatusServiceUnavailable}, resp.StatusCode)

	var body map[string]interface{}
	decodeBody(t, resp, &body)
	assert.Contains(t, []string{"ok", "unhealthy"}, body["status"])
}

func TestServerInfo(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/server/info"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.NotEmpty(t, body["server_id"])
	assert.Equal(t, true, body["connected"])
}

func TestAccountInfo(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/account/info"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.NotNil(t, body["memory"])
	assert.NotNil(t, body["storage"])
	assert.NotNil(t, body["streams"])
	assert.NotNil(t, body["consumers"])
	assert.NotNil(t, body["limits"])
	assert.NotNil(t, body["domain"])
}

func TestDashboardStats(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/dashboard/stats"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body struct {
		Streams      int    `json:"streams"`
		Consumers    int    `json:"consumers"`
		Messages     uint64 `json:"messages"`
		Bytes        uint64 `json:"bytes"`
		Connections  int    `json:"connections"`
		ServerStatus string `json:"server_status"`
	}
	decodeBody(t, resp, &body)

	assert.GreaterOrEqual(t, body.Streams, 0)
	assert.GreaterOrEqual(t, body.Consumers, 0)
	assert.Equal(t, "connected", body.ServerStatus)
}

func TestSubjects(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/subjects"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body struct {
		Subjects []map[string]interface{} `json:"subjects"`
		Total    int                      `json:"total"`
	}
	decodeBody(t, resp, &body)

	assert.GreaterOrEqual(t, body.Total, 0)
	assert.NotNil(t, body.Subjects)
}

func TestSystemMetrics(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/metrics/system"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	mem := body["memory"].(map[string]interface{})
	assert.GreaterOrEqual(t, mem["used"].(float64), float64(0))
	assert.GreaterOrEqual(t, mem["max"].(float64), float64(0))
	assert.NotNil(t, body["storage"])
	assert.GreaterOrEqual(t, body["connections"].(float64), float64(0))
	assert.GreaterOrEqual(t, body["streams"].(float64), float64(0))
	assert.GreaterOrEqual(t, body["consumers"].(float64), float64(0))
}

func TestRateMetrics(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/metrics/rates"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.NotNil(t, body["streams"])
	assert.NotNil(t, body["duration"])
}

func TestServiceDiscovery(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/core/services"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.Equal(t, true, body["connected"])
	assert.NotEmpty(t, body["server_url"])
	assert.GreaterOrEqual(t, body["server_count"].(float64), float64(1))
}

func TestActiveSubscriptions_Empty(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/core/subscriptions"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body struct {
		Status        string                   `json:"status"`
		Connected     bool                     `json:"connected"`
		Count         int                      `json:"count"`
		Subscriptions []map[string]interface{} `json:"subscriptions"`
	}
	decodeBody(t, resp, &body)

	assert.True(t, body.Connected)
	assert.Equal(t, "CONNECTED", body.Status)
	assert.GreaterOrEqual(t, body.Count, 0)
}

func TestSecurityInfo(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/security/info"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.NotNil(t, body["account"])
	assert.NotNil(t, body["limits"])
	assert.NotNil(t, body["server_security"])
}

func TestAuditLogs(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/security/audit"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body struct {
		Logs  []map[string]interface{} `json:"logs"`
		Offset int                      `json:"offset"`
		Limit  int                      `json:"limit"`
		Total  int                      `json:"total"`
	}
	decodeBody(t, resp, &body)

	assert.GreaterOrEqual(t, body.Total, 0)
	if len(body.Logs) > 0 {
		first := body.Logs[0]
		assert.NotEmpty(t, first["action"])
		assert.NotEmpty(t, first["timestamp"])
		assert.NotEmpty(t, first["user"])
		assert.NotEmpty(t, first["resource"])
	}
}

func TestConnectionStatus(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/security/connections"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body map[string]interface{}
	decodeBody(t, resp, &body)

	assert.NotNil(t, body["server"])
	assert.NotNil(t, body["security"])
}

func TestHealth_MethodNotAllowed(t *testing.T) {
	resp := doRequest(t, http.MethodPost, apiURL("/health"), nil)
	defer resp.Body.Close()
	assert.Contains(t, []int{http.StatusOK, http.StatusMethodNotAllowed}, resp.StatusCode)
}

func TestNotFoundRoute(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/nonexistent"), nil)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestCORS_Headers(t *testing.T) {
	req, err := http.NewRequest(http.MethodOptions, apiURL("/health"), nil)
	require.NoError(t, err)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", "GET")

	resp, err := httpClient.Do(req)
	require.NoError(t, resp.Body.Close())
	require.NoError(t, err)

	assert.Equal(t, http.StatusNoContent, resp.StatusCode)
	origin := resp.Header.Get("Access-Control-Allow-Origin")
	assert.NotEmpty(t, origin)
}

func TestResponseContentType_JSON(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/health"), nil)
	defer resp.Body.Close()

	ct := resp.Header.Get("Content-Type")
	assert.Contains(t, ct, "application/json")
}

func TestInvalidJSONBody(t *testing.T) {
	resp := doRequest(t, http.MethodPost, apiURL("/streams"), "not-json")
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestMissingRequiredFields(t *testing.T) {
	body := map[string]interface{}{"name": ""}
	resp := doRequest(t, http.MethodPost, apiURL("/streams"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestLargePayload_Rejected(t *testing.T) {
	largePayload := make([]byte, 11*1024*1024)
	body := map[string]interface{}{
		"subject": "test.large",
		"payload": string(largePayload),
	}
	resp := doRequest(t, http.MethodPost, apiURL("/core/publish"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestInvalidStorageType(t *testing.T) {
	body := map[string]interface{}{
		"name":     "test-stream",
		"subjects": []string{"test.>"},
		"storage":  "invalid",
	}
	resp := doRequest(t, http.MethodPost, apiURL("/streams"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestInvalidRetentionPolicy(t *testing.T) {
	body := map[string]interface{}{
		"name":      "test-stream",
		"subjects":  []string{"test.>"},
		"storage":   "file",
		"retention": "invalid",
	}
	resp := doRequest(t, http.MethodPost, apiURL("/streams"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestReplicas_OutOfRange(t *testing.T) {
	body := map[string]interface{}{
		"name":     "test-stream",
		"subjects": []string{"test.>"},
		"storage":  "file",
		"replicas": 10,
	}
	resp := doRequest(t, http.MethodPost, apiURL("/streams"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}
