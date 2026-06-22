/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type github_com_amir_baghshahy_nats_horizon_internal_dto_CreateStreamRequest = {
    max_age?: string;
    max_bytes?: number;
    name: string;
    replicas?: number;
    retention?: github_com_amir_baghshahy_nats_horizon_internal_dto_CreateStreamRequest.retention;
    storage: github_com_amir_baghshahy_nats_horizon_internal_dto_CreateStreamRequest.storage;
    subjects: Array<string>;
};
export namespace github_com_amir_baghshahy_nats_horizon_internal_dto_CreateStreamRequest {
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

