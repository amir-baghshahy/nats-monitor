import { Network, RefreshCw, Server } from "lucide-react";

export interface ServiceInfo {
  server_name?: string;
  version?: string;
  max_payload?: number;
}

interface ServiceDiscoveryPanelProps {
  serviceInfo?: ServiceInfo;
  subscriptions: Set<string>;
  onRefresh?: () => void;
}

export default function ServiceDiscoveryPanel({
  serviceInfo,
  subscriptions,
  onRefresh,
}: ServiceDiscoveryPanelProps) {
  const subscriptionList = Array.from(subscriptions);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Server className="h-5 w-5" />
            Service Discovery
          </h2>
          <button
            type="button"
            onClick={onRefresh}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-dark-bg/50 p-4">
            <p className="text-xs text-dark-muted">Server Name</p>
            <p className="mt-1 truncate text-sm font-mono">
              {serviceInfo?.server_name || "NATS Server"}
            </p>
          </div>
          <div className="rounded-xl bg-dark-bg/50 p-4">
            <p className="text-xs text-dark-muted">Version</p>
            <p className="mt-1 text-sm">
              {serviceInfo?.version || "Not available"}
            </p>
          </div>
          <div className="rounded-xl bg-dark-bg/50 p-4">
            <p className="text-xs text-dark-muted">Max Payload</p>
            <p className="mt-1 text-sm">
              {serviceInfo?.max_payload
                ? `${(serviceInfo.max_payload / 1024).toFixed(0)} KB`
                : "Not available"}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Network className="h-5 w-5 text-primary-400" />
          Active Subscriptions
        </h3>
        {subscriptionList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subscriptionList.map((subject) => (
              <span
                key={subject}
                className="rounded-xl border border-dark-border/70 bg-dark-bg/50 px-3 py-2 font-mono text-sm text-primary-300"
              >
                {subject}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-8 text-center text-dark-muted">
            <Network className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>Subscribe to a subject to start monitoring Core NATS traffic.</p>
          </div>
        )}
      </div>
    </div>
  );
}
