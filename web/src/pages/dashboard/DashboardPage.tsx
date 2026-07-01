import { UseDashboardReturn } from './hooks/useDashboard'
import { SystemMetrics } from '../../components/MetricsGraph'
import {
  DashboardHeader, StatsGrid, SecondaryStatsGrid,
  ConnectionStatus, ConsumerHealth
} from '../../components/dashboard'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoading, PageError } from '../../components/ui/PageState'
import { Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function DashboardPage({
  sseConnected,
  stats,
  accountInfo,
  connections,
  consumers,
  isLoading,
  isError,
  refetch,
}: UseDashboardReturn) {
  const hasData = consumers && consumers.length > 0
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <DashboardHeader
          sseConnected={sseConnected}
          onRefresh={() => refetch()}
        />
        <PageLoading text={t('dashboard.loadingMessage')} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <DashboardHeader
          sseConnected={sseConnected}
          onRefresh={() => refetch()}
        />
        <PageError message={t('dashboard.errorMessage')} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <DashboardHeader
        sseConnected={sseConnected}
        onRefresh={() => refetch()}
      />

      <StatsGrid stats={stats} />

      <div className="mb-3 mt-3 animate-slide-up animate-delay-100">
        <h2 className="text-xs font-semibold mb-2">{t('dashboard.realTimeMetrics')}</h2>
        <SystemMetrics />
      </div>

      <SecondaryStatsGrid account={accountInfo} />

      <ConnectionStatus
        connected={stats.server_status === 'connected'}
        connections={connections?.connections || []}
      />

      {hasData ? (
        <ConsumerHealth consumers={consumers} />
      ) : (
        <EmptyState
          icon={Database}
          title={t('common.noData')}
          description={t('dashboard.noDataDescription')}
        />
      )}
    </div>
  )
}
