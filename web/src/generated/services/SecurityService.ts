/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuditEvent } from '../models/AuditEvent';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SecurityService {
    /**
     * Get audit logs
     * Returns audit log entries from the NATS audit stream
     * @param offset Offset for pagination
     * @param limit Maximum number of logs to return
     * @param action Filter by action type
     * @param user Filter by user
     * @returns AuditEvent OK
     * @throws ApiError
     */
    public static getSecurityAudit(
        offset?: number,
        limit: number = 100,
        action?: string,
        user?: string,
    ): CancelablePromise<Array<AuditEvent>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/security/audit',
            query: {
                'offset': offset,
                'limit': limit,
                'action': action,
                'user': user,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get connection security status
     * Returns server details and connection security (auth/TLS) status
     * @returns any connection status
     * @throws ApiError
     */
    public static getSecurityConnections(): CancelablePromise<any> {
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
    public static getSecurityInfo(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/security/info',
        });
    }
    /**
     * List users
     * Returns NATS users (not implemented)
     * @returns User OK
     * @throws ApiError
     */
    public static getSecurityUsers(): CancelablePromise<Array<User>> {
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
     * @param request User to create
     * @returns User Created
     * @throws ApiError
     */
    public static postSecurityUsers(
        request: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/security/users',
            body: request,
            errors: {
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Update a user
     * Updates a NATS user (not implemented)
     * @param name User name
     * @param request User update
     * @returns User OK
     * @throws ApiError
     */
    public static putSecurityUsers(
        name: string,
        request: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/security/users/{name}',
            path: {
                'name': name,
            },
            body: request,
            errors: {
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Delete a user
     * Deletes a NATS user (not implemented)
     * @param name User name
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteSecurityUsers(
        name: string,
    ): CancelablePromise<SuccessResponse> {
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
}
