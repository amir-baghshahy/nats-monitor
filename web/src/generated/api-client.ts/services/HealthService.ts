/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ConnectionsResponse } from '../models/nats_monitoring_internal_dto_ConnectionsResponse';
import type { nats_monitoring_internal_dto_DashboardStatsResponse } from '../models/nats_monitoring_internal_dto_DashboardStatsResponse';
import type { nats_monitoring_internal_dto_HealthResponse } from '../models/nats_monitoring_internal_dto_HealthResponse';
import type { nats_monitoring_internal_dto_SubjectsResponse } from '../models/nats_monitoring_internal_dto_SubjectsResponse';
import type { nats_monitoring_internal_dto_SuccessResponse } from '../models/nats_monitoring_internal_dto_SuccessResponse';
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
     * @returns nats_monitoring_internal_dto_ConnectionsResponse OK
     * @throws ApiError
     */
    public static getConnections(): CancelablePromise<nats_monitoring_internal_dto_ConnectionsResponse> {
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
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteConnections(
        id: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
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
     * @returns nats_monitoring_internal_dto_DashboardStatsResponse OK
     * @throws ApiError
     */
    public static getDashboardStats(): CancelablePromise<nats_monitoring_internal_dto_DashboardStatsResponse> {
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
     * @returns nats_monitoring_internal_dto_HealthResponse OK
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<nats_monitoring_internal_dto_HealthResponse> {
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
     * @returns nats_monitoring_internal_dto_SubjectsResponse OK
     * @throws ApiError
     */
    public static getSubjects(): CancelablePromise<nats_monitoring_internal_dto_SubjectsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/subjects',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
