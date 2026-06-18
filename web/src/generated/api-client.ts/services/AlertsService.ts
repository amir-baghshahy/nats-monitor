/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { internal_handlers_Alert } from '../models/internal_handlers_Alert';
import type { internal_handlers_AlertTrigger } from '../models/internal_handlers_AlertTrigger';
import type { nats_monitoring_internal_dto_SuccessResponse } from '../models/nats_monitoring_internal_dto_SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AlertsService {
    /**
     * List alerts
     * Returns all configured alert definitions
     * @returns internal_handlers_Alert OK
     * @throws ApiError
     */
    public static getAlerts(): CancelablePromise<Array<internal_handlers_Alert>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alerts',
        });
    }
    /**
     * Create an alert
     * Creates a new alert configuration
     * @param requestBody Alert configuration
     * @returns internal_handlers_Alert Created
     * @throws ApiError
     */
    public static postAlerts(
        requestBody: internal_handlers_Alert,
    ): CancelablePromise<internal_handlers_Alert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * List alert triggers
     * Returns triggered alert instances, optionally filtered
     * @param alertId Filter by alert ID
     * @param acked Filter by acked state (true/false)
     * @returns internal_handlers_AlertTrigger OK
     * @throws ApiError
     */
    public static getAlertsTriggers(
        alertId?: string,
        acked?: string,
    ): CancelablePromise<Array<internal_handlers_AlertTrigger>> {
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
     * @param requestBody Acknowledging user
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postAlertsTriggersAck(
        id: string,
        requestBody?: Record<string, any>,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts/triggers/{id}/ack',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete an alert
     * Deletes an alert configuration by ID
     * @param id Alert ID
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteAlerts(
        id: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
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
    /**
     * Get an alert
     * Returns a single alert configuration by ID
     * @param id Alert ID
     * @returns internal_handlers_Alert OK
     * @throws ApiError
     */
    public static getAlerts1(
        id: string,
    ): CancelablePromise<internal_handlers_Alert> {
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
     * @param requestBody Alert configuration
     * @returns internal_handlers_Alert OK
     * @throws ApiError
     */
    public static putAlerts(
        id: string,
        requestBody: internal_handlers_Alert,
    ): CancelablePromise<internal_handlers_Alert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/alerts/{id}',
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
}
