/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ClusterJetStreamInfo } from './nats_monitoring_internal_dto_ClusterJetStreamInfo';
export type nats_monitoring_internal_dto_ClusterInfoResponse = {
    cluster_name?: string;
    cluster_url?: string;
    is_clustered?: boolean;
    jetstream?: nats_monitoring_internal_dto_ClusterJetStreamInfo;
    server_name?: string;
};

