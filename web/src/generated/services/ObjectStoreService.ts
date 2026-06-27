/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateBucketRequest } from '../models/CreateBucketRequest';
import type { GetObjectInfoResponse } from '../models/GetObjectInfoResponse';
import type { GetObjectResponse } from '../models/GetObjectResponse';
import type { ObjectStoreBucket } from '../models/ObjectStoreBucket';
import type { ObjectStoreKeysResponse } from '../models/ObjectStoreKeysResponse';
import type { PutObjectRequest } from '../models/PutObjectRequest';
import type { PutObjectResponse } from '../models/PutObjectResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ObjectStoreService {
    /**
     * List object store buckets
     * @returns ObjectStoreBucket OK
     * @throws ApiError
     */
    public static getObjectStoreBuckets(): CancelablePromise<Array<ObjectStoreBucket>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/object-store/buckets',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create object store bucket
     * @param request Bucket configuration
     * @returns ObjectStoreBucket Created
     * @throws ApiError
     */
    public static postObjectStoreBuckets(
        request: CreateBucketRequest,
    ): CancelablePromise<ObjectStoreBucket> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/object-store/buckets',
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get object store bucket info
     * @param name Bucket name
     * @returns ObjectStoreBucket OK
     * @throws ApiError
     */
    public static getObjectStoreBuckets1(
        name: string,
    ): CancelablePromise<ObjectStoreBucket> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/object-store/buckets/{name}',
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
     * Delete object store bucket
     * @param name Bucket name
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteObjectStoreBuckets(
        name: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/object-store/buckets/{name}',
            path: {
                'name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List object store keys
     * @param name Bucket name
     * @returns ObjectStoreKeysResponse OK
     * @throws ApiError
     */
    public static getObjectStoreBucketsKeys(
        name: string,
    ): CancelablePromise<ObjectStoreKeysResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/object-store/buckets/{name}/keys',
            path: {
                'name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get object from bucket
     * @param name Bucket name
     * @param key Object key
     * @returns GetObjectResponse OK
     * @throws ApiError
     */
    public static getObjectStoreBucketsKeys1(
        name: string,
        key: string,
    ): CancelablePromise<GetObjectResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/object-store/buckets/{name}/keys/{key}',
            path: {
                'name': name,
                'key': key,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Put object in bucket
     * @param name Bucket name
     * @param key Object key
     * @param request Object data
     * @returns PutObjectResponse OK
     * @throws ApiError
     */
    public static putObjectStoreBucketsKeys(
        name: string,
        key: string,
        request: PutObjectRequest,
    ): CancelablePromise<PutObjectResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/object-store/buckets/{name}/keys/{key}',
            path: {
                'name': name,
                'key': key,
            },
            body: request,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete object from bucket
     * @param name Bucket name
     * @param key Object key
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteObjectStoreBucketsKeys(
        name: string,
        key: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/object-store/buckets/{name}/keys/{key}',
            path: {
                'name': name,
                'key': key,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get object metadata
     * @param name Bucket name
     * @param key Object key
     * @returns GetObjectInfoResponse OK
     * @throws ApiError
     */
    public static getObjectStoreBucketsKeysInfo(
        name: string,
        key: string,
    ): CancelablePromise<GetObjectInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/object-store/buckets/{name}/keys/{key}/info',
            path: {
                'name': name,
                'key': key,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
