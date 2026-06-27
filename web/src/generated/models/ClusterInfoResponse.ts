/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClusterJetStreamInfo } from './ClusterJetStreamInfo';
export type ClusterInfoResponse = {
    cluster_name?: string;
    cluster_url?: string;
    is_clustered?: boolean;
    jetstream?: ClusterJetStreamInfo;
    server_name?: string;
};

