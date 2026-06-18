/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ClusterConnectedServer } from './nats_monitoring_internal_dto_ClusterConnectedServer';
import type { nats_monitoring_internal_dto_ClusterJetStreamHealth } from './nats_monitoring_internal_dto_ClusterJetStreamHealth';
export type nats_monitoring_internal_dto_ClusterHealthResponse = {
    connected?: boolean;
    connected_server?: nats_monitoring_internal_dto_ClusterConnectedServer;
    jetstream?: nats_monitoring_internal_dto_ClusterJetStreamHealth;
    server_status?: string;
    status?: string;
};

