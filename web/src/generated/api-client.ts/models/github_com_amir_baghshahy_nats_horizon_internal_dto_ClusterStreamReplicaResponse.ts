/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterPlacementResponse } from './github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterPlacementResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamClusterResponse } from './github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamClusterResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamSource } from './github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamSource';
export type github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamReplicaResponse = {
    cluster?: github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamClusterResponse;
    is_clustered?: boolean;
    mirror?: github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamSource;
    placement?: github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterPlacementResponse;
    replicas?: number;
    sources?: Array<github_com_amir_baghshahy_nats_horizon_internal_dto_ClusterStreamSource>;
    stream?: string;
};

