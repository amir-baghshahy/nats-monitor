/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClusterInfoPeerResponse } from './ClusterInfoPeerResponse';
export type ClusterStreamClusterResponse = {
    leader?: string;
    leader_since?: string;
    name?: string;
    raft_group?: string;
    replicas?: Array<ClusterInfoPeerResponse>;
    system_account?: boolean;
    traffic_account?: string;
};

