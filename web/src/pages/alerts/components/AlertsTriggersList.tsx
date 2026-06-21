import { Eye, Clock, CheckCircle } from "lucide-react";
import type { AlertTrigger } from "../../../types";

interface AlertsTriggersListProps {
  triggers: AlertTrigger[];
  isAckPending: boolean;
  onAcknowledge: (alertId: string) => void;
}

const SEVERITY_COLORS = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  critical: "bg-red-500/20 text-red-400 border-red-500/50",
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString();

export default function AlertsTriggersList({
  triggers,
  isAckPending,
  onAcknowledge,
}: AlertsTriggersListProps) {
  if (!triggers || triggers.length === 0) {
    return (
      <div className="card text-center py-16">
        <Eye className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Triggered Alerts</h3>
        <p className="text-dark-muted">
          Alerts will appear here when conditions are met
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex flex-col max-h-[600px]">
      <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-4">
        {triggers.map((trigger: AlertTrigger, index: number) => (
          <div
            key={`${trigger.alert_id}-${index}`}
            className={`border-l-4 ${
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
                    className={`text-xs px-2 py-1 rounded border ${
                      SEVERITY_COLORS[trigger.severity]
                    }`}
                  >
                    {trigger.severity}
                  </span>
                  {trigger.acked && (
                    <span className="text-xs flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" />Acknowledged
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
                  onClick={() => onAcknowledge(trigger.alert_id)}
                  className="btn-secondary text-sm"
                  disabled={isAckPending}
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
        {triggers.length} trigger{triggers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
