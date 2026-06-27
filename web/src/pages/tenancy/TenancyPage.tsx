import type { ConnectionConfig, ConnectionStatus } from '../../types'
import { UseTenancyReturn } from './hooks/useTenancy'
import {
  Server, Plus, Edit, Trash2, CheckCircle, XCircle,
  RefreshCw, Play, Globe, Star
} from 'lucide-react'
import { PageError, PageLoading } from '../../components/ui/PageState'

export default function TenancyPage({
  showModal,
  setShowModal,
  editingConnection,
  setEditingConnection,
  testingUrl,
  testResult,
  setTestResult,
  connectionsLoading,
  statusesLoading,
  connectionsError,
  statusesError,
  connections,
  statuses,
  deleteMutation,
  setDefaultMutation,
  testConnectionMutation,
  getErrorMessage,
  refetchConnections,
  getStatusForConnection,
  handleTest,
  handleSubmit,
  formatDate,
  confirm,
}: UseTenancyReturn) {
  if (connectionsLoading || statusesLoading) {
    return <PageLoading text="Loading connections..." />
  }

  if (connectionsError || statusesError) {
    return (
      <PageError
        message={getErrorMessage(connectionsError || statusesError)}
        onRetry={refetchConnections}
      />
    )
  }

  const stats = {
    total: connections?.connections?.length || 0,
    active: Array.isArray(statuses)
      ? statuses.filter((s: ConnectionStatus) => s.connected)?.length || 0
      : 0,
    healthy: Array.isArray(statuses)
      ? statuses.filter((s: ConnectionStatus) => s.healthy)?.length || 0
      : 0,
    default:
      connections?.connections?.find((c: ConnectionConfig) => c.is_default)?.name || 'None',
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary-400" />
            Multi-Tenancy
          </h1>
          <p className="text-dark-muted mt-1">
            Manage multiple NATS server connections
          </p>
        </div>
        <button
          onClick={() => {
            setEditingConnection(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-dark-muted">Total Servers</p>
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
              <p className="text-xs text-dark-muted">Connected</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.healthy}</p>
              <p className="text-xs text-dark-muted">Healthy</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium truncate">{stats.default}</p>
              <p className="text-xs text-dark-muted">Default</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          Server Connections
        </h3>
        <div className="space-y-4">
          {connections?.connections?.map((conn: ConnectionConfig) => {
            const connectionId = conn.id ?? conn.name ?? conn.url ?? ''
            const connectionName = conn.name ?? 'Unnamed connection'
            const connectionUrl = conn.url ?? ''
            const status = getStatusForConnection(connectionId)

            return (
              <div
                key={connectionId}
                className={`p-4 rounded-lg border transition-colors ${
                  conn.is_default
                    ? 'border-primary-500/50 bg-primary-500/5'
                    : 'border-dark-border bg-dark-bg/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{connectionName}</h4>
                      {conn.is_default && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                          Default
                        </span>
                      )}
                      {conn.enabled ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                          Disabled
                        </span>
                      )}
                      {status?.connected ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3 h-3" />
                          {status?.error || 'Disconnected'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-muted mb-2">
                      {conn.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-muted">
                      <span className="font-mono">{connectionUrl}</span>
                      {status?.latency && (
                        <span>Latency: {status.latency}</span>
                      )}
                      <span>
                        Last checked: {status ? formatDate(status.last_checked) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!conn.is_default && (
                      <button
                        onClick={() => setDefaultMutation.mutate(connectionId)}
                        className="p-2 hover:bg-yellow-500/20 text-yellow-400 rounded-lg"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleTest(connectionUrl)}
                      disabled={testConnectionMutation.isPending}
                      className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg"
                      title="Test connection"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${testConnectionMutation.isPending && testingUrl === connectionUrl ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setEditingConnection(conn)
                        setShowModal(true)
                      }}
                      className="p-2 hover:bg-dark-border rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!conn.is_default && (
                      <button
                        onClick={async () => {
                          const ok = await confirm({ title: "Delete Connection", message: `Delete connection "${connectionName}"?`, confirmLabel: "Delete", variant: "danger" })
                          if (ok) deleteMutation.mutate(connectionId)
                        }}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {testResult && testingUrl === connectionUrl && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-sm ${
                      testResult.healthy
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {testResult.healthy ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          Connection successful - Latency: {testResult.latency}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>Connection failed: {testResult.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingConnection ? 'Edit Connection' : 'Add Connection'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingConnection(null)
                  setTestResult(null)
                }}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingConnection?.name}
                  placeholder="Production NATS"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="text"
                  name="url"
                  defaultValue={editingConnection?.url}
                  placeholder="nats://localhost:4222"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingConnection?.description}
                  placeholder="Main production NATS server"
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  defaultChecked={editingConnection?.enabled ?? true}
                />
                <label htmlFor="enabled" className="text-sm">
                  Enabled
                </label>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingConnection(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingConnection ? 'Update' : 'Create'} Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
