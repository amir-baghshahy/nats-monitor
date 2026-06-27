/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { PublishMessageRequest } from '../models/PublishMessageRequest';
import type { PublishMessageResponse } from '../models/PublishMessageResponse';
import type { RequestMessageRequest } from '../models/RequestMessageRequest';
import type { ServiceDiscoveryResponse } from '../models/ServiceDiscoveryResponse';
import type { SubscriptionsResponse } from '../models/SubscriptionsResponse';
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
     * @param request Message to publish
     * @returns PublishMessageResponse OK
     * @throws ApiError
     */
    public static postCorePublish(
        request: PublishMessageRequest,
    ): CancelablePromise<PublishMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/core/publish',
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Send a Core NATS request
     * Publishes a request message and waits for a reply (request/reply pattern)
     * @param request Request message
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static postCoreRequest(
        request: RequestMessageRequest,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/core/request',
            body: request,
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
     * @returns ServiceDiscoveryResponse OK
     * @throws ApiError
     */
    public static getCoreServices(): CancelablePromise<ServiceDiscoveryResponse> {
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
     * @returns SubscriptionsResponse OK
     * @throws ApiError
     */
    public static getCoreSubscriptions(): CancelablePromise<SubscriptionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/core/subscriptions',
        });
    }
}
