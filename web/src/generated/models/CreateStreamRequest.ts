/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateStreamRequest = {
    max_age?: string;
    max_bytes?: number;
    name: string;
    replicas?: number;
    retention?: CreateStreamRequest.retention;
    storage: CreateStreamRequest.storage;
    subjects: Array<string>;
};
export namespace CreateStreamRequest {
    export enum retention {
        LIMITS = 'limits',
        INTEREST = 'interest',
        WORKQUEUE = 'workqueue',
    }
    export enum storage {
        FILE = 'file',
        MEMORY = 'memory',
    }
}

