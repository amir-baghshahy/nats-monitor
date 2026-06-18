/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_nats_monitor_internal_dto_MessageResponse } from '../models/github_com_amir_nats_monitor_internal_dto_MessageResponse';
import type { github_com_amir_nats_monitor_internal_dto_PublishMessageRequest } from '../models/github_com_amir_nats_monitor_internal_dto_PublishMessageRequest';
import type { github_com_amir_nats_monitor_internal_dto_PublishMessageResponse } from '../models/github_com_amir_nats_monitor_internal_dto_PublishMessageResponse';
import type { github_com_amir_nats_monitor_internal_dto_RequestMessageRequest } from '../models/github_com_amir_nats_monitor_internal_dto_RequestMessageRequest';
import type { github_com_amir_nats_monitor_internal_dto_ServiceDiscoveryResponse } from '../models/github_com_amir_nats_monitor_internal_dto_ServiceDiscoveryResponse';
import type { github_com_amir_nats_monitor_internal_dto_SubscriptionsResponse } from '../models/github_com_amir_nats_monitor_internal_dto_SubscriptionsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CoreNatsService {
    /**
     * Monitor subject traffic (SSE stream)
     * Opens a Server-Sent Events stream of traffic for the given subjects
     * @param subjects Subjects to monitor (repeatable)
     * @returns string text/event-stream
     * @throws ApiError
     */
    public static getCoreMonitor(
        subjects: Array<string>,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/core/monitor',
            query: {
                'subjects': subjects,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Publish a Core NATS message
     * Publishes a message to a NATS subject (non-JetStream)
     * @param requestBody Message to publish
     * @returns github_com_amir_nats_monitor_internal_dto_PublishMessageResponse OK
     * @throws ApiError
     */
    public static postCorePublish(
        requestBody: github_com_amir_nats_monitor_internal_dto_PublishMessageRequest,
    ): CancelablePromise<github_com_amir_nats_monitor_internal_dto_PublishMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/core/publish',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Send a Core NATS request
     * Publishes a request message and waits for a reply (request/reply pattern)
     * @param requestBody Request message
     * @returns github_com_amir_nats_monitor_internal_dto_MessageResponse OK
     * @throws ApiError
     */
    public static postCoreRequest(
        requestBody: github_com_amir_nats_monitor_internal_dto_RequestMessageRequest,
    ): CancelablePromise<github_com_amir_nats_monitor_internal_dto_MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/core/request',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                408: `Request Timeout`,
                500: `Internal Server Error`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Get service discovery info
     * Returns connection and server discovery information for the NATS cluster
     * @returns github_com_amir_nats_monitor_internal_dto_ServiceDiscoveryResponse OK
     * @throws ApiError
     */
    public static getCoreServices(): CancelablePromise<github_com_amir_nats_monitor_internal_dto_ServiceDiscoveryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/core/services',
        });
    }
    /**
     * Subscribe to a subject (SSE stream)
     * Opens a Server-Sent Events stream of messages published to the given subject
     * @param subject NATS subject to subscribe to
     * @returns string text/event-stream
     * @throws ApiError
     */
    public static getCoreSubscribe(
        subject: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/core/subscribe',
            query: {
                'subject': subject,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get active subscriptions info
     * Returns connection status and active subscription information
     * @returns github_com_amir_nats_monitor_internal_dto_SubscriptionsResponse OK
     * @throws ApiError
     */
    public static getCoreSubscriptions(): CancelablePromise<github_com_amir_nats_monitor_internal_dto_SubscriptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/core/subscriptions',
        });
    }
}
