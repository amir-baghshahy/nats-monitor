import { UseHistoryReturn } from "./hooks/useHistory";
import { useTranslation } from "react-i18next";
import { BarChart3, History as HistoryIcon, RefreshCw } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import Select from "../../components/ui/Select";

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
    <div className="p-3 md:p-4 lg:p-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">{t('history.title')}</h1>
          <p className="mt-1 text-dark-muted">
            {t('history.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

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
        <div key="stream-summary" className="card overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary-400" />
              <h2 className="text-lg font-semibold">{t('history.streamSummary')}</h2>
            </div>
          </div>
          {historyStreams.length > 0 ? (
            <>
              <div key="streams-list" className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
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
              <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
                {t('history.streamCount', { count: historyStreams.length })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={BarChart3}
                title={t('history.noHistoryData')}
                description={t('history.noHistoryDataDescription')}
              />
            </div>
          )}
        </div>

        <div key="messages-trend" className="card overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-400" />
              <h2 className="text-lg font-semibold">{t('history.messagesTrend')}</h2>
            </div>
          </div>
          {streamHistoryPoints.length > 0 ? (
            <>
              <div key="trend-list" className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
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
              <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
                {t('history.pointCount', { count: streamHistoryPoints.length })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={BarChart3}
                title={t('history.noStreamTrend')}
                description={t('history.noStreamTrendDescription')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
