/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_nats_monitor_internal_dto_ClusterConnectedServer } from './github_com_amir_nats_monitor_internal_dto_ClusterConnectedServer';
import type { github_com_amir_nats_monitor_internal_dto_ClusterJetStreamHealth } from './github_com_amir_nats_monitor_internal_dto_ClusterJetStreamHealth';
export type github_com_amir_nats_monitor_internal_dto_ClusterHealthResponse = {
    connected?: boolean;
    connected_server?: github_com_amir_nats_monitor_internal_dto_ClusterConnectedServer;
    jetstream?: github_com_amir_nats_monitor_internal_dto_ClusterJetStreamHealth;
    server_status?: string;
    status?: string;
};

