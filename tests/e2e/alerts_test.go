package e2e

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAlerts_ListEmpty(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/alerts"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body []map[string]interface{}
	decodeBody(t, resp, &body)
	assert.NotNil(t, body)
}

func TestAlerts_TriggersList(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/alerts/triggers"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body []map[string]interface{}
	decodeBody(t, resp, &body)
	assert.NotNil(t, body)
}

func TestAlerts_CheckNow(t *testing.T) {
	resp := doRequest(t, http.MethodPost, apiURL("/alerts/check"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body struct {
		Evaluated int `json:"evaluated"`
		Triggered int `json:"triggered"`
	}
	decodeBody(t, resp, &body)

	assert.GreaterOrEqual(t, body.Evaluated, 0)
	assert.GreaterOrEqual(t, body.Triggered, 0)
	assert.LessOrEqual(t, body.Triggered, body.Evaluated)
}

func TestAlerts_Create_InvalidCondition(t *testing.T) {
	body := map[string]interface{}{
		"name":     "test-alert",
		"enabled":  true,
		"severity": "critical",
		"condition": map[string]interface{}{
			"type":      "invalid_type",
			"threshold": 100,
			"operator":  ">",
		},
	}
	resp := doRequest(t, http.MethodPost, apiURL("/alerts"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestAlerts_GetNonExistent(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/alerts/does-not-exist"), nil)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestAlerts_UpdateNonExistent(t *testing.T) {
	body := map[string]interface{}{"name": "updated"}
	resp := doRequest(t, http.MethodPut, apiURL("/alerts/does-not-exist"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestAlerts_DeleteNonExistent(t *testing.T) {
	resp := doRequest(t, http.MethodDelete, apiURL("/alerts/does-not-exist"), nil)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestAlerts_AckTrigger_NonExistent(t *testing.T) {
	resp := doRequest(t, http.MethodPost, apiURL("/alerts/triggers/does-not-exist/ack"), nil)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestAlerts_ListTriggers_WithFilter(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/alerts/triggers?acked=false"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body []map[string]interface{}
	decodeBody(t, resp, &body)
	assert.NotNil(t, body)
}

func TestAlerts_ListTriggers_WithAlertFilter(t *testing.T) {
	resp := doRequest(t, http.MethodGet, apiURL("/alerts/triggers?alert_id=test"), nil)
	requireStatus(t, resp, http.StatusOK)

	var body []map[string]interface{}
	decodeBody(t, resp, &body)
	assert.NotNil(t, body)
}

func TestAlerts_CreateAndDelete(t *testing.T) {
	body := map[string]interface{}{
		"name":        "e2e-test-alert",
		"description": "E2E test alert",
		"enabled":     true,
		"severity":    "warning",
		"condition": map[string]interface{}{
			"type":      "lag",
			"threshold": 1000,
			"operator":  ">",
		},
		"cooldown": 60,
	}
	resp := doRequest(t, http.MethodPost, apiURL("/alerts"), body)
	requireStatus(t, resp, http.StatusCreated)

	var created map[string]interface{}
	decodeBody(t, resp, &created)
	assert.NotEmpty(t, created["id"])
	assert.Equal(t, "e2e-test-alert", created["name"])
	assert.Equal(t, true, created["enabled"])
	assert.Equal(t, "warning", created["severity"])
	createdID := created["id"].(string)

	getResp := doRequest(t, http.MethodGet, apiURL("/alerts/"+createdID), nil)
	requireStatus(t, getResp, http.StatusOK)

	delResp := doRequest(t, http.MethodDelete, apiURL("/alerts/"+createdID), nil)
	requireStatus(t, delResp, http.StatusOK)

	notFoundResp := doRequest(t, http.MethodGet, apiURL("/alerts/"+createdID), nil)
	defer notFoundResp.Body.Close()
	assert.Equal(t, http.StatusNotFound, notFoundResp.StatusCode)
}

func TestAlerts_Create_MissingName(t *testing.T) {
	body := map[string]interface{}{
		"enabled":  true,
		"severity": "warning",
		"condition": map[string]interface{}{
			"type":      "lag",
			"threshold": 100,
			"operator":  ">",
		},
	}
	resp := doRequest(t, http.MethodPost, apiURL("/alerts"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestAlerts_Create_InvalidSeverity(t *testing.T) {
	body := map[string]interface{}{
		"name":     "test",
		"severity": "invalid",
		"condition": map[string]interface{}{
			"type":      "lag",
			"threshold": 100,
			"operator":  ">",
		},
	}
	resp := doRequest(t, http.MethodPost, apiURL("/alerts"), body)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestAlerts_Update(t *testing.T) {
	body := map[string]interface{}{
		"name":        "e2e-update-alert",
		"description": "original",
		"enabled":     true,
		"severity":    "info",
		"condition": map[string]interface{}{
			"type":      "lag",
			"threshold": 500,
			"operator":  ">",
		},
		"cooldown": 30,
	}
	resp := doRequest(t, http.MethodPost, apiURL("/alerts"), body)
	requireStatus(t, resp, http.StatusCreated)

	var created struct {
		ID string `json:"id"`
	}
	decodeBody(t, resp, &created)

	updateBody := map[string]interface{}{
		"name":        "e2e-updated-alert",
		"description": "updated",
		"enabled":     false,
		"severity":    "critical",
	}
	updateResp := doRequest(t, http.MethodPut, apiURL("/alerts/"+created.ID), updateBody)
	requireStatus(t, updateResp, http.StatusOK)

	var updated map[string]interface{}
	decodeBody(t, updateResp, &updated)
	assert.Equal(t, "e2e-updated-alert", updated["name"])
	assert.Equal(t, false, updated["enabled"])
	assert.Equal(t, "critical", updated["severity"])

	delResp := doRequest(t, http.MethodDelete, apiURL("/alerts/"+created.ID), nil)
	requireStatus(t, delResp, http.StatusOK)
}
