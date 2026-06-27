/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClusterHealthResponse } from '../models/ClusterHealthResponse';
import type { ClusterInfoResponse } from '../models/ClusterInfoResponse';
import type { ClusterNodesResponse } from '../models/ClusterNodesResponse';
import type { ClusterStreamReplicaResponse } from '../models/ClusterStreamReplicaResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClusterService {
    /**
     * Get cluster health
     * Returns connection and JetStream health status of the cluster
     * @returns ClusterHealthResponse OK
     * @throws ApiError
     */
    public static getClusterHealth(): CancelablePromise<ClusterHealthResponse> {
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
     * @returns ClusterInfoResponse OK
     * @throws ApiError
     */
    public static getClusterInfo(): CancelablePromise<ClusterInfoResponse> {
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
     * @returns ClusterNodesResponse OK
     * @throws ApiError
     */
    public static getClusterNodes(): CancelablePromise<ClusterNodesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cluster/nodes',
        });
    }
    /**
     * Get stream replicas
     * Returns replication, mirror, source, and cluster placement info for a stream
     * @param name Stream name
     * @returns ClusterStreamReplicaResponse OK
     * @throws ApiError
     */
    public static getClusterStreamsReplicas(
        name: string,
    ): CancelablePromise<ClusterStreamReplicaResponse> {
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
