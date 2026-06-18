/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_CreateStreamRequest } from '../models/nats_monitoring_internal_dto_CreateStreamRequest';
import type { nats_monitoring_internal_dto_PurgeStreamRequest } from '../models/nats_monitoring_internal_dto_PurgeStreamRequest';
import type { nats_monitoring_internal_dto_PurgeStreamResponse } from '../models/nats_monitoring_internal_dto_PurgeStreamResponse';
import type { nats_monitoring_internal_dto_StreamResponse } from '../models/nats_monitoring_internal_dto_StreamResponse';
import type { nats_monitoring_internal_dto_SuccessResponse } from '../models/nats_monitoring_internal_dto_SuccessResponse';
import type { nats_monitoring_internal_dto_UpdateStreamRequest } from '../models/nats_monitoring_internal_dto_UpdateStreamRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StreamsService {
    /**
     * List all streams
     * @returns nats_monitoring_internal_dto_StreamResponse OK
     * @throws ApiError
     */
    public static getStreams(): CancelablePromise<Array<nats_monitoring_internal_dto_StreamResponse>> {
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
     * @param requestBody Stream creation request
     * @returns nats_monitoring_internal_dto_StreamResponse Created
     * @throws ApiError
     */
    public static postStreams(
        requestBody: nats_monitoring_internal_dto_CreateStreamRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_StreamResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a stream
     * @param name Stream name
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreams(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
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
     * Get stream details
     * @param name Stream name
     * @returns nats_monitoring_internal_dto_StreamResponse OK
     * @throws ApiError
     */
    public static getStreams1(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_StreamResponse> {
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
     * @param requestBody Stream update request
     * @returns nats_monitoring_internal_dto_StreamResponse OK
     * @throws ApiError
     */
    public static putStreams(
        name: string,
        requestBody: nats_monitoring_internal_dto_UpdateStreamRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_StreamResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/streams/{name}',
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
     * Purge messages from a stream
     * @param name Stream name
     * @param requestBody Purge options
     * @returns nats_monitoring_internal_dto_PurgeStreamResponse OK
     * @throws ApiError
     */
    public static postStreamsPurge(
        name: string,
        requestBody?: nats_monitoring_internal_dto_PurgeStreamRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_PurgeStreamResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/purge',
            path: {
                'name': name,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
