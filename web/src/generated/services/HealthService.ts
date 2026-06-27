/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionsResponse } from '../models/ConnectionsResponse';
import type { DashboardStatsResponse } from '../models/DashboardStatsResponse';
import type { HealthResponse } from '../models/HealthResponse';
import type { SubjectsResponse } from '../models/SubjectsResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Get JetStream account information
     * @returns any Account information
     * @throws ApiError
     */
    public static getAccountInfo(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/account/info',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get NATS connections
     * @returns ConnectionsResponse OK
     * @throws ApiError
     */
    public static getConnections(): CancelablePromise<ConnectionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/connections',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Terminate a connection
     * @param id Connection ID
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteConnections(
        id: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/connections/{id}',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get dashboard statistics
     * @returns DashboardStatsResponse OK
     * @throws ApiError
     */
    public static getDashboardStats(): CancelablePromise<DashboardStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/dashboard/stats',
            errors: {
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Get system health status
     * @returns HealthResponse OK
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<HealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
            errors: {
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Get server information
     * @returns any Server information
     * @throws ApiError
     */
    public static getServerInfo(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/server/info',
        });
    }
    /**
     * Get subject information
     * @returns SubjectsResponse OK
     * @throws ApiError
     */
    public static getSubjects(): CancelablePromise<SubjectsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/subjects',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
