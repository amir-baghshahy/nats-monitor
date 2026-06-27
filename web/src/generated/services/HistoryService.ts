/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HistoryService {
    /**
     * Get history report
     * Returns a summary report of all streams with latest metric values
     * @param duration Time window
     * @returns any history report
     * @throws ApiError
     */
    public static getHistoryReport(
        duration: string = '24h',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/history/report',
            query: {
                'duration': duration,
            },
        });
    }
    /**
     * Get stream history
     * Returns historical metric data points for a stream
     * @param name Stream name
     * @param type Metric type (messages, bytes)
     * @param duration Time window (1h, 6h, 24h, 7d)
     * @returns any stream history
     * @throws ApiError
     */
    public static getHistoryStreams(
        name: string,
        type: string = 'messages',
        duration: string = '24h',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/history/streams/{name}',
            path: {
                'name': name,
            },
            query: {
                'type': type,
                'duration': duration,
            },
        });
    }
    /**
     * Get stream metric analysis
     * Returns statistical analysis (min/max/avg/trend) of a stream metric
     * @param name Stream name
     * @param type Metric type (messages, bytes)
     * @param duration Time window (1h, 6h, 24h, 7d)
     * @returns any metric analysis
     * @throws ApiError
     */
    public static getHistoryStreamsAnalysis(
        name: string,
        type: string = 'messages',
        duration: string = '24h',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/history/streams/{name}/analysis',
            path: {
                'name': name,
            },
            query: {
                'type': type,
                'duration': duration,
            },
        });
    }
}
