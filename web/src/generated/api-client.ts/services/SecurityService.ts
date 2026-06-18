/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { internal_handlers_User } from '../models/internal_handlers_User';
import type { nats_monitoring_internal_dto_SuccessResponse } from '../models/nats_monitoring_internal_dto_SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SecurityService {
    /**
     * Get audit logs
     * Returns audit log entries
     * @returns any OK
     * @throws ApiError
     */
    public static getSecurityAudit(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/security/audit',
        });
    }
    /**
     * Get connection security status
     * Returns server details and connection security (auth/TLS) status
     * @returns any connection status
     * @throws ApiError
     */
    public static getSecurityConnections(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/security/connections',
        });
    }
    /**
     * Get security info
     * Returns account information, limits, and server security settings
     * @returns any security info
     * @throws ApiError
     */
    public static getSecurityInfo(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/security/info',
        });
    }
    /**
     * List users
     * Returns NATS users (not implemented)
     * @returns internal_handlers_User OK
     * @throws ApiError
     */
    public static getSecurityUsers(): CancelablePromise<Array<internal_handlers_User>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/security/users',
            errors: {
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Create a user
     * Creates a NATS user (not implemented)
     * @param requestBody User to create
     * @returns internal_handlers_User Created
     * @throws ApiError
     */
    public static postSecurityUsers(
        requestBody: internal_handlers_User,
    ): CancelablePromise<internal_handlers_User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/security/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Delete a user
     * Deletes a NATS user (not implemented)
     * @param name User name
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteSecurityUsers(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/security/users/{name}',
            path: {
                'name': name,
            },
            errors: {
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Update a user
     * Updates a NATS user (not implemented)
     * @param name User name
     * @param requestBody User update
     * @returns internal_handlers_User OK
     * @throws ApiError
     */
    public static putSecurityUsers(
        name: string,
        requestBody: internal_handlers_User,
    ): CancelablePromise<internal_handlers_User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/security/users/{name}',
            path: {
                'name': name,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                501: `Not Implemented`,
            },
        });
    }
}
