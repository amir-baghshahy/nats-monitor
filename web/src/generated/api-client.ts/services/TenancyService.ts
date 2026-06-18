/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_nats_monitor_internal_dto_SuccessResponse } from '../models/github_com_amir_nats_monitor_internal_dto_SuccessResponse';
import type { internal_handlers_ConnectionConfig } from '../models/internal_handlers_ConnectionConfig';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TenancyService {
    /**
     * List tenancy connections
     * Returns all configured multi-tenancy NATS connections
     * @returns any connections list
     * @throws ApiError
     */
    public static getTenancyConnections(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenancy/connections',
        });
    }
    /**
     * Create a tenancy connection
     * Creates a new multi-tenancy NATS connection configuration
     * @param requestBody Connection configuration
     * @returns internal_handlers_ConnectionConfig Created
     * @throws ApiError
     */
    public static postTenancyConnections(
        requestBody: internal_handlers_ConnectionConfig,
    ): CancelablePromise<internal_handlers_ConnectionConfig> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tenancy/connections',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Test a connection
     * Attempts to connect to a NATS URL and reports connectivity and latency
     * @param requestBody Connection test request
     * @returns any connection test result
     * @throws ApiError
     */
    public static postTenancyConnectionsTest(
        requestBody: Record<string, any>,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tenancy/connections/test',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Delete a tenancy connection
     * Deletes a multi-tenancy NATS connection configuration (the default connection cannot be deleted)
     * @param id Connection ID
     * @returns github_com_amir_nats_monitor_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteTenancyConnections(
        id: string,
    ): CancelablePromise<github_com_amir_nats_monitor_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/tenancy/connections/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Get a tenancy connection
     * Returns a single configured NATS connection by ID
     * @param id Connection ID
     * @returns internal_handlers_ConnectionConfig OK
     * @throws ApiError
     */
    public static getTenancyConnections1(
        id: string,
    ): CancelablePromise<internal_handlers_ConnectionConfig> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenancy/connections/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Update a tenancy connection
     * Updates an existing multi-tenancy NATS connection configuration
     * @param id Connection ID
     * @param requestBody Connection configuration
     * @returns internal_handlers_ConnectionConfig OK
     * @throws ApiError
     */
    public static putTenancyConnections(
        id: string,
        requestBody: internal_handlers_ConnectionConfig,
    ): CancelablePromise<internal_handlers_ConnectionConfig> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/tenancy/connections/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Set default connection
     * Marks a connection as the default NATS connection
     * @param id Connection ID
     * @returns internal_handlers_ConnectionConfig OK
     * @throws ApiError
     */
    public static getTenancyConnectionsDefault(
        id: string,
    ): CancelablePromise<internal_handlers_ConnectionConfig> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenancy/connections/{id}/default',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Get tenancy connection status
     * Returns the connectivity status of all configured connections
     * @returns any connection statuses
     * @throws ApiError
     */
    public static getTenancyStatus(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenancy/status',
        });
    }
}
