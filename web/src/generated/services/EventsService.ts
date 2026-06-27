/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EventsService {
    /**
     * Server-Sent Events stream
     * Opens a Server-Sent Events stream for real-time stream/consumer/dashboard updates
     * @param channel Event channel (streams, consumers, dashboard, all)
     * @returns string text/event-stream
     * @throws ApiError
     */
    public static getEvents(
        channel: string = 'all',
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/events',
            query: {
                'channel': channel,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
