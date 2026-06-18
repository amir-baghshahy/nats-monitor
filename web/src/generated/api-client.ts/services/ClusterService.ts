/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ClusterHealthResponse } from '../models/nats_monitoring_internal_dto_ClusterHealthResponse';
import type { nats_monitoring_internal_dto_ClusterInfoResponse } from '../models/nats_monitoring_internal_dto_ClusterInfoResponse';
import type { nats_monitoring_internal_dto_ClusterNodesResponse } from '../models/nats_monitoring_internal_dto_ClusterNodesResponse';
import type { nats_monitoring_internal_dto_ClusterStreamReplicaResponse } from '../models/nats_monitoring_internal_dto_ClusterStreamReplicaResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClusterService {
    /**
     * Get cluster health
     * Returns connection and JetStream health status of the cluster
     * @returns nats_monitoring_internal_dto_ClusterHealthResponse OK
     * @throws ApiError
     */
    public static getClusterHealth(): CancelablePromise<nats_monitoring_internal_dto_ClusterHealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cluster/health',
            errors: {
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Get cluster information
     * Returns JetStream cluster topology and server information
     * @returns nats_monitoring_internal_dto_ClusterInfoResponse OK
     * @throws ApiError
     */
    public static getClusterInfo(): CancelablePromise<nats_monitoring_internal_dto_ClusterInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cluster/info',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get cluster nodes
     * Returns information about each node in the NATS cluster
     * @returns nats_monitoring_internal_dto_ClusterNodesResponse OK
     * @throws ApiError
     */
    public static getClusterNodes(): CancelablePromise<nats_monitoring_internal_dto_ClusterNodesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cluster/nodes',
        });
    }
    /**
     * Get stream replicas
     * Returns replication, mirror, source, and cluster placement info for a stream
     * @param name Stream name
     * @returns nats_monitoring_internal_dto_ClusterStreamReplicaResponse OK
     * @throws ApiError
     */
    public static getClusterStreamsReplicas(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_ClusterStreamReplicaResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cluster/streams/{name}/replicas',
            path: {
                'name': name,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
