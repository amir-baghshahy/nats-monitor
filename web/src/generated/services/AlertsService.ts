/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Alert } from '../models/Alert';
import type { AlertTrigger } from '../models/AlertTrigger';
import type { CheckAlertsResponse } from '../models/CheckAlertsResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AlertsService {
    /**
     * List alerts
     * Returns all configured alert definitions
     * @returns Alert OK
     * @throws ApiError
     */
    public static getAlerts(): CancelablePromise<Array<Alert>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alerts',
        });
    }
    /**
     * Create an alert
     * Creates a new alert configuration
     * @param request Alert configuration
     * @returns Alert Created
     * @throws ApiError
     */
    public static postAlerts(
        request: Alert,
    ): CancelablePromise<Alert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts',
            body: request,
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * Check alerts now
     * Evaluates all enabled alert conditions immediately and returns how many triggered
     * @returns CheckAlertsResponse OK
     * @throws ApiError
     */
    public static postAlertsCheck(): CancelablePromise<CheckAlertsResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts/check',
        });
    }
    /**
     * List alert triggers
     * Returns triggered alert instances, optionally filtered
     * @param alertId Filter by alert ID
     * @param acked Filter by acked state (true/false)
     * @returns AlertTrigger OK
     * @throws ApiError
     */
    public static getAlertsTriggers(
        alertId?: string,
        acked?: string,
    ): CancelablePromise<Array<AlertTrigger>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alerts/triggers',
            query: {
                'alert_id': alertId,
                'acked': acked,
            },
        });
    }
    /**
     * Acknowledge an alert trigger
     * Acknowledges one or more triggers for the given alert ID
     * @param id Alert ID
     * @param request Acknowledging user
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static postAlertsTriggersAck(
        id: string,
        request?: any,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts/triggers/{id}/ack',
            path: {
                'id': id,
            },
            body: request,
        });
    }
    /**
     * Get an alert
     * Returns a single alert configuration by ID
     * @param id Alert ID
     * @returns Alert OK
     * @throws ApiError
     */
    public static getAlerts1(
        id: string,
    ): CancelablePromise<Alert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alerts/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Update an alert
     * Updates an existing alert configuration
     * @param id Alert ID
     * @param request Alert configuration
     * @returns Alert OK
     * @throws ApiError
     */
    public static putAlerts(
        id: string,
        request: Alert,
    ): CancelablePromise<Alert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/alerts/{id}',
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
     * Delete an alert
     * Deletes an alert configuration by ID
     * @param id Alert ID
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteAlerts(
        id: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/alerts/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
