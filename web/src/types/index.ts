import type {
  internal_handlers_Alert,
  internal_handlers_AlertCondition,
  internal_handlers_AlertSeverity,
  internal_handlers_AlertTrigger,
  internal_handlers_ConnectionConfig,
  internal_handlers_MetricDataPoint,
  internal_handlers_MetricSeries,
  internal_handlers_MetricsResponse,
  internal_handlers_User,
  internal_handlers_UserPermissions,
  nats_monitoring_internal_dto_ClusterConnectedServer,
  nats_monitoring_internal_dto_ClusterHealthResponse,
  nats_monitoring_internal_dto_ClusterInfoPeerResponse,
  nats_monitoring_internal_dto_ClusterInfoResponse,
  nats_monitoring_internal_dto_ClusterJetStreamHealth,
  nats_monitoring_internal_dto_ClusterJetStreamInfo,
  nats_monitoring_internal_dto_ClusterNodeResponse,
  nats_monitoring_internal_dto_ClusterNodesResponse,
  nats_monitoring_internal_dto_ClusterPlacementResponse,
  nats_monitoring_internal_dto_ClusterStreamClusterResponse,
  nats_monitoring_internal_dto_ClusterStreamReplicaResponse,
  nats_monitoring_internal_dto_ClusterStreamSource,
  nats_monitoring_internal_dto_KVBucketCreateResponse,
  nats_monitoring_internal_dto_KVBucketDeleteResponse,
  nats_monitoring_internal_dto_KVBucketInfo,
  nats_monitoring_internal_dto_KVKeyDeleteResponse,
  nats_monitoring_internal_dto_KVKeyEntry,
  nats_monitoring_internal_dto_KVKeyHistoryEntry,
  nats_monitoring_internal_dto_KVKeyPutResponse,
  nats_monitoring_internal_dto_KVPurgeResponse,
  time_Duration,
} from '../generated/api-client.ts'

type RequiredAlertCondition = Required<internal_handlers_AlertCondition> & {
  type: string
  operator: string
  threshold: number
}

export type Alert = Omit<Required<internal_handlers_Alert>, 'cooldown' | 'condition'> & {
  channels: string[]
  condition: RequiredAlertCondition
  cooldown: number
  enabled: boolean
  trigger_count: number
}
export type AlertCondition = internal_handlers_AlertCondition
export type AlertSeverity = internal_handlers_AlertSeverity
export type AlertTrigger = Required<internal_handlers_AlertTrigger> & {
  acked: boolean
  severity: AlertSeverity
  triggered_at: string
}
export type ClusterConnectedServer = nats_monitoring_internal_dto_ClusterConnectedServer
export type ClusterHealthResponse = nats_monitoring_internal_dto_ClusterHealthResponse
export type ClusterInfoPeerResponse = nats_monitoring_internal_dto_ClusterInfoPeerResponse
export type ClusterInfoResponse = nats_monitoring_internal_dto_ClusterInfoResponse
export type ClusterJetStreamHealth = nats_monitoring_internal_dto_ClusterJetStreamHealth
export type ClusterJetStreamInfo = nats_monitoring_internal_dto_ClusterJetStreamInfo
export type ClusterNodeResponse = nats_monitoring_internal_dto_ClusterNodeResponse
export type ClusterNodesResponse = nats_monitoring_internal_dto_ClusterNodesResponse
export type ClusterPlacementResponse = nats_monitoring_internal_dto_ClusterPlacementResponse
export type ClusterStreamClusterResponse = nats_monitoring_internal_dto_ClusterStreamClusterResponse
export type ClusterStreamReplicaResponse = nats_monitoring_internal_dto_ClusterStreamReplicaResponse
export type ClusterStreamSource = nats_monitoring_internal_dto_ClusterStreamSource
export type ConnectionConfig = internal_handlers_ConnectionConfig
export type ConnectionStatus = {
  id: string
  name: string
  connected: boolean
  healthy: boolean
  latency?: string
  error?: string
  last_checked: string
}
export type KVBucketCreateResponse = nats_monitoring_internal_dto_KVBucketCreateResponse
export type KVBucketDeleteResponse = nats_monitoring_internal_dto_KVBucketDeleteResponse
export type KVBucketInfo = nats_monitoring_internal_dto_KVBucketInfo
export type KVKeyDeleteResponse = nats_monitoring_internal_dto_KVKeyDeleteResponse
export type KVKeyEntry = nats_monitoring_internal_dto_KVKeyEntry
export type KVKeyHistoryEntry = nats_monitoring_internal_dto_KVKeyHistoryEntry
export type KVKeyPutResponse = nats_monitoring_internal_dto_KVKeyPutResponse
export type KVPurgeResponse = nats_monitoring_internal_dto_KVPurgeResponse
export type MetricDataPoint = internal_handlers_MetricDataPoint
export type MetricSeries = internal_handlers_MetricSeries
export type MetricsResponse = internal_handlers_MetricsResponse
export type User = internal_handlers_User
export type UserPermissions = internal_handlers_UserPermissions
export type Duration = time_Duration

export * from '../generated/api-client.ts/index'
