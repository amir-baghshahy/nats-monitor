import { UseHistoryReturn } from "./hooks/useHistory";
import { useTranslation } from "react-i18next";
import { BarChart3, History as HistoryIcon, RefreshCw } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import Select from "../../components/ui/Select";
import { PageHeader, PanelCard } from "../../components/ui";
import { Button } from "../../components/ui";

const durations = ["1h", "6h", "24h", "7d"];

export default function HistoryPage({
  duration,
  setDuration,
  selectedStream,
  setSelectedStream,
  refetch,
  streamOptions,
  historyStreams,
  streamHistoryPoints,
}: UseHistoryReturn) {
  const { t } = useTranslation();
  return (
    <div className="p-2">
      <PageHeader
        title={t('history.title')}
        subtitle={t('history.subtitle')}
        icon={HistoryIcon}
        actions={
          <>
            <Select
              value={duration}
              onChange={setDuration}
              options={durations.map((item) => ({
                value: item,
                label: t('history.lastDuration', { duration: item })
              }))}
              className="w-full sm:w-auto"
              aria-label={t('history.duration')}
            />
            <Button variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" />}>
              {t('common.refresh')}
            </Button>
          </>
        }
      />

      <div className="mb-4 card">
        <label className="mb-2 block text-sm text-dark-muted">{t('history.stream')}</label>
        <Select
          value={selectedStream}
          onChange={setSelectedStream}
          options={[
            { value: "all", label: t('history.allStreams') },
            ...streamOptions.map((name: any) => ({ value: name, label: name }))
          ]}
          aria-label={t('history.stream')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard
          title={t('history.streamSummary')}
          icon={<HistoryIcon className="h-5 w-5 text-primary-400" />}
          maxHeight={500}
          empty={historyStreams.length === 0}
          emptyState={
            <EmptyState
              icon={BarChart3}
              title={t('history.noHistoryData')}
              description={t('history.noHistoryDataDescription')}
            />
          }
          footer={<span>{t('history.streamCount', { count: historyStreams.length })}</span>}
        >
          <div className="space-y-3">
            {historyStreams.map((stream: any, index: number) => (
              <div
                key={stream.name || stream.config?.name || `stream-${index}`}
                className="rounded-xl bg-dark-bg/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium">{stream.name}</p>
                  <p className="text-sm text-dark-muted">
                    {t('history.messages', { count: stream.messages?.toLocaleString?.() || 0 })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-dark-muted">{t('common.bytes')}</p>
                    <p className="font-mono">
                      {(stream.bytes || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-muted">{t('history.trend')}</p>
                    <p className="font-mono">{stream.trend || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard
          title={t('history.messagesTrend')}
          icon={<BarChart3 className="h-5 w-5 text-primary-400" />}
          maxHeight={500}
          empty={streamHistoryPoints.length === 0}
          emptyState={
            <EmptyState
              icon={BarChart3}
              title={t('history.noStreamTrend')}
              description={t('history.noStreamTrendDescription')}
            />
          }
          footer={<span>{t('history.pointCount', { count: streamHistoryPoints.length })}</span>}
        >
          <div className="space-y-3">
            {streamHistoryPoints.map((point: any, index: number) => (
              <div
                key={point?.timestamp ? `${point.timestamp}-${index}` : `point-${index}`}
                className="rounded-xl bg-dark-bg/50 p-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-muted">
                    {point.timestamp
                      ? new Date(point.timestamp * 1000).toLocaleString()
                      : "N/A"}
                  </span>
                  <span className="font-mono">
                    {(point.value || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
