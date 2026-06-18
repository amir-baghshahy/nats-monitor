/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ClusterNodeResponse } from './nats_monitoring_internal_dto_ClusterNodeResponse';
export type nats_monitoring_internal_dto_ClusterNodesResponse = {
    cluster_name?: string;
    clustered?: boolean;
    nodes?: Array<nats_monitoring_internal_dto_ClusterNodeResponse>;
};

