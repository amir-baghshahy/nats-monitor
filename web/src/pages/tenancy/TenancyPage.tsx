import type { ConnectionConfig, ConnectionStatus } from '../../types'
import { UseTenancyReturn } from './hooks/useTenancy'
import { useTranslation } from "react-i18next";
import {
  Server, Plus, Edit, Trash2, CheckCircle, XCircle, X,
  RefreshCw, Play, Globe, Star
} from 'lucide-react'
import { PageError, PageLoading } from '../../components/ui/PageState'
import { PageHeader, StatCard, PanelCard } from '../../components/ui'
import { ModalWrapper } from "../../components/ui/Modal";
import { Button } from "../../components/ui";

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
  const { t } = useTranslation();
  if (connectionsLoading || statusesLoading) {
    return <PageLoading text={t('tenancy.loading')} />
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
      connections?.connections?.find((c: ConnectionConfig) => c.is_default)?.name || t('common.none'),
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('tenancy.title')}
        subtitle={t('tenancy.subtitle')}
        icon={Globe}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingConnection(null)
            setShowModal(true)
          }}
        >
          {t('tenancy.addConnection')}
        </Button>
      }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <StatCard
          icon={Server}
          value={stats.total}
          label={t('tenancy.totalServers')}
        />
        <StatCard
          icon={CheckCircle}
          value={stats.active}
          label={t('tenancy.connected')}
          iconBg="bg-green-500/20"
          iconColor="text-green-400"
        />
        <StatCard
          icon={Play}
          value={stats.healthy}
          label={t('tenancy.healthy')}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={Star}
          value={stats.default}
          label={t('tenancy.default')}
          iconBg="bg-yellow-500/20"
          iconColor="text-yellow-400"
        />
      </div>

      <PanelCard
        header={<h3 className="text-lg font-semibold flex items-center gap-2"><Server className="w-5 h-5" /> {t('tenancy.serverConnections')}</h3>}
      >
        <div className="space-y-4">
          {connections?.connections?.map((conn: ConnectionConfig) => {
            const connectionId = conn.id ?? conn.name ?? conn.url ?? ''
            const connectionName = conn.name ?? t('tenancy.unnamedConnection')
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
                          {t('tenancy.default')}
                        </span>
                      )}
                      {conn.enabled ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          {t('tenancy.enabled')}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                          {t('tenancy.disabled')}
                        </span>
                      )}
                      {status?.connected ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {t('tenancy.connected')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3 h-3" />
                          {status?.error || t('tenancy.disconnected')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-muted mb-2">
                      {conn.description || t('tenancy.noDescription')}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-muted">
                      <span className="font-mono">{connectionUrl}</span>
                      {status?.latency && (
                        <span>{t('tenancy.latency', { value: status.latency })}</span>
                      )}
                      <span>
                        {t('tenancy.lastChecked', { time: status ? formatDate(status.last_checked) : 'N/A' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!conn.is_default && (
                      <button
                        type="button"
                        onClick={() => setDefaultMutation.mutate(connectionId)}
                        className="p-1.5 hover:bg-yellow-500/20 text-yellow-400 rounded-lg"
                        title={t('tenancy.setDefault')}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTest(connectionUrl)}
                      disabled={testConnectionMutation.isPending}
                      className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg"
                      title={t('tenancy.testConnection')}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testConnectionMutation.isPending && testingUrl === connectionUrl ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingConnection(conn); setShowModal(true); }}
                      className="p-1.5 hover:bg-dark-border rounded-lg"
                      title={t('common.edit')}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {!conn.is_default && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({ title: t('tenancy.deleteConnection'), message: t('tenancy.deleteConnectionConfirm', { name: connectionName }), confirmLabel: t('common.delete'), variant: "danger" })
                          if (ok) deleteMutation.mutate(connectionId)
                        }}
                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                          {t('tenancy.connectionSuccessful', { latency: testResult.latency })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>{t('tenancy.connectionFailed', { error: testResult.error })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </PanelCard>

      {showModal && (
        <ModalWrapper isOpen={true} onClose={() => { setShowModal(false); setEditingConnection(null); setTestResult(null); }}>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setEditingConnection(null); setTestResult(null); } }}
          >
            <div className="card max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="conn-modal-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="conn-modal-title" className="text-sm font-bold">
                {editingConnection ? t('tenancy.editConnection') : t('tenancy.addConnection')}
              </h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingConnection(null); setTestResult(null); }}
                className="p-1.5 hover:bg-dark-bg rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('tenancy.name')}</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingConnection?.name}
                  placeholder={t('tenancy.namePlaceholder')}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('tenancy.url')}</label>
                <input
                  type="text"
                  name="url"
                  defaultValue={editingConnection?.url}
                  placeholder={t('tenancy.urlPlaceholder')}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('tenancy.description')}
                </label>
                <textarea
                  name="description"
                  defaultValue={editingConnection?.description}
                  placeholder={t('tenancy.descriptionPlaceholder')}
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
                  {t('tenancy.enabled')}
                </label>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingConnection(null)
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" type="submit">
                  {editingConnection ? t('tenancy.update') : t('tenancy.create')} Connection
                </Button>
              </div>
            </form>
          </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  )
}
