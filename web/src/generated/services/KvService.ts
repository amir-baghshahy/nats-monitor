/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KVBucketCreateResponse } from '../models/KVBucketCreateResponse';
import type { KVBucketDeleteResponse } from '../models/KVBucketDeleteResponse';
import type { KVBucketInfo } from '../models/KVBucketInfo';
import type { KVKeyDeleteResponse } from '../models/KVKeyDeleteResponse';
import type { KVKeyEntry } from '../models/KVKeyEntry';
import type { KVKeyHistoryEntry } from '../models/KVKeyHistoryEntry';
import type { KVKeyPutResponse } from '../models/KVKeyPutResponse';
import type { KVPurgeResponse } from '../models/KVPurgeResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class KvService {
    /**
     * List KV buckets
     * Returns all JetStream Key-Value store buckets
     * @returns KVBucketInfo OK
     * @throws ApiError
     */
    public static getKvBuckets(): CancelablePromise<Array<KVBucketInfo>> {
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
     * @param request Bucket configuration
     * @returns KVBucketCreateResponse Created
     * @throws ApiError
     */
    public static postKvBuckets(
        request: any,
    ): CancelablePromise<KVBucketCreateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/kv/buckets',
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a KV bucket
     * Returns detailed information about a single KV bucket
     * @param name Bucket name
     * @returns KVBucketInfo OK
     * @throws ApiError
     */
    public static getKvBuckets1(
        name: string,
    ): CancelablePromise<KVBucketInfo> {
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
     * Delete a KV bucket
     * Deletes a JetStream Key-Value store bucket
     * @param name Bucket name
     * @returns KVBucketDeleteResponse OK
     * @throws ApiError
     */
    public static deleteKvBuckets(
        name: string,
    ): CancelablePromise<KVBucketDeleteResponse> {
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
     * Get KV key history
     * Returns the revision history of a single key in a KV bucket
     * @param name Bucket name
     * @param key Key name
     * @returns KVKeyHistoryEntry OK
     * @throws ApiError
     */
    public static getKvBucketsHistory(
        name: string,
        key: string,
    ): CancelablePromise<Array<KVKeyHistoryEntry>> {
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
     * Get a KV key
     * Returns the value and revision of a single key in a KV bucket
     * @param name Bucket name
     * @param key Key name
     * @returns KVKeyEntry OK
     * @throws ApiError
     */
    public static getKvBucketsKey(
        name: string,
        key: string,
    ): CancelablePromise<KVKeyEntry> {
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
     * @param request Key/value to write
     * @returns KVKeyPutResponse OK
     * @throws ApiError
     */
    public static putKvBucketsKey(
        name: string,
        request: any,
    ): CancelablePromise<KVKeyPutResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/kv/buckets/{name}/key',
            path: {
                'name': name,
            },
            body: request,
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
     * @returns KVKeyDeleteResponse OK
     * @throws ApiError
     */
    public static deleteKvBucketsKey(
        name: string,
        key: string,
    ): CancelablePromise<KVKeyDeleteResponse> {
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
     * List keys in a KV bucket
     * Returns all keys (with values and revisions) in a KV bucket
     * @param name Bucket name
     * @returns KVKeyEntry OK
     * @throws ApiError
     */
    public static getKvBucketsKeys(
        name: string,
    ): CancelablePromise<Array<KVKeyEntry>> {
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
     * @returns KVPurgeResponse OK
     * @throws ApiError
     */
    public static postKvBucketsPurge(
        name: string,
    ): CancelablePromise<KVPurgeResponse> {
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
