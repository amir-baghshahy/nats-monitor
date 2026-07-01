import { UseMetricsReturn } from "./hooks/useMetrics";
import { useTranslation } from "react-i18next";
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

import { formatBytes, formatNumber } from "../../utils/formatters";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { PageError, PageLoading } from "../../components/ui/PageState";
import Select from "../../components/ui/Select";
import { PageHeader, StatCard, PanelCard, EmptyState } from "../../components/ui";
import { Button } from "../../components/ui";

const durations = [
  { label: "last15Minutes", value: "15m" },
  { label: "last1Hour", value: "1h" },
  { label: "last6Hours", value: "6h" },
  { label: "last24Hours", value: "24h" },
];

function MiniChart({ data, color }: { data: { value?: number }[]; color: string }) {
  const { t } = useTranslation();
  const chartData = data.map((p, i) => ({ i, v: p.value || 0 }));
  if (chartData.length < 2) {
    return (
      <div className="flex h-10 items-center justify-center text-[10px] text-dark-muted/60">
        {t("common.collectingData")}
      </div>
    );
  }
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`mg-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#mg-${color.replace(/[^a-z0-9]/gi, '')})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
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
  getSeries,
  streamNames,
  totalMessages,
  totalStorage,
  rateStreams,
  rateTotalMessages,
  rateTotalBytes,
}: UseMetricsReturn) {
  const { t } = useTranslation();
  if (isLoading) {
    return <PageLoading text={t("metrics.loading")} />;
  }

  if (error) {
    return <PageError message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t("metrics.title")}
        subtitle={t("metrics.subtitle")}
        actions={
          <>
            <Select
              value={duration}
              onChange={setDuration}
              options={durations.map((item) => ({
                value: item.value,
                label: t(`metrics.${item.label}`),
              }))}
              className="shrink-0"
              aria-label={t("metrics.duration")}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              aria-pressed={autoRefresh}
              className={autoRefresh ? "border-primary-500/40 bg-primary-500/15 text-primary-300" : ""}
              icon={autoRefresh ? <Activity className="h-3 w-3 text-green-400" /> : <Clock className="h-3 w-3" />}
            >
              {t("metrics.autoRefresh")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              icon={<RefreshCw className="h-3 w-3" />}
            />
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          value={formatNumber(totalMessages)}
          label={t("metrics.totalMessages")}
          formatValue={false}
        />
        <StatCard
          icon={HardDrive}
          value={formatBytes(totalStorage)}
          label={t("metrics.totalStorage")}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
          formatValue={false}
        />
        <StatCard
          icon={BarChart3}
          value={streamNames.length}
          label={t("metrics.activeStreams")}
          iconBg="bg-purple-500/20"
          iconColor="text-purple-400"
        />
        <StatCard
          icon={Zap}
          value={formatNumber(rateTotalMessages)}
          label={t("metrics.messagesInRateWindow")}
          iconBg="bg-green-500/20"
          iconColor="text-green-400"
          formatValue={false}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr] mt-4">
        <PanelCard title={t("metrics.systemMetrics")}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">
                {t("metrics.memoryUsed")}
              </p>
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
              <p className="text-xs text-dark-muted">
                {t("metrics.storageUsed")}
              </p>
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
              <p className="text-xs text-dark-muted">
                {t("metrics.connections")}
              </p>
              <p className="mt-1 text-lg font-medium">
                {systemMetrics?.connections || 0}
              </p>
              <p className="text-xs text-dark-muted">
                {systemMetrics?.streams || 0} streams ·{" "}
                {systemMetrics?.consumers || 0} consumers
              </p>
            </div>
            <div className="rounded-xl bg-dark-bg/50 p-4">
              <p className="text-xs text-dark-muted">
                {t("metrics.rateWindow")}
              </p>
              <p className="mt-1 text-lg font-medium">
                {formatBytes(rateTotalBytes)} / {rates?.duration || 60}s
              </p>
              <p className="text-xs text-dark-muted">
                {formatNumber(rateTotalMessages)} messages
              </p>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title={t("metrics.rateByStream")}
          icon={<TrendingUp className="h-5 w-5 text-primary-400" />}
          maxHeight={400}
          empty={rateStreams.length === 0}
          emptyState={
            <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-6 text-center text-dark-muted">
              {t("metrics.noRateData")}
            </div>
          }
          footer={
            <span>
              {rateStreams.length}{" "}
              {t("metrics.streamCount", { count: rateStreams.length })}
            </span>
          }
        >
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
        </PanelCard>
      </div>

      <div className="mb-4 mt-4">
        <PanelCard
          maxHeight={800}
          header={
            <Select
              value={selectedStream || "all"}
              onChange={(value) =>
                setSelectedStream(value === "all" ? null : value)
              }
              options={[
                { value: "all", label: t("metrics.allStreams") },
                ...streamNames.map((name) => ({ value: name, label: name })),
              ]}
              aria-label={t("metrics.selectStream")}
            />
          }
          footer={
            <span>
              {streamNames.length}{" "}
              {t("metrics.streamCount", { count: streamNames.length })}
            </span>
          }
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {streamNames.map((streamName) => {
              const messageSeries = getSeries(metrics, streamName, "messages");
              const bytesSeries = getSeries(metrics, streamName, "bytes");
              const messages = getLatestValue(messageSeries);
              const bytes = getLatestValue(bytesSeries);
              return (
                <PanelCard
                  key={streamName}
                  title={streamName}
                  icon={<MessageSquare className="h-4 w-4 text-primary-400" />}
                >
                  <div
                    key={`${streamName}-messages`}
                    className="rounded-xl bg-dark-bg/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm text-dark-muted whitespace-nowrap">
                        {t("metrics.messages")}
                      </span>
                      <span className="font-medium tabular-nums whitespace-nowrap">
                        {formatNumber(messages)}
                      </span>
                    </div>
                    <MiniChart
                      data={messageSeries?.data || []}
                      color="rgb(59, 130, 246)"
                    />
                  </div>

                  <div
                    key={`${streamName}-bytes`}
                    className="rounded-xl bg-dark-bg/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm text-dark-muted whitespace-nowrap">
                        {t("metrics.storage")}
                      </span>
                      <span className="font-medium tabular-nums whitespace-nowrap">
                        {formatBytes(bytes)}
                      </span>
                    </div>
                    <MiniChart
                      data={bytesSeries?.data || []}
                      color="rgb(16, 185, 129)"
                    />
                  </div>
                </PanelCard>
              );
            })}
          </div>
        </PanelCard>
      </div>

      {streamNames.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title={t("metrics.noMetricsAvailable")}
          description={t("metrics.noMetricsAvailableDescription")}
        />
      )}
    </div>
  );
}
