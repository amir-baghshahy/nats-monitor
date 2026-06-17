/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MetricsService {
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
