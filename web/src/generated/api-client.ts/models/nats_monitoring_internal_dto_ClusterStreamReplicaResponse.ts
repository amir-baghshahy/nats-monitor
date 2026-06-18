/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ClusterPlacementResponse } from './nats_monitoring_internal_dto_ClusterPlacementResponse';
import type { nats_monitoring_internal_dto_ClusterStreamClusterResponse } from './nats_monitoring_internal_dto_ClusterStreamClusterResponse';
import type { nats_monitoring_internal_dto_ClusterStreamSource } from './nats_monitoring_internal_dto_ClusterStreamSource';
export type nats_monitoring_internal_dto_ClusterStreamReplicaResponse = {
    cluster?: nats_monitoring_internal_dto_ClusterStreamClusterResponse;
    is_clustered?: boolean;
    mirror?: nats_monitoring_internal_dto_ClusterStreamSource;
    placement?: nats_monitoring_internal_dto_ClusterPlacementResponse;
    replicas?: number;
    sources?: Array<nats_monitoring_internal_dto_ClusterStreamSource>;
    stream?: string;
};

