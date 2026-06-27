/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClusterPlacementResponse } from './ClusterPlacementResponse';
import type { ClusterStreamClusterResponse } from './ClusterStreamClusterResponse';
import type { ClusterStreamSource } from './ClusterStreamSource';
export type ClusterStreamReplicaResponse = {
    cluster?: ClusterStreamClusterResponse;
    is_clustered?: boolean;
    mirror?: ClusterStreamSource;
    placement?: ClusterPlacementResponse;
    replicas?: number;
    sources?: Array<ClusterStreamSource>;
    stream?: string;
};

