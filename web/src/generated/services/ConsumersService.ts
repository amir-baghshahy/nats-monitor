/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AckMessageRequest } from '../models/AckMessageRequest';
import type { AckMessageResponse } from '../models/AckMessageResponse';
import type { AckTermMessageRequest } from '../models/AckTermMessageRequest';
import type { ConsumerResponse } from '../models/ConsumerResponse';
import type { CreateConsumerRequest } from '../models/CreateConsumerRequest';
import type { NackMessageRequest } from '../models/NackMessageRequest';
import type { PendingMessagesResponse } from '../models/PendingMessagesResponse';
import type { ReplayRequest } from '../models/ReplayRequest';
import type { ReplayResponse } from '../models/ReplayResponse';
import type { ResetLagRequest } from '../models/ResetLagRequest';
import type { ResetLagResponse } from '../models/ResetLagResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateConsumerRequest } from '../models/UpdateConsumerRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConsumersService {
    /**
     * List all consumers across all streams
     * @returns ConsumerResponse OK
     * @throws ApiError
     */
    public static getConsumers(): CancelablePromise<Array<ConsumerResponse>> {
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
     * @returns ConsumerResponse OK
     * @throws ApiError
     */
    public static getConsumers1(
        name: string,
    ): CancelablePromise<ConsumerResponse> {
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
     * @returns ConsumerResponse Created
     * @throws ApiError
     */
    public static postStreamsConsumers(
        name: string,
        request: CreateConsumerRequest,
    ): CancelablePromise<ConsumerResponse> {
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
     * @returns ConsumerResponse OK
     * @throws ApiError
     */
    public static getStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<ConsumerResponse> {
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
     * @returns ConsumerResponse OK
     * @throws ApiError
     */
    public static putStreamsConsumers(
        name: string,
        consumer: string,
        request: UpdateConsumerRequest,
    ): CancelablePromise<ConsumerResponse> {
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
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<SuccessResponse> {
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
     * @returns AckMessageResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersAck(
        name: string,
        consumer: string,
        request: AckMessageRequest,
    ): CancelablePromise<AckMessageResponse> {
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
     * @returns ResetLagResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersLagReset(
        name: string,
        consumer: string,
        request?: ResetLagRequest,
    ): CancelablePromise<ResetLagResponse> {
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
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersNack(
        name: string,
        consumer: string,
        request: NackMessageRequest,
    ): CancelablePromise<SuccessResponse> {
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
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersPause(
        name: string,
        consumer: string,
    ): CancelablePromise<SuccessResponse> {
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
     * @returns PendingMessagesResponse OK
     * @throws ApiError
     */
    public static getStreamsConsumersPending(
        name: string,
        consumer: string,
        limit: number = 25,
    ): CancelablePromise<PendingMessagesResponse> {
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
     * @returns ReplayResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersReplay(
        name: string,
        consumer: string,
        request?: ReplayRequest,
    ): CancelablePromise<ReplayResponse> {
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
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersResume(
        name: string,
        consumer: string,
    ): CancelablePromise<SuccessResponse> {
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
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersTerm(
        name: string,
        consumer: string,
        request: AckTermMessageRequest,
    ): CancelablePromise<SuccessResponse> {
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
