import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClusterService, StreamsService } from '../types'
import {
  Server, HardDrive, Activity, CheckCircle, XCircle,
  RefreshCw, Copy, Database, Shield,
  Zap, Globe
} from 'lucide-react'
import { PageError, PageLoading } from '../components/ui/PageState'

interface ClusterInfo {
  cluster_name: string
  is_clustered: boolean
  server_name: string
  cluster_url?: string
  jetstream: {
    enabled: boolean
    domain?: string
    tier?: number
    api_level?: number
  }
}

interface NodeInfo {
  id: string
  name: string
  current: boolean
  healthy: boolean
  lag: number
  active: boolean
}

interface ClusterNodes {
  nodes: NodeInfo[]
  clustered: boolean
  cluster_name?: string
}

interface ClusterHealth {
  connected: boolean
  status: string
  server_status?: string
  connected_server?: {
    id: string
    url: string
  }
  jetstream?: {
    status: string
    domain?: string
    tiers?: number
  }
}

interface StreamReplica {
  stream: string
  replicas: number
  placement?: { cluster: string; tags: string[] }
  mirror?: { name: string; domain?: string }
  sources?: Array<{ name: string; domain?: string }>
  cluster?: { name: string; replicas?: number[] }
  is_clustered: boolean
}

export default function Cluster() {
  const [selectedStream, setSelectedStream] = useState<string | null>(null)

  const { data: clusterInfo, refetch: refetchInfo, isLoading: infoLoading, error: infoError } = useQuery({
    queryKey: ['clusterInfo'],
    queryFn: () => ClusterService.getClusterInfo() as Promise<ClusterInfo>,
    refetchInterval: 10000,
  })

  const { data: clusterNodes, refetch: refetchNodes, isLoading: nodesLoading, error: nodesError } = useQuery({
    queryKey: ['clusterNodes'],
    queryFn: () => ClusterService.getClusterNodes() as Promise<ClusterNodes>,
    refetchInterval: 10000,
  })

  const { data: clusterHealth, refetch: refetchHealth, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['clusterHealth'],
    queryFn: () => ClusterService.getClusterHealth() as Promise<ClusterHealth>,
    refetchInterval: 5000,
  })

  const { data: streamReplicas, refetch: refetchReplicas, isLoading: replicasLoading, error: replicasError } = useQuery({
    queryKey: ['streamReplicas', selectedStream],
    queryFn: () => selectedStream
      ? ClusterService.getClusterStreamsReplicas(selectedStream) as Promise<StreamReplica>
      : Promise.resolve({} as StreamReplica),
    enabled: !!selectedStream,
  })

  const { data: streams, isLoading: streamsLoading, error: streamsError, refetch: refetchStreams } = useQuery({
    queryKey: ['streams'],
    queryFn: () => StreamsService.getStreams(),
  });

  const refreshAll = () => {
    refetchInfo()
    refetchNodes()
    refetchHealth()
    refetchStreams()
    if (selectedStream) refetchReplicas()
  }

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Unable to load cluster data";
  };

  if (infoLoading || nodesLoading || healthLoading || streamsLoading || (selectedStream && replicasLoading)) {
    return <PageLoading text="Loading cluster data..." />;
  }

  if (infoError || nodesError || healthError || streamsError) {
    return (
      <PageError
        message={getErrorMessage(infoError || nodesError || healthError || streamsError)}
        onRetry={refreshAll}
      />
    );
  }

  if (selectedStream && replicasError) {
    return (
      <PageError
        message={getErrorMessage(replicasError)}
        onRetry={() => refetchReplicas()}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cluster Monitoring</h1>
          <p className="text-dark-muted mt-1">
            {clusterInfo?.is_clustered
              ? `Cluster: ${clusterInfo?.cluster_name || 'Not clustered'}`
              : 'Standalone mode'}
          </p>
        </div>
        <button onClick={refreshAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Connection Status Banner */}
      <div className={`card mb-6 border-l-4 ${
        clusterHealth?.connected
          ? 'border-l-status-success bg-status-success/10'
          : 'border-l-status-error bg-status-error/10'
      }`}>
        <div className="flex items-center gap-3">
          {clusterHealth?.connected ? (
            <CheckCircle className="w-5 h-5 text-status-success" />
          ) : (
            <XCircle className="w-5 h-5 text-status-error" />
          )}
          <div>
            <p className="font-medium">
              {clusterHealth?.connected ? 'Connected' : 'Disconnected'}
            </p>
            <p className="text-sm text-dark-muted">
              {clusterHealth?.connected
                ? `Server: ${clusterHealth?.connected_server?.id || 'Current server'}`
                : 'Unable to connect to NATS server'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cluster Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-primary-400" />
            Cluster Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">Cluster Name</span>
              <span className="font-medium font-mono">
                {clusterInfo?.cluster_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">Server Name</span>
              <span className="font-medium font-mono">
                {clusterInfo?.server_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">Mode</span>
              <span className={`px-2 py-1 rounded text-xs ${
                clusterInfo?.is_clustered
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {clusterInfo?.is_clustered ? 'Clustered' : 'Standalone'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">JetStream</span>
              <span className={`px-2 py-1 rounded text-xs ${
                clusterInfo?.jetstream?.enabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-dark-border'
              }`}>
                {clusterInfo?.jetstream?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {clusterInfo?.jetstream?.domain && (
              <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                <span className="text-dark-muted">JS Domain</span>
                <span className="font-mono text-sm">{clusterInfo.jetstream.domain}</span>
              </div>
            )}
            {clusterInfo?.jetstream?.tier && (
              <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                <span className="text-dark-muted">JS Tier</span>
                <span className="font-mono text-sm">{clusterInfo.jetstream.tier}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cluster Health */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            System Health
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">Connection Status</span>
              <span className={`px-2 py-1 rounded text-xs ${
                clusterHealth?.connected
                  ? 'bg-status-success/20 text-status-success'
                  : 'bg-status-error/20 text-status-error'
              }`}>
                {clusterHealth?.status || 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">Server Status</span>
              <span className="font-mono text-sm capitalize">
                {clusterHealth?.server_status || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-dark-muted">JetStream Status</span>
              <span className={`px-2 py-1 rounded text-xs ${
                clusterHealth?.jetstream?.status === 'ok'
                  ? 'bg-status-success/20 text-status-success'
                  : 'bg-status-error/20 text-status-error'
              }`}>
                {clusterHealth?.jetstream?.status || 'Not available'}
              </span>
            </div>
            {clusterHealth?.connected_server?.url && (
              <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                <span className="text-dark-muted">Connected URL</span>
                <span className="font-mono text-sm truncate max-w-[200px]">
                  {clusterHealth.connected_server.url}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cluster Nodes */}
      {clusterNodes?.clustered && clusterNodes.nodes.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary-400" />
            Cluster Nodes ({clusterNodes.nodes.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusterNodes.nodes.map((node) => (
              <div
                key={node.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  node.current
                    ? 'border-primary-500/50 bg-primary-500/10'
                    : node.healthy
                    ? 'border-dark-border bg-dark-bg/50'
                    : 'border-status-error/50 bg-status-error/10'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {node.healthy ? (
                        <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-status-error flex-shrink-0" />
                      )}
                      <span className="font-mono text-sm font-medium truncate">
                        {node.name}
                      </span>
                    </div>
                    {node.current && (
                      <span className="text-xs text-primary-400 ml-6">
                        (Current)
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      node.healthy
                        ? 'bg-status-success/20 text-status-success'
                        : 'bg-status-error/20 text-status-error'
                    }`}>
                      {node.healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </div>
                  {node.active ? (
                    <div className="flex items-center justify-between">
                      <span className="text-dark-muted">Active</span>
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-dark-muted">Active</span>
                      <span className="text-dark-muted">No</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stream Replication */}
      {clusterInfo?.is_clustered && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-400" />
            Stream Replication
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Stream Selector */}
            <div>
              <h3 className="font-medium mb-3">Select Stream</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {streams?.map((stream: any) => (
                  <div
                    key={stream.config?.name}
                    onClick={() => setSelectedStream(stream.config?.name)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStream === stream.config?.name
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'bg-dark-bg hover:bg-dark-bg/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{stream.config?.name}</span>
                      <span className="text-xs text-dark-muted">
                        {stream.config?.replicas}x replica
                      </span>
                    </div>
                  </div>
                ))}

                {(!streams || streams.length === 0) && (
                  <div className="text-center py-8 text-dark-muted">
                    <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No streams found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Replica Details */}
            {selectedStream && streamReplicas && (
              <div>
                <h3 className="font-medium mb-3">
                  Replication Details: <span className="font-mono text-primary-400">{selectedStream}</span>
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-bg/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-dark-muted">Replicas</span>
                      <span className="font-medium">{streamReplicas.replicas}x</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-dark-muted">Clustered</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        streamReplicas.is_clustered
                          ? 'bg-status-success/20 text-status-success'
                          : 'bg-dark-border'
                      }`}>
                        {streamReplicas.is_clustered ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {streamReplicas.cluster && (
                      <div className="mt-3 pt-3 border-t border-dark-border">
                        <p className="text-sm text-dark-muted mb-2">Cluster Info</p>
                        <p className="font-mono text-sm">{streamReplicas.cluster.name}</p>
                      </div>
                    )}
                  </div>

                  {streamReplicas.mirror && (
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Copy className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">Mirror Source</span>
                      </div>
                      <p className="font-mono text-sm">{streamReplicas.mirror.name}</p>
                      {streamReplicas.mirror.domain && (
                        <p className="text-xs text-dark-muted mt-1">
                          Domain: {streamReplicas.mirror.domain}
                        </p>
                      )}
                    </div>
                  )}

                  {streamReplicas.sources && streamReplicas.sources.length > 0 && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">Aggregate Sources</span>
                      </div>
                      <div className="space-y-1">
                        {streamReplicas.sources.map((source, idx) => (
                          <p key={idx} className="font-mono text-sm">
                            {source.name}
                            {source.domain && <span className="text-dark-muted ml-2">@ {source.domain}</span>}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {streamReplicas.placement && (
                    <div className="p-4 bg-dark-bg/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-primary-400" />
                        <span className="font-medium">Placement Rules</span>
                      </div>
                      <p className="text-sm text-dark-muted">
                        Cluster: <span className="font-mono">{streamReplicas.placement.cluster}</span>
                      </p>
                      {streamReplicas.placement.tags.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-dark-muted">Tags: </span>
                          {streamReplicas.placement.tags.map((tag, idx) => (
                            <span key={idx} className="inline-block px-2 py-0.5 bg-dark-bg rounded text-xs font-mono ml-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedStream && (
              <div className="flex items-center justify-center h-64 text-dark-muted">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a stream to view replication details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Notice */}
      {(!clusterInfo?.is_clustered) && (
        <div className="card mt-6">
          <div className="flex items-start gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">Standalone Mode</h3>
              <p className="text-dark-muted text-sm">
                This NATS server is running in standalone mode. Cluster monitoring features
                like node health, replication status, and raft groups are only available
                in clustered deployments.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
