import { UseDashboardReturn } from './hooks/useDashboard'
import { SystemMetrics } from '../../components/MetricsGraph'
import {
  DashboardHeader, StatsGrid, SecondaryStatsGrid,
  ConnectionStatus, ConsumerHealth
} from '../../components/dashboard'
import EmptyState from '../../components/ui/EmptyState'
import { Database, AlertCircle, Loader2 } from 'lucide-react'

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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <DashboardHeader
          sseConnected={sseConnected}
          onRefresh={() => refetch()}
        />
        <div className="flex items-center justify-center min-h-64 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading dashboard data…</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <DashboardHeader
          sseConnected={sseConnected}
          onRefresh={() => refetch()}
        />
        <div className="flex items-center justify-center min-h-64 text-destructive">
          <AlertCircle className="mr-2 h-6 w-6" />
          <span>Failed to load dashboard data. Please try refreshing.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
      <DashboardHeader
        sseConnected={sseConnected}
        onRefresh={() => refetch()}
      />

      <StatsGrid stats={stats} />

      <div className="mb-6 mt-6 animate-slide-up animate-delay-100">
        <h2 className="text-lg font-semibold mb-4">Real-time Metrics</h2>
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
          title="No Data Available"
          description="Connect to a NATS server with JetStream enabled to see data."
        />
      )}
    </div>
  )
}
