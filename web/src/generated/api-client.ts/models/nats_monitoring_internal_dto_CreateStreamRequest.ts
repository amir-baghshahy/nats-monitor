/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type nats_monitoring_internal_dto_CreateStreamRequest = {
    max_age?: string;
    max_bytes?: number;
    name: string;
    replicas?: number;
    retention?: nats_monitoring_internal_dto_CreateStreamRequest.retention;
    storage: nats_monitoring_internal_dto_CreateStreamRequest.storage;
    subjects: Array<string>;
};
export namespace nats_monitoring_internal_dto_CreateStreamRequest {
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

