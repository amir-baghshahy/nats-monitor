/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_PublishMessageRequest } from '../models/nats_monitoring_internal_dto_PublishMessageRequest';
import type { nats_monitoring_internal_dto_SuccessResponse } from '../models/nats_monitoring_internal_dto_SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessagesService {
    /**
     * Get stream messages
     * Lists messages from a stream. This endpoint currently returns 501 until message retrieval is implemented.
     * @param stream Stream name
     * @returns void
     * @throws ApiError
     */
    public static getMessages(
        stream: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/messages',
            query: {
                'stream': stream,
            },
            errors: {
                400: `Bad Request`,
                501: `Not Implemented`,
            },
        });
    }
    /**
     * Get paginated stream messages
     * Returns paginated messages from a stream.
     * @param stream Stream name
     * @param page Page number
     * @param pageSize Page size
     * @returns void
     * @throws ApiError
     */
    public static getMessagesPage(
        stream: string,
        page: number = 1,
        pageSize: number = 25,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/messages/page',
            query: {
                'stream': stream,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Publish a message to a stream
     * @param name Stream name
     * @param requestBody Message to publish
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsMessagesPublish(
        name: string,
        requestBody: nats_monitoring_internal_dto_PublishMessageRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/messages/publish',
            path: {
                'name': name,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a message from a stream
     * @param name Stream name
     * @param sequence Message sequence number
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreamsMessages(
        name: string,
        sequence: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/streams/{name}/messages/{sequence}',
            path: {
                'name': name,
                'sequence': sequence,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
