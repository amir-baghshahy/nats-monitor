/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClusterConnectedServer } from './ClusterConnectedServer';
import type { ClusterJetStreamHealth } from './ClusterJetStreamHealth';
export type ClusterHealthResponse = {
    connected?: boolean;
    connected_server?: ClusterConnectedServer;
    jetstream?: ClusterJetStreamHealth;
    server_status?: string;
    status?: string;
};

