import { Bell, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import type { Alert, AlertTrigger } from "../../../types";

interface AlertsStatsProps {
  alerts: Alert[];
  triggers: AlertTrigger[];
}

export default function AlertsStats({ alerts, triggers }: AlertsStatsProps) {
  const totalAlerts = alerts?.length || 0;
  const activeAlerts = alerts?.filter((a: Alert) => a.enabled)?.length || 0;
  const unackedTriggers = triggers?.filter((t: AlertTrigger) => !t.acked) || [];
  const criticalTriggers = triggers?.filter(
    (t: AlertTrigger) => t.severity === "critical" && !t.acked,
  ) || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalAlerts}</p>
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
            <p className="text-2xl font-bold">{activeAlerts}</p>
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
  );
}
