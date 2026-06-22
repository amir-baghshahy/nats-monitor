/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterInfoPeerResponse } from './github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterInfoPeerResponse';
export type github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamClusterResponse = {
    leader?: string;
    leader_since?: string;
    name?: string;
    raft_group?: string;
    replicas?: Array<github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterInfoPeerResponse>;
    system_account?: boolean;
    traffic_account?: string;
};

