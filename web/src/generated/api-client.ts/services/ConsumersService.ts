/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_AckMessageRequest } from '../models/nats_monitoring_internal_dto_AckMessageRequest';
import type { nats_monitoring_internal_dto_AckMessageResponse } from '../models/nats_monitoring_internal_dto_AckMessageResponse';
import type { nats_monitoring_internal_dto_AckTermMessageRequest } from '../models/nats_monitoring_internal_dto_AckTermMessageRequest';
import type { nats_monitoring_internal_dto_ConsumerResponse } from '../models/nats_monitoring_internal_dto_ConsumerResponse';
import type { nats_monitoring_internal_dto_CreateConsumerRequest } from '../models/nats_monitoring_internal_dto_CreateConsumerRequest';
import type { nats_monitoring_internal_dto_NackMessageRequest } from '../models/nats_monitoring_internal_dto_NackMessageRequest';
import type { nats_monitoring_internal_dto_PendingMessagesResponse } from '../models/nats_monitoring_internal_dto_PendingMessagesResponse';
import type { nats_monitoring_internal_dto_ReplayRequest } from '../models/nats_monitoring_internal_dto_ReplayRequest';
import type { nats_monitoring_internal_dto_ReplayResponse } from '../models/nats_monitoring_internal_dto_ReplayResponse';
import type { nats_monitoring_internal_dto_ResetLagRequest } from '../models/nats_monitoring_internal_dto_ResetLagRequest';
import type { nats_monitoring_internal_dto_ResetLagResponse } from '../models/nats_monitoring_internal_dto_ResetLagResponse';
import type { nats_monitoring_internal_dto_SuccessResponse } from '../models/nats_monitoring_internal_dto_SuccessResponse';
import type { nats_monitoring_internal_dto_UpdateConsumerRequest } from '../models/nats_monitoring_internal_dto_UpdateConsumerRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConsumersService {
    /**
     * List all consumers across all streams
     * @returns nats_monitoring_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static getConsumers(): CancelablePromise<Array<nats_monitoring_internal_dto_ConsumerResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/consumers',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get consumer by name across all streams
     * @param name Consumer name
     * @returns nats_monitoring_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static getConsumers1(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_ConsumerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/consumers/{name}',
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
     * Create a consumer
     * @param name Stream name
     * @param request Consumer creation request
     * @returns nats_monitoring_internal_dto_ConsumerResponse Created
     * @throws ApiError
     */
    public static postStreamsConsumers(
        name: string,
        request: nats_monitoring_internal_dto_CreateConsumerRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_ConsumerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers',
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
     * Get consumer details
     * @param name Stream name
     * @param consumer Consumer name
     * @returns nats_monitoring_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static getStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<nats_monitoring_internal_dto_ConsumerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/streams/{name}/consumers/{consumer}',
            path: {
                'name': name,
                'consumer': consumer,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @param request Consumer update request
     * @returns nats_monitoring_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static putStreamsConsumers(
        name: string,
        consumer: string,
        request: nats_monitoring_internal_dto_UpdateConsumerRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_ConsumerResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/streams/{name}/consumers/{consumer}',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/streams/{name}/consumers/{consumer}',
            path: {
                'name': name,
                'consumer': consumer,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Acknowledge a message
     * @param name Stream name
     * @param consumer Consumer name
     * @param request Acknowledgment request
     * @returns nats_monitoring_internal_dto_AckMessageResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersAck(
        name: string,
        consumer: string,
        request: nats_monitoring_internal_dto_AckMessageRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_AckMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/ack',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Reset consumer lag
     * @param name Stream name
     * @param consumer Consumer name
     * @param request Reset lag options
     * @returns nats_monitoring_internal_dto_ResetLagResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersLagReset(
        name: string,
        consumer: string,
        request?: nats_monitoring_internal_dto_ResetLagRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_ResetLagResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/lag-reset',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: request,
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Negatively acknowledge a message
     * @param name Stream name
     * @param consumer Consumer name
     * @param request Negative acknowledgment request
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersNack(
        name: string,
        consumer: string,
        request: nats_monitoring_internal_dto_NackMessageRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/nack',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Pause a consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersPause(
        name: string,
        consumer: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/pause',
            path: {
                'name': name,
                'consumer': consumer,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get pending messages for a consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @param limit Maximum number of messages to return
     * @returns nats_monitoring_internal_dto_PendingMessagesResponse OK
     * @throws ApiError
     */
    public static getStreamsConsumersPending(
        name: string,
        consumer: string,
        limit: number = 25,
    ): CancelablePromise<nats_monitoring_internal_dto_PendingMessagesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/streams/{name}/consumers/{consumer}/pending',
            path: {
                'name': name,
                'consumer': consumer,
            },
            query: {
                'limit': limit,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Replay messages to consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @param request Replay options
     * @returns nats_monitoring_internal_dto_ReplayResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersReplay(
        name: string,
        consumer: string,
        request?: nats_monitoring_internal_dto_ReplayRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_ReplayResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/replay',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: request,
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Resume a paused consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersResume(
        name: string,
        consumer: string,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/resume',
            path: {
                'name': name,
                'consumer': consumer,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Terminate a message
     * @param name Stream name
     * @param consumer Consumer name
     * @param request Termination request
     * @returns nats_monitoring_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersTerm(
        name: string,
        consumer: string,
        request: nats_monitoring_internal_dto_AckTermMessageRequest,
    ): CancelablePromise<nats_monitoring_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/term',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
