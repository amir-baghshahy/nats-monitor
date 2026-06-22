/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageRequest';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageResponse } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_AckTermMessageRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_AckTermMessageRequest';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_CreateConsumerRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_CreateConsumerRequest';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_NackMessageRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_NackMessageRequest';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessagesResponse } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessagesResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayRequest';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayResponse } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagRequest';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagResponse } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse';
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest } from '../models/github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConsumersService {
    /**
     * List all consumers across all streams
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static getConsumers(): CancelablePromise<Array<github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse>> {
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
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static getConsumers1(
        name: string,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse> {
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
     * @param requestBody Consumer creation request
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse Created
     * @throws ApiError
     */
    public static postStreamsConsumers(
        name: string,
        requestBody: github_com_amir_baghshahy_nats_horizon_internal_dto_CreateConsumerRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers',
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
     * Delete a consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static deleteStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse> {
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
     * Get consumer details
     * @param name Stream name
     * @param consumer Consumer name
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static getStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse> {
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
     * @param requestBody Consumer update request
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse OK
     * @throws ApiError
     */
    public static putStreamsConsumers(
        name: string,
        consumer: string,
        requestBody: github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/streams/{name}/consumers/{consumer}',
            path: {
                'name': name,
                'consumer': consumer,
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
     * Acknowledge a message
     * @param name Stream name
     * @param consumer Consumer name
     * @param requestBody Acknowledgment request
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersAck(
        name: string,
        consumer: string,
        requestBody: github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_AckMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/ack',
            path: {
                'name': name,
                'consumer': consumer,
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
     * Reset consumer lag
     * @param name Stream name
     * @param consumer Consumer name
     * @param requestBody Reset lag options
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersLagReset(
        name: string,
        consumer: string,
        requestBody?: github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_ResetLagResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/lag-reset',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Negatively acknowledge a message
     * @param name Stream name
     * @param consumer Consumer name
     * @param requestBody Negative acknowledgment request
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersNack(
        name: string,
        consumer: string,
        requestBody: github_com_amir_baghshahy_nats_horizon_internal_dto_NackMessageRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/nack',
            path: {
                'name': name,
                'consumer': consumer,
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
     * Pause a consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersPause(
        name: string,
        consumer: string,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse> {
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
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessagesResponse OK
     * @throws ApiError
     */
    public static getStreamsConsumersPending(
        name: string,
        consumer: string,
        limit: number = 25,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessagesResponse> {
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
     * @param requestBody Replay options
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersReplay(
        name: string,
        consumer: string,
        requestBody?: github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_ReplayResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/replay',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Resume a paused consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersResume(
        name: string,
        consumer: string,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse> {
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
     * @param requestBody Termination request
     * @returns github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse OK
     * @throws ApiError
     */
    public static postStreamsConsumersTerm(
        name: string,
        consumer: string,
        requestBody: github_com_amir_baghshahy_nats_horizon_internal_dto_AckTermMessageRequest,
    ): CancelablePromise<github_com_amir_baghshahy_nats_horizon_internal_dto_SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/streams/{name}/consumers/{consumer}/term',
            path: {
                'name': name,
                'consumer': consumer,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
