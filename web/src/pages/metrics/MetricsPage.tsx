import { UseMetricsReturn } from "./hooks/useMetrics";
import {
  Activity,
  BarChart3,
  Clock,
  HardDrive,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { MetricDataPoint } from "../../types";
import { formatBytes, formatNumber } from "../../utils/formatters";
import { PageError, PageLoading } from "../../components/ui/PageState";

const durations = [
  { label: "Last 15 minutes", value: "15m" },
  { label: "Last 1 hour", value: "1h" },
  { label: "Last 6 hours", value: "6h" },
  { label: "Last 24 hours", value: "24h" },
];

function Sparkline({
  data,
  color,
  width = 200,
  height = 40,
}: {
  data: MetricDataPoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-dark-muted text-xs"
      >
        Collecting data...
      </div>
    );
  }

  const values = data.map((point) => point.value || 0);

  if (values.every((v) => v === 0)) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-dark-muted text-xs"
      >
        No activity
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  if (data.length === 1) {
    const x = width / 2;
    const y = height - ((values[0] - min) / range) * height;
    const cy = Math.max(4, Math.min(height - 4, y));
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line
          x1={0}
          y1={cy}
          x2={width}
          y2={cy}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.4"
        />
        <circle cx={x} cy={cy} r="4" fill={color} opacity="0.9" />
      </svg>
    );
  }

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MetricsPage({
  selectedStream,
  setSelectedStream,
  duration,
  setDuration,
  autoRefresh,
  setAutoRefresh,
  metrics,
  rates,
  systemMetrics,
  isLoading,
  error,
  refetch,
  getErrorMessage,
  getLatestValue,
  getTrend,
  getSeries,
  streamNames,
  totalMessages,
  totalStorage,
  rateStreams,
  rateTotalMessages,
  rateTotalBytes,
}: UseMetricsReturn) {
  if (isLoading) {
    return <PageLoading text="Loading metrics..." />;
  }

  if (error) {
    return <PageError message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Real-time Metrics</h1>
          <p className="mt-1 text-dark-muted">
            Monitor NATS infrastructure performance, rates, and system usage
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input w-full shrink-0 sm:w-auto"
          >
            {durations.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            aria-pressed={autoRefresh}
            className={`btn-secondary inline-flex shrink-0 items-center gap-2 ${
              autoRefresh
                ? "border-primary-500/40 bg-primary-500/15 text-primary-300"
                : ""
            }`}
          >
            {autoRefresh ? (
              <Activity className="h-4 w-4 text-green-400" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            Auto-refresh
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-secondary inline-flex shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20">
              <MessageSquare className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatNumber(totalMessages)}
              </p>
              <p className="text-xs text-dark-muted">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <HardDrive className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatBytes(totalStorage)}</p>
              <p className="text-xs text-dark-muted">Total Storage</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streamNames.length}</p>
              <p className="text-xs text-dark-muted">Active Streams</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <Zap className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatNumber(rateTotalMessages)}
              </p>
              <p className="text-xs text-dark-muted">Messages in Rate Window</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] mt-6">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">System Metrics</h2>
            <p className="text-xs text-dark-muted">
              {systemMetrics?.timestamp
                ? new Date(systemMetrics.timestamp * 1000).toLocaleTimeString()
                : "N/A"}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">Memory Used</p>
              <p className="mt-1 text-lg font-medium">
                {formatBytes(systemMetrics?.memory?.used || 0)}
              </p>
              <p className="text-xs text-dark-muted">
                {systemMetrics?.memory?.max
                  ? `${systemMetrics.memory.usage || 0}% of ${formatBytes(systemMetrics.memory.max)}`
                  : systemMetrics?.memory?.usage !== undefined
                    ? `${systemMetrics.memory.usage}% — Unlimited`
                    : "Unlimited"}
              </p>
            </div>
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">Storage Used</p>
              <p className="mt-1 text-lg font-medium">
                {formatBytes(systemMetrics?.storage?.used || 0)}
              </p>
              <p className="text-xs text-dark-muted">
                {systemMetrics?.storage?.max
                  ? `${systemMetrics.storage.usage || 0}% of ${formatBytes(systemMetrics.storage.max)}`
                  : systemMetrics?.storage?.usage !== undefined
                    ? `${systemMetrics.storage.usage}% — Unlimited`
                    : "Unlimited"}
              </p>
            </div>
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">Connections</p>
              <p className="mt-1 text-lg font-medium">
                {systemMetrics?.connections || 0}
              </p>
              <p className="text-xs text-dark-muted">
                {systemMetrics?.streams || 0} streams ·{" "}
                {systemMetrics?.consumers || 0} consumers
              </p>
            </div>
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">Rate Window</p>
              <p className="mt-1 text-lg font-medium">
                {formatBytes(rateTotalBytes)} / {rates?.duration || 60}s
              </p>
              <p className="text-xs text-dark-muted">
                {formatNumber(rateTotalMessages)} messages
              </p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-400" />
              <h2 className="text-lg font-semibold">Rate by Stream</h2>
            </div>
          </div>
          {rateStreams.length > 0 ? (
            <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
              {rateStreams.map((stream: any) => (
                <div key={stream.name} className="rounded-xl bg-dark-bg/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-sm truncate">{stream.name}</p>
                    <p className="text-xs text-dark-muted whitespace-nowrap">
                      {formatNumber(stream.messages || 0)} msgs ·{" "}
                      {formatBytes(stream.bytes || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-8 text-center text-dark-muted">
                No rate data available for this window.
              </div>
            </div>
          )}
          <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
            {rateStreams.length} stream{rateStreams.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="mb-6 mt-8">
        <div className="card overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
            <select
              value={selectedStream || "all"}
              onChange={(e) =>
                setSelectedStream(
                  e.target.value === "all" ? null : e.target.value,
                )
              }
              className="input w-full"
            >
              <option value="all">All Streams</option>
              {streamNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-y-auto scrollbar-thin flex-1 p-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {streamNames.map((streamName) => {
                const messageSeries = getSeries(
                  metrics,
                  streamName,
                  "messages",
                );
                const bytesSeries = getSeries(metrics, streamName, "bytes");
                const messages = getLatestValue(messageSeries);
                const bytes = getLatestValue(bytesSeries);
                const messageTrend = getTrend(messageSeries);

                return (
                  <div key={streamName} className="card">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary-400" />
                        {streamName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        {messageTrend !== 0 && (
                          <span
                            className={`flex items-center gap-1 ${
                              messageTrend > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            <TrendingUp className="h-3 w-3" />
                            {Math.abs(messageTrend).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      key={`${streamName}-messages`}
                      className="rounded-xl bg-dark-bg/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm text-dark-muted whitespace-nowrap">
                          Messages
                        </span>
                        <span className="font-medium tabular-nums whitespace-nowrap">
                          {formatNumber(messages)}
                        </span>
                      </div>
                      <Sparkline
                        data={messageSeries?.data || []}
                        color="rgb(59, 130, 246)"
                        width={280}
                        height={48}
                      />
                    </div>

                    <div
                      key={`${streamName}-bytes`}
                      className="rounded-xl bg-dark-bg/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm text-dark-muted whitespace-nowrap">
                          Storage
                        </span>
                        <span className="font-medium tabular-nums whitespace-nowrap">
                          {formatBytes(bytes)}
                        </span>
                      </div>
                      <Sparkline
                        data={bytesSeries?.data || []}
                        color="rgb(16, 185, 129)"
                        width={280}
                        height={48}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
            {streamNames.length} stream{streamNames.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {streamNames.length === 0 && (
        <div className="card mt-6 text-center py-16">
          <BarChart3 className="mx-auto mb-4 h-16 w-16 text-dark-muted opacity-50" />
          <h3 className="mb-2 text-lg font-medium">No Metrics Available</h3>
          <p className="text-dark-muted">
            Metrics will appear here once streams are created and sampled.
          </p>
        </div>
      )}
    </div>
  );
}
