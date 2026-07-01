import { UseSecurityReturn } from './hooks/useSecurity'
import { useTranslation } from "react-i18next";
import {
  Shield, Users, Plus, Edit, Trash2, X,
  Clock, FileText, Server, Activity, ToggleLeft, ToggleRight
} from 'lucide-react'
import { PageError, PageLoading } from '../../components/ui/PageState'
import { PageHeader, PanelCard, ModalWrapper, Tabs } from '../../components/ui'
import { Button } from '../../components/ui';

export default function SecurityPage({
  activeTab,
  setActiveTab,
  showUserModal,
  setShowUserModal,
  selectedUser,
  setSelectedUser,
  securityInfo,
  users,
  auditLogs,
  connectionStatus,
  infoLoading,
  usersLoading,
  auditLoading,
  connectionsLoading,
  infoError,
  usersError,
  auditError,
  connectionsError,
  getErrorMessage,
  refetchInfo,
  createUserMutation,
  updateUserMutation,
  deleteUserMutation,
  formatBytes,
  formatTimestamp,
  confirm,
}: UseSecurityReturn) {
  const { t } = useTranslation();
  const activeLoading =
    infoLoading ||
    (activeTab === 'users' && usersLoading) ||
    (activeTab === 'audit' && auditLoading) ||
    connectionsLoading

  const activeError =
    infoError ||
    (activeTab === 'users' && usersError) ||
    (activeTab === 'audit' && auditError) ||
    connectionsError

  if (activeLoading) {
    return <PageLoading text={t('security.loading')} />
  }

  if (activeError) {
    return <PageError message={getErrorMessage(activeError)} onRetry={refetchInfo} />
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('security.title')}
        subtitle={t('security.subtitle')}
        icon={Shield}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowUserModal(true)}
          >
            {t('security.newUser')}
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'overview', label: t('security.overview'), icon: Shield },
          { id: 'users', label: t('security.users'), icon: Users },
          { id: 'audit', label: t('security.auditLog'), icon: FileText },
          { id: 'connections', label: t('security.connections'), icon: Server },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <PanelCard title={t('security.accountInformation')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.accountName')}</p>
                <p className="font-medium">{securityInfo?.account?.name || 'N/A'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.imports')}</p>
                <p className="font-medium">{securityInfo?.account?.imports || 0}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.exports')}</p>
                <p className="font-medium">{securityInfo?.account?.exports || 0}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.lastUpdated')}</p>
                <p className="font-medium text-sm">
                  {securityInfo?.timestamp ? formatTimestamp(securityInfo.timestamp) : 'N/A'}
                </p>
              </div>
            </div>
          </PanelCard>

          <PanelCard title={t('security.resourceLimits')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.maxConnections')}</p>
                <p className="font-medium">{securityInfo?.limits?.connections || 'Unlimited'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.maxSubscriptions')}</p>
                <p className="font-medium">{securityInfo?.limits?.subscriptions || 'Unlimited'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.maxData')}</p>
                <p className="font-medium">{securityInfo?.limits?.data ? formatBytes(securityInfo.limits.data) : 'Unlimited'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">{t('security.maxPayload')}</p>
                <p className="font-medium">{securityInfo?.limits?.payload ? formatBytes(securityInfo.limits.payload) : 'Unlimited'}</p>
              </div>
            </div>
          </PanelCard>

          <PanelCard title={t('security.serverSecuritySettings')}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <span>{t('security.authenticationRequired')}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  securityInfo?.server_security?.auth_required
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {securityInfo?.server_security?.auth_required ? t('security.enabled') : t('security.disabled')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <span>{t('security.tlsRequired')}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  securityInfo?.server_security?.tls_required
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {securityInfo?.server_security?.tls_required ? t('security.enabled') : t('security.disabled')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <span>{t('security.tlsVerify')}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  securityInfo?.server_security?.tls_verify
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {securityInfo?.server_security?.tls_verify ? t('security.enabled') : t('security.disabled')}
                </span>
              </div>
            </div>
          </PanelCard>
        </div>
      )}

      {activeTab === 'users' && (
        <PanelCard
          title={t('security.usersCount', { count: users?.length || 0 })}
          maxHeight={600}
          footer={<span>{t('security.userCount', { count: users?.length || 0 })}</span>}
        >
          <div className="space-y-4">
            {users?.map((user) => (
              <div key={user.name} className="p-4 bg-dark-bg/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{user.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                         {user.enabled ? t('security.active') : t('security.disabled')}
                      </span>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">{t('security.account', { name: user.account })}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-dark-muted">{t('security.publishPermissions')}</p>
                        <div className="mt-1 space-y-1">
                          {Object.entries(user.permissions.publish as Record<string, string>).map(([subject, perm]: [string, string]) => (
                            <div key={subject} className="font-mono bg-dark-bg px-2 py-1 rounded">
                              {subject}: {perm}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-dark-muted">{t('security.subscribePermissions')}</p>
                        <div className="mt-1 space-y-1">
                          {Object.entries(user.permissions.subscribe as Record<string, string>).map(([subject, perm]: [string, string]) => (
                            <div key={subject} className="font-mono bg-dark-bg px-2 py-1 rounded">
                              {subject}: {perm}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({ title: user.enabled ? t('security.disableUser') : t('security.enableUser'), message: t('security.toggleUserConfirm', { name: user.name }), confirmLabel: user.enabled ? t('security.disable') : t('security.enable'), variant: "warning" })
                          if (ok) updateUserMutation.mutate({ name: user.name, data: { enabled: !user.enabled } })
                        }}
                        className="p-1.5 hover:bg-dark-border rounded-lg"
                      >
                        {user.enabled ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-dark-muted" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                        className="p-1.5 hover:bg-dark-border rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({ title: t('security.deleteUser'), message: t('security.deleteUserConfirm', { name: user.name }), confirmLabel: t('security.delete'), variant: "danger" })
                          if (ok) deleteUserMutation.mutate(user.name)
                        }}
                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </div>
              </div>
            ))}
            </div>
        </PanelCard>
      )}

      {activeTab === 'audit' && (
        <PanelCard
          title={t('security.auditLogTitle')}
          maxHeight={600}
          footer={<span>{t('security.entriesCount', { count: auditLogs?.length || 0 })}</span>}
        >
          <div className="space-y-3">
            {auditLogs?.map((log: any, index: number) => (
              <div key={index} className="p-4 bg-dark-bg/50 rounded-lg">
                <div className="flex items-start gap-4">
                  <Clock className="w-4 h-4 text-dark-muted mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm">{log.action}</span>
                      <span className="text-sm text-dark-muted">{t('security.byUser', { name: log.user })}</span>
                    </div>
                    <p className="text-sm text-dark-muted">{t('security.resource', { name: log.resource })}</p>
                    <p className="text-sm mt-1">{log.details}</p>
                    <p className="text-xs text-dark-muted mt-1">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
        </PanelCard>
      )}

      {activeTab === 'connections' && (
        <PanelCard title={t('security.connectionSecurityStatus')}>
          <div className="space-y-4">
            <div className="p-4 bg-dark-bg/50 rounded-lg">
              <p className="text-sm text-dark-muted">Server</p>
              <p className="font-medium">{connectionStatus?.server?.name || 'N/A'}</p>
              <p className="text-xs text-dark-muted">
                {connectionStatus?.server?.host}:{connectionStatus?.server?.port}
              </p>
            </div>
            <div className="p-4 bg-dark-bg/50 rounded-lg">
              <p className="text-sm text-dark-muted">Version</p>
              <p className="font-medium">{connectionStatus?.server?.version || 'N/A'}</p>
            </div>
            <div className="p-4 bg-dark-bg/50 rounded-lg">
              <p className="text-sm text-dark-muted">Status</p>
              <p className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                {connectionStatus?.status || t('cluster.disconnected')}
              </p>
            </div>
          </div>
        </PanelCard>
      )}

      {showUserModal && (
        <ModalWrapper isOpen={true} onClose={() => { setShowUserModal(false); setSelectedUser(null); }}>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowUserModal(false); setSelectedUser(null); } }}
          >
            <div className="card max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="user-modal-title" className="text-sm font-bold">{selectedUser ? t('security.editUser') : t('security.createUser')}</h2>
              <button
                type="button"
                onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
                className="p-1.5 hover:bg-dark-bg rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)

                const parsePermissions = (permStr: string) => {
                  try {
                    const perms = JSON.parse(permStr)
                    return perms
                  } catch {
                    const subjects = permStr.split(',').map(s => s.trim()).filter(Boolean)
                    const result: Record<string, string> = {}
                    subjects.forEach(s => result[s] = 'allow')
                    return result
                  }
                }

                const data = {
                  name: formData.get('name') as string,
                  account: 'default',
                  permissions: {
                    publish: parsePermissions(formData.get('publish_permissions') as string || '>'),
                    subscribe: parsePermissions(formData.get('subscribe_permissions') as string || '>')
                  },
                  enabled: formData.get('enabled') === 'on'
                }
                if (selectedUser) {
                  updateUserMutation.mutate({ name: selectedUser.name, data })
                } else {
                  createUserMutation.mutate(data)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">{t('security.username')}</label>
                <input
                  type="text"
                  name="name"
                  placeholder={t('security.usernamePlaceholder')}
                  className="input w-full"
                  defaultValue={selectedUser?.name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('security.publishPermissions')}</label>
                <input
                  type="text"
                  name="publish_permissions"
                  placeholder={t('security.publishPermissionsPlaceholder')}
                  className="input w-full"
                  defaultValue={selectedUser ? Object.keys(selectedUser.permissions.publish || {}).join(', ') : '>'}
                />
                <p className="text-xs text-dark-muted mt-1">Comma-separated subjects or JSON</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('security.subscribePermissions')}</label>
                <input
                  type="text"
                  name="subscribe_permissions"
                  placeholder={t('security.subscribePermissionsPlaceholder')}
                  className="input w-full"
                  defaultValue={selectedUser ? Object.keys(selectedUser.permissions.subscribe || {}).join(', ') : '>'}
                />
                <p className="text-xs text-dark-muted mt-1">{t('security.permissionsHelp')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="user-enabled" name="enabled" defaultChecked={selectedUser?.enabled ?? true} />
                <label htmlFor="user-enabled" className="text-sm">{t('security.enableUserCheckbox')}</label>
              </div>
              <div className="flex items-center gap-3 pt-4">
                 <Button type="button" variant="secondary" onClick={() => setShowUserModal(false)}>
                   {t('common.cancel')}
                 </Button>
                 <Button type="submit" variant="primary" loading={createUserMutation.isPending}>
                   {createUserMutation.isPending ? t('security.creating') : t('security.createUser')}
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
