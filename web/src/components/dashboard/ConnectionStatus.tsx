import { useState } from "react";
import { ChevronDown, ChevronUp, Server, Radio, Clock, Download, Upload } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import type { github_com_amir_baghshahy_nats_monitor_internal_dto_ConnectionInfo as ConnectionInfo } from "../../types";

interface ConnectionStatusProps {
  connected: boolean;
  connections: ConnectionInfo[];
}

const VISIBLE_CONNECTIONS = 3;

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat().format(value || 0);
}

export default function ConnectionStatus({
  connected,
  connections,
}: ConnectionStatusProps) {
  const [expanded, setExpanded] = useState(false);

  if (!connections || connections.length === 0) {
    return null;
  }

  const visibleConnections = expanded
    ? connections
    : connections.slice(0, VISIBLE_CONNECTIONS);
  const totalSubscriptions = connections.reduce(
    (sum, conn) => sum + (conn.subs_count || 0),
    0,
  );
  const totalPendingBytes = connections.reduce(
    (sum, conn) => sum + (conn.pending_bytes || 0),
    0,
  );
  const shouldExpand = connections.length > VISIBLE_CONNECTIONS;

  return (
    <div className="card mb-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary-500/20 p-2">
              <Radio className="h-4 w-4 text-primary-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Connection Status</h3>
              <p className="text-xs text-dark-muted">
                {connections.length} active connection{connections.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
        <StatusBadge
          status={connected ? "connected" : "disconnected"}
          pulse={connected}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl bg-dark-bg/50 p-3">
          <p className="text-xs text-dark-muted">Active</p>
          <p className="mt-1 text-lg font-semibold">{connections.length}</p>
        </div>
        <div className="rounded-xl bg-dark-bg/50 p-3">
          <p className="text-xs text-dark-muted">Subscriptions</p>
          <p className="mt-1 text-lg font-semibold">{formatNumber(totalSubscriptions)}</p>
        </div>
        <div className="rounded-xl bg-dark-bg/50 p-3">
          <p className="text-xs text-dark-muted">Pending</p>
          <p className="mt-1 text-lg font-semibold">{formatNumber(totalPendingBytes)}</p>
        </div>
        <div className="rounded-xl bg-dark-bg/50 p-3">
          <p className="text-xs text-dark-muted">Servers</p>
          <p className="mt-1 text-lg font-semibold">
            {new Set(connections.map((conn) => conn.server || conn.server_id || "unknown")).size}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {visibleConnections.map((conn) => (
          <div
            key={conn.cid || conn.server_id || conn.ip || conn.name}
            className="rounded-2xl border border-dark-border/60 bg-dark-bg/40 p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 shrink-0 text-primary-400" />
                  <p className="truncate text-sm font-medium">
                    {conn.name || conn.server || "NATS Server"}
                  </p>
                </div>
                <p className="mt-1 truncate text-xs font-mono text-dark-muted">
                  {conn.ip || "No IP"}
                  {conn.port ? `:${conn.port}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs text-primary-300">
                #{conn.cid || "N/A"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-dark-muted">
              <div className="flex items-center justify-between gap-3">
                <span>User</span>
                <span className="font-medium text-dark-text">{conn.user || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Subscriptions</span>
                <span className="font-medium text-dark-text">{conn.subs_count || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Pending</span>
                <span className="font-medium text-dark-text">
                  {formatNumber(conn.pending_bytes)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>RTT</span>
                <span className="font-medium text-dark-text">{conn.rtt || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>In</span>
                <span className="flex items-center gap-1 font-medium text-dark-text">
                  <Download className="h-3 w-3" />
                  {formatNumber(conn.in_msgs)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Out</span>
                <span className="flex items-center gap-1 font-medium text-dark-text">
                  <Upload className="h-3 w-3" />
                  {formatNumber(conn.out_msgs)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Last Activity</span>
                <span className="flex items-center gap-1 font-medium text-dark-text">
                  <Clock className="h-3 w-3" />
                  {conn.last_activity ? new Date(conn.last_activity).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {shouldExpand && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="btn-secondary mt-3 inline-flex items-center gap-2 text-sm px-3 py-1.5"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show {connections.length - VISIBLE_CONNECTIONS} more
            </>
          )}
        </button>
      )}
    </div>
  );
}
