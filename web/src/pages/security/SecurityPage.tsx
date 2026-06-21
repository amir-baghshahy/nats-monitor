import { UseSecurityReturn } from './hooks/useSecurity'
import {
  Shield, Lock, Users, Plus, Edit, Trash2,
  Clock, FileText, Server, Activity, ToggleLeft, ToggleRight
} from 'lucide-react'
import { PageError, PageLoading } from '../../components/ui/PageState'

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
    return <PageLoading text="Loading security data..." />
  }

  if (activeError) {
    return <PageError message={getErrorMessage(activeError)} onRetry={refetchInfo} />
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-400" />
            Security
          </h1>
          <p className="text-dark-muted mt-1">
            Monitor and manage NATS security settings
          </p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-dark-bg p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'audit', label: 'Audit Log', icon: FileText },
          { id: 'connections', label: 'Connections', icon: Server },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-dark-muted hover:text-dark-text hover:bg-dark-border'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Account Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Account Name</p>
                <p className="font-medium">{securityInfo?.account?.name || 'N/A'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Imports</p>
                <p className="font-medium">{securityInfo?.account?.imports || 0}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Exports</p>
                <p className="font-medium">{securityInfo?.account?.exports || 0}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Last Updated</p>
                <p className="font-medium text-sm">
                  {securityInfo?.timestamp ? formatTimestamp(securityInfo.timestamp) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Resource Limits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Max Connections</p>
                <p className="font-medium">{securityInfo?.limits?.connections || 'Unlimited'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Max Subscriptions</p>
                <p className="font-medium">{securityInfo?.limits?.subscriptions || 'Unlimited'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Max Data</p>
                <p className="font-medium">{securityInfo?.limits?.data ? formatBytes(securityInfo.limits.data) : 'Unlimited'}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Max Payload</p>
                <p className="font-medium">{securityInfo?.limits?.payload ? formatBytes(securityInfo.limits.payload) : 'Unlimited'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Server Security Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <span>Authentication Required</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  securityInfo?.server_security?.auth_required
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {securityInfo?.server_security?.auth_required ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <span>TLS Required</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  securityInfo?.server_security?.tls_required
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {securityInfo?.server_security?.tls_required ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                <span>TLS Verify</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  securityInfo?.server_security?.tls_verify
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {securityInfo?.server_security?.tls_verify ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({users?.length || 0})
            </h3>
          </div>
          <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-4">
            {users?.map((user) => (
              <div key={user.name} className="p-4 bg-dark-bg/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{user.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Account: {user.account}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-dark-muted">Publish Permissions</p>
                        <div className="mt-1 space-y-1">
                          {Object.entries(user.permissions.publish as Record<string, string>).map(([subject, perm]: [string, string]) => (
                            <div key={subject} className="font-mono bg-dark-bg px-2 py-1 rounded">
                              {subject}: {perm}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-dark-muted">Subscribe Permissions</p>
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
                       onClick={async () => {
                         const ok = await confirm({ title: user.enabled ? "Disable User" : "Enable User", message: `Toggle user "${user.name}"?`, confirmLabel: user.enabled ? "Disable" : "Enable", variant: "warning" })
                         if (ok) updateUserMutation.mutate({ name: user.name, data: { enabled: !user.enabled } })
                       }}
                       className="p-2 hover:bg-dark-border rounded-lg"
                     >
                       {user.enabled ? (
                         <ToggleRight className="w-4 h-4 text-green-400" />
                       ) : (
                         <ToggleLeft className="w-4 h-4 text-dark-muted" />
                       )}
                     </button>
                     <button
                       onClick={() => {
                         setSelectedUser(user)
                         setShowUserModal(true)
                       }}
                       className="p-2 hover:bg-dark-border rounded-lg"
                     >
                       <Edit className="w-4 h-4" />
                     </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({ title: "Delete User", message: `Delete user "${user.name}"?`, confirmLabel: "Delete", variant: "danger" })
                        if (ok) deleteUserMutation.mutate(user.name)
                      }}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
              {users?.length || 0} user{(users?.length || 0) !== 1 ? 's' : ''}
            </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Log
            </h3>
          </div>
          <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
            {auditLogs?.map((log: any, index: number) => (
              <div key={index} className="p-4 bg-dark-bg/50 rounded-lg">
                <div className="flex items-start gap-4">
                  <Clock className="w-4 h-4 text-dark-muted mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm">{log.action}</span>
                      <span className="text-sm text-dark-muted">by {log.user}</span>
                    </div>
                    <p className="text-sm text-dark-muted">Resource: {log.resource}</p>
                    <p className="text-sm mt-1">{log.details}</p>
                    <p className="text-xs text-dark-muted mt-1">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
              {auditLogs?.length || 0} entries
            </div>
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Connection Security Status
          </h3>
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
                {connectionStatus?.status || 'Disconnected'}
              </p>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{selectedUser ? 'Edit User' : 'Create User'}</h2>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                ×
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
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  name="name"
                  placeholder="service-user"
                  className="input w-full"
                  defaultValue={selectedUser?.name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Publish Permissions</label>
                <input
                  type="text"
                  name="publish_permissions"
                  placeholder="orders.>, events.>"
                  className="input w-full"
                  defaultValue={selectedUser ? Object.keys(selectedUser.permissions.publish || {}).join(', ') : '>'}
                />
                <p className="text-xs text-dark-muted mt-1">Comma-separated subjects or JSON</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subscribe Permissions</label>
                <input
                  type="text"
                  name="subscribe_permissions"
                  placeholder="responses.>"
                  className="input w-full"
                  defaultValue={selectedUser ? Object.keys(selectedUser.permissions.subscribe || {}).join(', ') : '>'}
                />
                <p className="text-xs text-dark-muted mt-1">Comma-separated subjects or JSON</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="user-enabled" name="enabled" defaultChecked={selectedUser?.enabled ?? true} />
                <label htmlFor="user-enabled" className="text-sm">Enable user</label>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createUserMutation.isPending} className="btn-primary">
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
