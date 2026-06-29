import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import type { ConsumerStats } from "../hooks/useConsumersPage";
import { useTranslation } from "react-i18next";
import Button from "../../../components/ui/Button";

interface ConsumersHeaderProps {
  sseConnected: boolean;
  selectedCount: number;
  pauseResumePending: boolean;
  deletePending: boolean;
  onBulkResume: () => Promise<void>;
  onBulkPause: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onRefetch: () => void;
  onNavigateStreams: () => void;
}

export default function ConsumersHeader({
  sseConnected,
  selectedCount,
  pauseResumePending,
  deletePending,
  onBulkResume,
  onBulkPause,
  onBulkDelete,
  onRefetch,
  onNavigateStreams,
}: ConsumersHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t('consumers.title')}</h1>
        <p className="text-dark-muted mt-1">{t('consumers.subtitle')}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-lg border border-dark-border text-xs">
          {sseConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 status-success" />
              <span className="text-status-success">{t('common.live')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 status-warning" />
              <span className="text-status-warning">{t('common.connecting')}</span>
            </>
          )}
        </div>

        {selectedCount > 0 && (
          <>
            <Button
              onClick={onBulkResume}
              disabled={pauseResumePending}
              variant="secondary"
              icon={<Play className="w-4 h-4" />}
            >
              {t('consumers.resume', { count: selectedCount })}
            </Button>
            <Button
              onClick={onBulkPause}
              disabled={pauseResumePending}
              variant="secondary"
              icon={<Pause className="w-4 h-4" />}
            >
              {t('consumers.pause', { count: selectedCount })}
            </Button>
            <Button
              onClick={onBulkDelete}
              disabled={deletePending}
              variant="secondary"
              icon={<Trash2 className="w-4 h-4" />}
              className="text-status-error"
            >
              {t('consumers.deleteSelected', { count: selectedCount })}
            </Button>
          </>
        )}
        <Button
          onClick={onRefetch}
          variant="secondary"
          icon={<RefreshCw className="w-4 h-4" />}
        />
        <Button
          onClick={onNavigateStreams}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          {t('consumers.createConsumer')}
        </Button>
      </div>
    </div>
  );
}

interface ConsumersStatsProps {
  stats: ConsumerStats;
}

export function ConsumersStats({ stats }: ConsumersStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-dark-muted">{t('consumers.total')}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-dark-muted">{t('consumers.active')}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.stuck}</p>
            <p className="text-xs text-dark-muted">{t('consumers.stuck')}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.idle}</p>
            <p className="text-xs text-dark-muted">{t('consumers.idle')}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {stats.totalLag >= 1000
                ? `${(stats.totalLag / 1000).toFixed(1)}K`
                : stats.totalLag.toLocaleString()}
            </p>
            <p className="text-xs text-dark-muted">{t('consumers.totalLag')}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.floor(stats.avgAckRate)}</p>
            <p className="text-xs text-dark-muted">{t('consumers.avgAckRate')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
