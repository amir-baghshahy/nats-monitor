/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MetricsResponse } from '../models/MetricsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MetricsService {
    /**
     * Get metrics
     * Returns collected stream metrics series, optionally filtered by stream, type and duration
     * @param stream Filter by stream name
     * @param type Metric type (messages, bytes, lag)
     * @param duration Time window (15m, 1h, 6h, 24h)
     * @returns MetricsResponse OK
     * @throws ApiError
     */
    public static getMetrics(
        stream?: string,
        type?: string,
        duration: string = '1h',
    ): CancelablePromise<MetricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics',
            query: {
                'stream': stream,
                'type': type,
                'duration': duration,
            },
        });
    }
    /**
     * Get rate metrics
     * @param duration Duration in seconds
     * @returns any Rate metrics
     * @throws ApiError
     */
    public static getMetricsRates(
        duration: number = 60,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics/rates',
            query: {
                'duration': duration,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get stream metrics
     * Returns collected metric series for a specific stream
     * @param name Stream name
     * @returns any stream metrics
     * @throws ApiError
     */
    public static getMetricsStreams(
        name: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics/streams/{name}',
            path: {
                'name': name,
            },
        });
    }
    /**
     * Get consumer metrics
     * Returns lag, delivery, and ack metrics for a specific consumer
     * @param name Stream name
     * @param consumer Consumer name
     * @returns any consumer metrics
     * @throws ApiError
     */
    public static getMetricsStreamsConsumers(
        name: string,
        consumer: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics/streams/{name}/consumers/{consumer}',
            path: {
                'name': name,
                'consumer': consumer,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Get system metrics
     * @returns any System metrics
     * @throws ApiError
     */
    public static getMetricsSystem(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics/system',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
