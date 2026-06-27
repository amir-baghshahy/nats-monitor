/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedMessagesResponse } from '../models/PaginatedMessagesResponse';
import type { PublishMessageRequest } from '../models/PublishMessageRequest';
import type { StreamMessagesResponse } from '../models/StreamMessagesResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessagesService {
    /**
     * Get stream messages
     * Lists messages from a stream
     * @param stream Stream name
     * @param limit Maximum number of messages to return
     * @returns StreamMessagesResponse OK
     * @throws ApiError
     */
    public static getMessages(
        stream: string,
        limit: number = 25,
    ): CancelablePromise<StreamMessagesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/messages',
            query: {
                'stream': stream,
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get paginated stream messages
     * Returns paginated messages from a stream.
     * @param stream Stream name
     * @param page Page number
     * @param pageSize Page size
     * @returns PaginatedMessagesResponse OK
     * @throws ApiError
     */
    public static getMessagesPage(
        stream: string,
        page: number = 1,
        pageSize: number = 25,
    ): CancelablePromise<PaginatedMessagesResponse> {
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
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Publish a message to a stream
     * @param name Stream name
     * @param request Message to publish
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsMessagesPublish(
        name: string,
        request: PublishMessageRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/messages/publish',
            path: {
                'name': name,
            },
            body: request,
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
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreamsMessages(
        name: string,
        sequence: string,
    ): CancelablePromise<SuccessResponse> {
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
