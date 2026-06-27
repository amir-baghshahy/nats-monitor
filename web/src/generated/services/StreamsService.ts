/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateStreamRequest } from '../models/CreateStreamRequest';
import type { PurgeStreamRequest } from '../models/PurgeStreamRequest';
import type { PurgeStreamResponse } from '../models/PurgeStreamResponse';
import type { StreamResponse } from '../models/StreamResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateStreamRequest } from '../models/UpdateStreamRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StreamsService {
    /**
     * List all streams
     * @returns StreamResponse OK
     * @throws ApiError
     */
    public static getStreams(): CancelablePromise<Array<StreamResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/streams',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a new stream
     * @param request Stream creation request
     * @returns StreamResponse Created
     * @throws ApiError
     */
    public static postStreams(
        request: CreateStreamRequest,
    ): CancelablePromise<StreamResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams',
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get stream details
     * @param name Stream name
     * @returns StreamResponse OK
     * @throws ApiError
     */
    public static getStreams1(
        name: string,
    ): CancelablePromise<StreamResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/streams/{name}',
            path: {
                'name': name,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a stream
     * @param name Stream name
     * @param request Stream update request
     * @returns StreamResponse OK
     * @throws ApiError
     */
    public static putStreams(
        name: string,
        request: UpdateStreamRequest,
    ): CancelablePromise<StreamResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/streams/{name}',
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
     * Delete a stream
     * @param name Stream name
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreams(
        name: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/streams/{name}',
            path: {
                'name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Purge messages from a stream
     * @param name Stream name
     * @param request Purge options
     * @returns PurgeStreamResponse OK
     * @throws ApiError
     */
    public static postStreamsPurge(
        name: string,
        request?: PurgeStreamRequest,
    ): CancelablePromise<PurgeStreamResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/purge',
            path: {
                'name': name,
            },
            body: request,
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
