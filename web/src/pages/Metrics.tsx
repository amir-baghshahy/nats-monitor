import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { MetricsService } from "../types";
import type {
  internal_handlers_MetricDataPoint as MetricDataPoint,
  internal_handlers_MetricSeries as MetricSeries,
  internal_handlers_MetricsResponse,
} from "../types";
import { formatBytes, formatNumber } from "../utils/formatters";
import { PageError, PageLoading } from "../components/ui/PageState";

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
  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-dark-muted text-xs"
      >
        No data
      </div>
    );
  }

  const values = data.map((point) => point.value || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to load metrics";
}

function getLatestValue(series?: MetricSeries) {
  return series?.data?.[series.data.length - 1]?.value || 0;
}

function getTrend(series?: MetricSeries) {
  if (!series || !series.data || series.data.length < 2) return 0;
  const latest = series.data[series.data.length - 1].value || 0;
  const previous = series.data[0].value || 0;
  if (previous === 0) return 0;
  return ((latest - previous) / previous) * 100;
}

function getSeries(
  metrics: internal_handlers_MetricsResponse | undefined,
  name: string,
  type: string,
) {
  return metrics?.streams?.find(
    (series) => series.name === name && series.labels?.type === type,
  );
}

export default function Metrics() {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [duration, setDuration] = useState("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: metrics,
    refetch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["metrics", selectedStream, duration],
    queryFn: () => MetricsService.getMetrics(selectedStream || undefined, undefined, duration),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: rates } = useQuery({
    queryKey: ["metricsRates", duration],
    queryFn: () => MetricsService.getMetricsRates(60),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ["metricsSystem"],
    queryFn: () => MetricsService.getMetricsSystem(),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const streamNames = [
    ...new Set<string>(
      metrics?.streams
        ?.filter((series) => series.labels?.type === "messages")
        .map((series) => series.name)
        .filter((name): name is string => Boolean(name)) || [],
    ),
  ];

  const totalMessages = streamNames.reduce<number>(
    (sum, name) => sum + getLatestValue(getSeries(metrics, name, "messages")),
    0,
  );
  const totalStorage = streamNames.reduce<number>(
    (sum, name) => sum + getLatestValue(getSeries(metrics, name, "bytes")),
    0,
  );
  const rateStreams = (rates?.streams as any[] | undefined) || [];
  const rateTotalMessages = rateStreams.reduce<number>(
    (sum, stream) => sum + (stream.messages || 0),
    0,
  );
  const rateTotalBytes = rateStreams.reduce<number>(
    (sum, stream) => sum + (stream.bytes || 0),
    0,
  );

  if (isLoading) {
    return <PageLoading text="Loading metrics..." />;
  }

  if (error) {
    return <PageError message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <div className="p-4 md:p-8">
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
              <p className="text-2xl font-bold">{formatNumber(totalMessages)}</p>
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
              <p className="text-2xl font-bold">{formatNumber(rateTotalMessages)}</p>
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
                {systemMetrics?.memory?.usage || 0}% of{" "}
                {formatBytes(systemMetrics?.memory?.max || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">Storage Used</p>
              <p className="mt-1 text-lg font-medium">
                {formatBytes(systemMetrics?.storage?.used || 0)}
              </p>
              <p className="text-xs text-dark-muted">
                {systemMetrics?.storage?.usage || 0}% of{" "}
                {formatBytes(systemMetrics?.storage?.max || 0)}
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

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Rate by Stream</h2>
          </div>
          {rateStreams.length > 0 ? (
            <div className="space-y-3">
              {rateStreams.map((stream: any) => (
                <div
                  key={stream.name}
                  className="rounded-xl bg-dark-bg/50 p-4"
                >
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
            <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-8 text-center text-dark-muted">
              No rate data available for this window.
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 mt-8">
        <select
          value={selectedStream || "all"}
          onChange={(e) => setSelectedStream(e.target.value === "all" ? null : e.target.value)}
          className="input"
        >
          <option value="all">All Streams</option>
          {streamNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {streamNames.map((streamName) => {
          const messageSeries = getSeries(metrics, streamName, "messages");
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
                        messageTrend > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {Math.abs(messageTrend).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-dark-muted">Messages</span>
                    <span className="font-medium">{formatNumber(messages)}</span>
                  </div>
                  <Sparkline
                    data={messageSeries?.data || []}
                    color="rgb(59, 130, 246)"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-dark-muted">Storage</span>
                    <span className="font-medium">{formatBytes(bytes)}</span>
                  </div>
                  <Sparkline
                    data={bytesSeries?.data || []}
                    color="rgb(16, 185, 129)"
                  />
                </div>
              </div>
            </div>
          );
        })}
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
