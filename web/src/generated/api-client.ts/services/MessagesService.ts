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
     * Publish a message to a stream
     * @param name Stream name
     * @param request Message to publish
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsMessagesPublish(
        name: string,
        request: nats_monitoring_internal_dto_PublishMessageRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
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
