/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_nats_monitor_internal_dto_ConnectionsResponse } from '../models/github_com_amir_nats_monitor_internal_dto_ConnectionsResponse';
import type { github_com_amir_nats_monitor_internal_dto_DashboardStatsResponse } from '../models/github_com_amir_nats_monitor_internal_dto_DashboardStatsResponse';
import type { github_com_amir_nats_monitor_internal_dto_HealthResponse } from '../models/github_com_amir_nats_monitor_internal_dto_HealthResponse';
import type { github_com_amir_nats_monitor_internal_dto_SubjectsResponse } from '../models/github_com_amir_nats_monitor_internal_dto_SubjectsResponse';
import type { github_com_amir_nats_monitor_internal_dto_SuccessResponse } from '../models/github_com_amir_nats_monitor_internal_dto_SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Get JetStream account information
     * @returns any Account information
     * @throws ApiError
     */
    public static getAccountInfo(): CancelablePromise<Record<string, any>> {
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
     * @returns github_com_amir_nats_monitor_internal_dto_ConnectionsResponse OK
     * @throws ApiError
     */
    public static getConnections(): CancelablePromise<github_com_amir_nats_monitor_internal_dto_ConnectionsResponse> {
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
     * @returns github_com_amir_nats_monitor_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteConnections(
        id: string,
    ): CancelablePromise<github_com_amir_nats_monitor_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/connections/{id}',
            path: {
                'id': id,
            },
            errors: {
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Get dashboard statistics
     * @returns github_com_amir_nats_monitor_internal_dto_DashboardStatsResponse OK
     * @throws ApiError
     */
    public static getDashboardStats(): CancelablePromise<github_com_amir_nats_monitor_internal_dto_DashboardStatsResponse> {
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
     * @returns github_com_amir_nats_monitor_internal_dto_HealthResponse OK
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<github_com_amir_nats_monitor_internal_dto_HealthResponse> {
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
    public static getServerInfo(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/server/info',
        });
    }
    /**
     * Get subject information
     * @returns github_com_amir_nats_monitor_internal_dto_SubjectsResponse OK
     * @throws ApiError
     */
    public static getSubjects(): CancelablePromise<github_com_amir_nats_monitor_internal_dto_SubjectsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/subjects',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
