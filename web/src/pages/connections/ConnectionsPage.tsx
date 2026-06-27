import { UseConnectionsReturn } from './hooks/useConnections'
import {
  RefreshCw, XCircle, Server, Users, Network, Activity,
  ChevronDown, ChevronRight
} from 'lucide-react'
import ConnectionFilters from '../../components/connections/ConnectionFilters'
import { HealthService } from '../../types'
import type { ConnectionInfo } from '../../types'

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
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Connections</h1>
          <p className="text-dark-muted mt-1">
            Active NATS connections and clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-dark-muted">Connections</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              <p className="text-xs text-dark-muted">Unique Users</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSubs}</p>
              <p className="text-xs text-dark-muted">Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.floor(stats.avgSubs)}</p>
              <p className="text-xs text-dark-muted">Avg Subs/Conn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Server Distribution</h3>
              <p className="text-sm text-dark-muted">
                Connection spread across NATS servers
              </p>
            </div>
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-sm text-primary-300">
              {filteredConnections.length} total
            </span>
          </div>

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
            <div className="rounded-xl border border-dashed border-dark-border bg-dark-bg/30 p-8 text-center text-dark-muted">
              <Network className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>No server distribution data available.</p>
            </div>
          )}
        </div>
      </div>

      <ConnectionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterServer={filterServer}
        setFilterServer={setFilterServer}
        servers={servers}
      />

      <div className="card overflow-hidden flex flex-col max-h-[600px]">
        {isLoading ? (
          <div className="p-8 text-center text-dark-muted">
            Loading connections...
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="p-8 text-center text-dark-muted">
            No connections found matching your filters
          </div>
        ) : (
          <div className="overflow-y-auto scrollbar-thin flex-1 divide-y divide-dark-border">
            {filteredConnections.map((conn: ConnectionInfo) => {
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
                            {conn.user || 'Anonymous'}
                          </span>
                          <span className="text-xs text-dark-muted">•</span>
                          <span className="text-sm text-dark-muted">
                            {conn.ip}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-dark-muted">
                          <span className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            {conn.server}
                          </span>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{conn.subs_count || 0}</p>
                          <p className="text-xs text-dark-muted">Subs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">
                            {getConnectionDuration(conn.connected_at || '')}
                          </p>
                          <p className="text-xs text-dark-muted">Duration</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const ok = await confirm({ title: "Terminate Connection", message: `Terminate connection "${conn.cid}"? This action cannot be undone.`, confirmLabel: "Terminate", variant: "danger" })
                            if (ok) {
                              HealthService.deleteConnections(
                                String(conn.cid || ''),
                              )
                                .then(() => refetch())
                                .catch(() =>
                                  toast(
                                    'error',
                                    'Failed to terminate connection',
                                  ),
                                )
                            }
                          }}
                          className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-status-error"
                          title="Terminate connection"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pl-8 space-y-4">
                        <div className="bg-dark-bg/50 rounded-lg p-4">
                          <p className="text-xs text-dark-muted">
                            Connected Since
                          </p>
                          <p className="font-medium text-sm">
                            {conn.connected_at
                              ? new Date(conn.connected_at).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted">
          Showing {filteredConnections.length} of {connections.length} connections
        </div>
      </div>

      <div className="mt-4 text-sm text-dark-muted">
        Showing {filteredConnections.length} of {connections.length} connections
      </div>
    </div>
  )
}
