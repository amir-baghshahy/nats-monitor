/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExportService {
    /**
     * Export all streams
     * Exports a summary of all streams as JSON
     * @returns binary Exported streams summary
     * @throws ApiError
     */
    public static getExportStreams(): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/export/streams',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Export a stream
     * Exports stream data in the requested format (json, csv, txt)
     * @param name Stream name
     * @param format Export format (json, csv, txt)
     * @param includeMessages Include messages in the export
     * @returns binary Exported stream data
     * @throws ApiError
     */
    public static getExportStreams1(
        name: string,
        format: string = 'json',
        includeMessages?: boolean,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/export/streams/{name}',
            path: {
                'name': name,
            },
            query: {
                'format': format,
                'include_messages': includeMessages,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Export a consumer
     * Exports consumer data in the requested format (json, csv, txt)
     * @param name Stream name
     * @param consumer Consumer name
     * @param format Export format (json, csv, txt)
     * @returns binary Exported consumer data
     * @throws ApiError
     */
    public static getExportStreamsConsumers(
        name: string,
        consumer: string,
        format: string = 'json',
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/export/streams/{name}/consumers/{consumer}',
            path: {
                'name': name,
                'consumer': consumer,
            },
            query: {
                'format': format,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Export messages from a stream
     * Exports messages from a stream, optionally filtered by subject, as JSON
     * @param name Stream name
     * @param subject Filter subject
     * @param requestBody Export options
     * @returns binary Exported messages
     * @throws ApiError
     */
    public static postExportStreamsMessages(
        name: string,
        subject?: string,
        requestBody?: Record<string, any>,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/export/streams/{name}/messages',
            path: {
                'name': name,
            },
            query: {
                'subject': subject,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
