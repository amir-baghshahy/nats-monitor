/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ClusterInfoPeerResponse } from './nats_monitoring_internal_dto_ClusterInfoPeerResponse';
export type nats_monitoring_internal_dto_ClusterStreamClusterResponse = {
    leader?: string;
    leader_since?: string;
    name?: string;
    raft_group?: string;
    replicas?: Array<nats_monitoring_internal_dto_ClusterInfoPeerResponse>;
    system_account?: boolean;
    traffic_account?: string;
};

