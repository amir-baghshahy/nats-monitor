/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_KVBucketCreateResponse } from '../models/nats_monitoring_internal_dto_KVBucketCreateResponse';
import type { nats_monitoring_internal_dto_KVBucketDeleteResponse } from '../models/nats_monitoring_internal_dto_KVBucketDeleteResponse';
import type { nats_monitoring_internal_dto_KVBucketInfo } from '../models/nats_monitoring_internal_dto_KVBucketInfo';
import type { nats_monitoring_internal_dto_KVKeyDeleteResponse } from '../models/nats_monitoring_internal_dto_KVKeyDeleteResponse';
import type { nats_monitoring_internal_dto_KVKeyEntry } from '../models/nats_monitoring_internal_dto_KVKeyEntry';
import type { nats_monitoring_internal_dto_KVKeyHistoryEntry } from '../models/nats_monitoring_internal_dto_KVKeyHistoryEntry';
import type { nats_monitoring_internal_dto_KVKeyPutResponse } from '../models/nats_monitoring_internal_dto_KVKeyPutResponse';
import type { nats_monitoring_internal_dto_KVPurgeResponse } from '../models/nats_monitoring_internal_dto_KVPurgeResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class KvService {
    /**
     * List KV buckets
     * Returns all JetStream Key-Value store buckets
     * @returns nats_monitoring_internal_dto_KVBucketInfo OK
     * @throws ApiError
     */
    public static getKvBuckets(): CancelablePromise<Array<nats_monitoring_internal_dto_KVBucketInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/kv/buckets',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a KV bucket
     * Creates a new JetStream Key-Value store bucket
     * @param requestBody Bucket configuration
     * @returns nats_monitoring_internal_dto_KVBucketCreateResponse Created
     * @throws ApiError
     */
    public static postKvBuckets(
        requestBody: Record<string, any>,
    ): CancelablePromise<nats_monitoring_internal_dto_KVBucketCreateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/kv/buckets',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a KV bucket
     * Deletes a JetStream Key-Value store bucket
     * @param name Bucket name
     * @returns nats_monitoring_internal_dto_KVBucketDeleteResponse OK
     * @throws ApiError
     */
    public static deleteKvBuckets(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_KVBucketDeleteResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/kv/buckets/{name}',
            path: {
                'name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a KV bucket
     * Returns detailed information about a single KV bucket
     * @param name Bucket name
     * @returns nats_monitoring_internal_dto_KVBucketInfo OK
     * @throws ApiError
     */
    public static getKvBuckets1(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_KVBucketInfo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/kv/buckets/{name}',
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
     * Get KV key history
     * Returns the revision history of a single key in a KV bucket
     * @param name Bucket name
     * @param key Key name
     * @returns nats_monitoring_internal_dto_KVKeyHistoryEntry OK
     * @throws ApiError
     */
    public static getKvBucketsHistory(
        name: string,
        key: string,
    ): CancelablePromise<Array<nats_monitoring_internal_dto_KVKeyHistoryEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/kv/buckets/{name}/history',
            path: {
                'name': name,
            },
            query: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a KV key
     * Deletes a key from a KV bucket
     * @param name Bucket name
     * @param key Key name
     * @returns nats_monitoring_internal_dto_KVKeyDeleteResponse OK
     * @throws ApiError
     */
    public static deleteKvBucketsKey(
        name: string,
        key: string,
    ): CancelablePromise<nats_monitoring_internal_dto_KVKeyDeleteResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/kv/buckets/{name}/key',
            path: {
                'name': name,
            },
            query: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a KV key
     * Returns the value and revision of a single key in a KV bucket
     * @param name Bucket name
     * @param key Key name
     * @returns nats_monitoring_internal_dto_KVKeyEntry OK
     * @throws ApiError
     */
    public static getKvBucketsKey(
        name: string,
        key: string,
    ): CancelablePromise<nats_monitoring_internal_dto_KVKeyEntry> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/kv/buckets/{name}/key',
            path: {
                'name': name,
            },
            query: {
                'key': key,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Put a KV key
     * Creates or updates a key in a KV bucket
     * @param name Bucket name
     * @param requestBody Key/value to write
     * @returns nats_monitoring_internal_dto_KVKeyPutResponse OK
     * @throws ApiError
     */
    public static putKvBucketsKey(
        name: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<nats_monitoring_internal_dto_KVKeyPutResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/kv/buckets/{name}/key',
            path: {
                'name': name,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List keys in a KV bucket
     * Returns all keys (with values and revisions) in a KV bucket
     * @param name Bucket name
     * @returns nats_monitoring_internal_dto_KVKeyEntry OK
     * @throws ApiError
     */
    public static getKvBucketsKeys(
        name: string,
    ): CancelablePromise<Array<nats_monitoring_internal_dto_KVKeyEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/kv/buckets/{name}/keys',
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
     * Purge a KV bucket
     * Removes all deleted-key tombstones from a KV bucket
     * @param name Bucket name
     * @returns nats_monitoring_internal_dto_KVPurgeResponse OK
     * @throws ApiError
     */
    public static postKvBucketsPurge(
        name: string,
    ): CancelablePromise<nats_monitoring_internal_dto_KVPurgeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/kv/buckets/{name}/purge',
            path: {
                'name': name,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
