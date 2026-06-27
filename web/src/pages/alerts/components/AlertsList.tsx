import { Bell, Plus, ToggleLeft, ToggleRight, Edit, Trash2, Clock } from "lucide-react";
import type { Alert } from "../../../types";

interface AlertsListProps {
  alerts: Alert[];
  isTogglePending: boolean;
  onToggle: (alert: Alert) => void;
  onEdit: (alert: Alert) => void;
  onDelete: (alert: Alert) => void;
  confirm: (options: any) => Promise<boolean>;
}

const SEVERITY_COLORS = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  critical: "bg-red-500/20 text-red-400 border-red-500/50",
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString();

const formatCooldown = (nanos: number) => {
  const seconds = nanos / 1000000000;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds)}s`;
};

export default function AlertsList({
  alerts,
  isTogglePending,
  onToggle,
  onEdit,
  onDelete,
  confirm,
}: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="card text-center py-16">
        <Bell className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Alerts Configured</h3>
        <p className="text-dark-muted mb-4">
          Create alerts to monitor your NATS infrastructure
        </p>
        <button
          onClick={() => onEdit({} as Alert)}
          className="btn-primary flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4" />
          Create Your First Alert
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex flex-col max-h-[600px]">
      <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-4">
        {alerts.map((alert: Alert, index: number) => {
        const delayClass = index === 0 ? "" : `animate-delay-${Math.min(index * 50, 500)}`;
        return (
          <div
            key={alert.id}
            className={`card hover:border-dark-border/50 transition-colors animate-fade-in hover-lift ${delayClass}`}
          >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <button
                onClick={() => onToggle(alert)}
                className="mt-1 hover-scale active-scale"
                disabled={isTogglePending}
              >
                {alert.enabled ? (
                  <ToggleRight className="w-5 h-5 text-green-400 animate-bounce-in" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-dark-muted" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{alert.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${
                      SEVERITY_COLORS[alert.severity || 'info']
                    }`}
                  >
                    {alert.severity}
                  </span>
                  {!alert.enabled && (
                    <span className="text-xs text-dark-muted">Disabled</span>
                  )}
                </div>
                <p className="text-sm text-dark-muted mb-3">
                  {alert.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-dark-muted">
                  {alert.condition && (
                    <span className="font-mono bg-dark-bg px-2 py-1 rounded">
                      {alert.condition.type}: {alert.condition.operator}{" "}
                      {alert.condition.threshold}
                    </span>
                  )}
                  {alert.condition?.stream && (
                    <span>Stream: {alert.condition.stream}</span>
                  )}
                  <span>Cooldown: {formatCooldown(alert.cooldown || 0)}</span>
                  <span>Triggered: {alert.trigger_count || 0}x</span>
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
                onClick={() => onEdit(alert)}
                className="p-2 hover:bg-dark-bg rounded-lg hover-lift active-scale"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: "Delete Alert",
                    message: `Delete alert "${alert.name}"?`,
                    confirmLabel: "Delete",
                    variant: "danger",
                  });
                  if (ok) onDelete(alert);
                }}
                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg hover-lift active-scale"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        );
      })}
      </div>
      <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
        {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
