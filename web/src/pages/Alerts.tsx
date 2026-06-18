import type { Alert, AlertTrigger } from "../types";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Settings,
  Eye,
  ToggleLeft,
  ToggleRight,
  Filter,
} from "lucide-react";

const SEVERITY_COLORS = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  critical: "bg-red-500/20 text-red-400 border-red-500/50",
};

export default function Alerts() {
  const [activeTab, setActiveTab] = useState<"alerts" | "triggers">("alerts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => axios.get("/api/alerts").then((res) => res.data),
    refetchInterval: 10000,
  });

  const { data: triggers } = useQuery({
    queryKey: ["alertTriggers"],
    queryFn: () => axios.get("/api/alerts/triggers").then((res) => res.data),
    refetchInterval: 5000,
    enabled: activeTab === "triggers",
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: Partial<Alert>) => axios.post("/api/alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setShowCreateModal(false);
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Alert> }) =>
      axios.put(`/api/alerts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: (alert: Alert) =>
      axios.put(`/api/alerts/${alert.id}`, {
        ...alert,
        enabled: !alert.enabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const ackTriggerMutation = useMutation({
    mutationFn: (id: string) =>
      axios.post(`/api/alerts/triggers/${id}/ack`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertTriggers"] });
    },
  });

  const filteredAlerts =
    alerts?.filter((alert: Alert) => {
      if (filterSeverity === "all") return true;
      return alert.severity === filterSeverity;
    }) || [];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCooldown = (nanos: number) => {
    const seconds = nanos / 1000000000;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds)}s`;
  };

  const unackedTriggers = triggers?.filter((t: AlertTrigger) => !t.acked) || [];
  const criticalTriggers =
    triggers?.filter(
      (t: AlertTrigger) => t.severity === "critical" && !t.acked,
    ) || [];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Alerts & Notifications
          </h1>
          <p className="text-dark-muted mt-1">
            Configure and monitor alerts for your NATS infrastructure
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alerts?.length || 0}</p>
              <p className="text-xs text-dark-muted">Total Alerts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {alerts?.filter((a: Alert) => a.enabled)?.length || 0}
              </p>
              <p className="text-xs text-dark-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unackedTriggers.length}</p>
              <p className="text-xs text-dark-muted">Unacknowledged</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{criticalTriggers.length}</p>
              <p className="text-xs text-dark-muted">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-dark-bg p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "alerts"
              ? "bg-primary-600 text-white"
              : "text-dark-muted hover:text-dark-text hover:bg-dark-border"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Alert Rules</span>
        </button>
        <button
          onClick={() => setActiveTab("triggers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative ${
            activeTab === "triggers"
              ? "bg-primary-600 text-white"
              : "text-dark-muted hover:text-dark-text hover:bg-dark-border"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Triggered Alerts</span>
          {unackedTriggers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {unackedTriggers.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-muted" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="input"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alert Rules */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {filteredAlerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className="card hover:border-dark-border/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <button
                    onClick={() => toggleAlertMutation.mutate(alert)}
                    className="mt-1"
                    disabled={toggleAlertMutation.isPending}
                  >
                    {alert.enabled ? (
                      <ToggleRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-dark-muted" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{alert.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${SEVERITY_COLORS[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                      {!alert.enabled && (
                        <span className="text-xs text-dark-muted">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-muted mb-3">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-muted">
                      <span className="font-mono bg-dark-bg px-2 py-1 rounded">
                        {alert.condition.type}: {alert.condition.operator}{" "}
                        {alert.condition.threshold}
                      </span>
                      {alert.condition.stream && (
                        <span>Stream: {alert.condition.stream}</span>
                      )}
                      <span>Cooldown: {formatCooldown(alert.cooldown)}</span>
                      <span>Triggered: {alert.trigger_count}x</span>
                      {alert.last_trigger && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(alert.last_trigger)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowCreateModal(true);
                    }}
                    className="p-2 hover:bg-dark-bg rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete alert "${alert.name}"?`)) {
                        deleteAlertMutation.mutate(alert.id);
                      }
                    }}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="card text-center py-16">
              <Bell className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Alerts Configured</h3>
              <p className="text-dark-muted mb-4">
                Create alerts to monitor your NATS infrastructure
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Alert
              </button>
            </div>
          )}
        </div>
      )}

      {/* Triggered Alerts */}
      {activeTab === "triggers" && (
        <div className="space-y-4">
          {triggers?.map((trigger: AlertTrigger, index: number) => (
            <div
              key={`${trigger.alert_id}-${index}`}
              className={`card border-l-4 ${
                trigger.severity === "critical"
                  ? "border-l-red-500"
                  : trigger.severity === "warning"
                    ? "border-l-yellow-500"
                    : "border-l-blue-500"
              } ${trigger.acked ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{trigger.alert_name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${SEVERITY_COLORS[trigger.severity]}`}
                    >
                      {trigger.severity}
                    </span>
                    {trigger.acked && (
                      <span className="text-xs flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-2">{trigger.message}</p>
                  <div className="flex items-center gap-4 text-xs text-dark-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(trigger.triggered_at)}
                    </span>
                    {trigger.acked_by && (
                      <span>Acked by: {trigger.acked_by}</span>
                    )}
                  </div>
                </div>
                {!trigger.acked && (
                  <button
                    onClick={() => ackTriggerMutation.mutate(trigger.alert_id)}
                    className="btn-secondary text-sm"
                    disabled={ackTriggerMutation.isPending}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}

          {(!triggers || triggers.length === 0) && (
            <div className="card text-center py-16">
              <Eye className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Triggered Alerts</h3>
              <p className="text-dark-muted">
                Alerts will appear here when conditions are met
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {selectedAlert ? "Edit Alert" : "Create Alert"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedAlert(null);
                }}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data: Partial<Alert> = {
                  name: formData.get("name") as string,
                  description: formData.get("description") as string,
                  severity: formData.get("severity") as Alert["severity"],
                  enabled: formData.get("enabled") === "true",
                  condition: {
                    type: formData.get("condition_type") as string,
                    stream: formData.get("stream") as string,
                    consumer: formData.get("consumer") as string,
                    threshold: parseInt(formData.get("threshold") as string),
                    operator: formData.get("operator") as string,
                  },
                  channels: [],
                  cooldown: 300000000000, // 5 minutes in nanos
                };
                if (selectedAlert) {
                  updateAlertMutation.mutate({ id: selectedAlert.id, data });
                } else {
                  createAlertMutation.mutate(data);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  Alert Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedAlert?.name}
                  placeholder="High Consumer Lag"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedAlert?.description}
                  placeholder="Alert when consumer lag exceeds threshold"
                  rows={2}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Condition Type
                  </label>
                  <select
                    name="condition_type"
                    defaultValue={selectedAlert?.condition.type || "lag"}
                    className="input w-full"
                  >
                    <option value="lag">Consumer Lag</option>
                    <option value="storage">Storage Usage</option>
                    <option value="messages">Message Count</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Severity
                  </label>
                  <select
                    name="severity"
                    defaultValue={selectedAlert?.severity || "warning"}
                    className="input w-full"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Operator
                  </label>
                  <select
                    name="operator"
                    defaultValue={selectedAlert?.condition.operator || ">"}
                    className="input w-full"
                  >
                    <option value="&gt;">&gt; Greater than</option>
                    <option value="&lt;">&lt; Less than</option>
                    <option value="&gt;=">&ge; Greater or equal</option>
                    <option value="&lt;=">&le; Less or equal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Threshold
                  </label>
                  <input
                    type="number"
                    name="threshold"
                    defaultValue={selectedAlert?.condition.threshold || 1000}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stream Name (optional)
                </label>
                <input
                  type="text"
                  name="stream"
                  defaultValue={selectedAlert?.condition.stream || ""}
                  placeholder="my-stream"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Consumer Name (optional)
                </label>
                <input
                  type="text"
                  name="consumer"
                  defaultValue={selectedAlert?.condition.consumer || ""}
                  placeholder="my-consumer"
                  className="input w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enabled"
                  id="enabled"
                  defaultChecked={selectedAlert?.enabled ?? true}
                  value="true"
                />
                <label htmlFor="enabled" className="text-sm">
                  Enable this alert
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedAlert(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedAlert ? "Update" : "Create"} Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
