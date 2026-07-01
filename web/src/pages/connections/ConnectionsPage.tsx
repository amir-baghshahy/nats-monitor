import { UseConnectionsReturn } from './hooks/useConnections'
import {
  RefreshCw, XCircle, Server, Users, Network, Activity,
  ChevronDown, ChevronRight, Cable
} from 'lucide-react'
import ConnectionFilters from '../../components/connections/ConnectionFilters'
import { HealthService } from '../../types'
import type { ConnectionInfo } from '../../types'
import { useTranslation } from 'react-i18next'
import { StatCard, DataList, PageHeader, PanelCard } from '../../components/ui'
import { Button } from '../../components/ui';

export default function ConnectionsPage({
  searchQuery,
  setSearchQuery,
  filterServer,
  setFilterServer,
  expandedConnections,
  isLoading,
  refetch,
  connections,
  filteredConnections,
  stats,
  servers,
  serverData,
  toggleExpand,
  getConnectionDuration,
  toast,
  confirm,
}: UseConnectionsReturn) {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('connections.title')}
        subtitle={t('connections.subtitle')}
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => refetch()}>
            {t('common.refresh')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={Network}
          value={stats.total}
          label={t('connections.title')}
        />
        <StatCard
          icon={Users}
          value={stats.uniqueUsers}
          label={t('connections.uniqueUsers')}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={Activity}
          value={stats.totalSubs}
          label={t('connections.subscriptions')}
          iconBg="bg-green-500/20"
          iconColor="text-green-400"
        />
        <StatCard
          icon={Server}
          value={Math.floor(stats.avgSubs)}
          label={t('connections.avgSubsPerConn')}
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
        />
      </div>

      <div className="mb-4">
        <PanelCard
          title={t('connections.serverDistribution')}
          footer={
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-sm text-primary-300">
              {t('connections.total', { count: filteredConnections.length })}
            </span>
          }
        >

          {serverData.length > 0 ? (
            <div className="space-y-4">
              {serverData.map((server: any) => {
                const percentage =
                  filteredConnections.length > 0
                    ? Math.round((server.connections / filteredConnections.length) * 100)
                    : 0

                return (
                  <div key={server.server} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate font-medium">{server.server}</span>
                      <span className="text-dark-muted">
                        {server.connections} · {percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-dark-bg">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-6 text-center text-dark-muted">
              <Network className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>{t('connections.noServerData')}</p>
            </div>
          )}
        </PanelCard>
      </div>

      <ConnectionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterServer={filterServer}
        setFilterServer={setFilterServer}
        servers={servers}
      />

      <DataList
        items={filteredConnections}
        isLoading={isLoading}
        isEmpty={filteredConnections.length === 0}
        emptyIcon={Cable}
        emptyTitle={t('connections.noConnectionsFound')}
        emptyDescription={t('connections.searchPlaceholder')}
        getKey={(conn) => String(conn.cid)}
        footer={
          <span>
            {t('connections.showingConnections', { filtered: filteredConnections.length, total: connections.length })}
          </span>
        }
        renderItem={(conn: ConnectionInfo) => {
          const cid = conn.cid ?? 0
          const isExpanded = expandedConnections.has(cid)

          return (
            <div
              key={cid}
              className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors"
            >
              <div className="p-4 hover:bg-dark-bg/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />

                  <button
                    onClick={() => toggleExpand(cid)}
                    className="p-1 hover:bg-dark-bg rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-dark-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-muted" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {conn.user || t('connections.anonymous')}
                      </span>
                      <span className="text-xs text-dark-muted">•</span>
                      <span className="text-sm text-dark-muted">
                        {conn.ip}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-dark-muted">
                      <span className="flex items-center gap-1 min-w-0">
                        <Server className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]" title={conn.server}>{conn.server}</span>
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{conn.subs_count || 0}</p>
                      <p className="text-xs text-dark-muted">{t('connections.subs')}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">
                        {getConnectionDuration(conn.connected_at || '')}
                      </p>
                      <p className="text-xs text-dark-muted">{t('connections.duration')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: t('connections.terminateConnection'),
                          message: t('connections.terminateConfirm', { cid: String(conn.cid) }),
                          confirmLabel: t('connections.terminate'),
                          variant: "danger"
                        })
                        if (ok) {
                          HealthService.deleteConnections(
                            String(conn.cid || ''),
                          )
                            .then(() => refetch())
                            .catch(() =>
                              toast(
                                'error',
                                t('connections.terminateFailed'),
                              ),
                            )
                        }
                      }}
                      className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-status-error"
                      title={t('connections.terminateConnection')}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pl-8 space-y-4">
                    <div className="bg-dark-bg/50 rounded-lg p-4">
                      <p className="text-xs text-dark-muted">
                        {t('connections.connectedSince')}
                      </p>
                      <p className="font-medium text-sm">
                        {conn.connected_at
                          ? new Date(conn.connected_at).toLocaleString()
                          : t('dashboard.na')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
