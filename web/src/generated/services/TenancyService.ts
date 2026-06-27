/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionConfig } from '../models/ConnectionConfig';
import type { SuccessResponse } from '../models/SuccessResponse';
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
    public static getTenancyConnections(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenancy/connections',
        });
    }
    /**
     * Create a tenancy connection
     * Creates a new multi-tenancy NATS connection configuration
     * @param request Connection configuration
     * @returns ConnectionConfig Created
     * @throws ApiError
     */
    public static postTenancyConnections(
        request: ConnectionConfig,
    ): CancelablePromise<ConnectionConfig> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tenancy/connections',
            body: request,
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Test a connection
     * Attempts to connect to a NATS URL and reports connectivity and latency
     * @param request Connection test request
     * @returns any connection test result
     * @throws ApiError
     */
    public static postTenancyConnectionsTest(
        request: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tenancy/connections/test',
            body: request,
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Get a tenancy connection
     * Returns a single configured NATS connection by ID
     * @param id Connection ID
     * @returns ConnectionConfig OK
     * @throws ApiError
     */
    public static getTenancyConnections1(
        id: string,
    ): CancelablePromise<ConnectionConfig> {
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
     * @param request Connection configuration
     * @returns ConnectionConfig OK
     * @throws ApiError
     */
    public static putTenancyConnections(
        id: string,
        request: ConnectionConfig,
    ): CancelablePromise<ConnectionConfig> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/tenancy/connections/{id}',
            path: {
                'id': id,
            },
            body: request,
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete a tenancy connection
     * Deletes a multi-tenancy NATS connection configuration (the default connection cannot be deleted)
     * @param id Connection ID
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteTenancyConnections(
        id: string,
    ): CancelablePromise<SuccessResponse> {
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
     * Set default connection
     * Marks a connection as the default NATS connection
     * @param id Connection ID
     * @returns ConnectionConfig OK
     * @throws ApiError
     */
    public static getTenancyConnectionsDefault(
        id: string,
    ): CancelablePromise<ConnectionConfig> {
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
    public static getTenancyStatus(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tenancy/status',
        });
    }
}
