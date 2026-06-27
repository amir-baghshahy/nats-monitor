/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateConsumerRequest = {
    ack_policy?: UpdateConsumerRequest.ack_policy;
    deliver_policy?: UpdateConsumerRequest.deliver_policy;
    max_deliver?: number;
    replay_policy?: UpdateConsumerRequest.replay_policy;
};
export namespace UpdateConsumerRequest {
    export enum ack_policy {
        NONE = 'none',
        ALL = 'all',
        EXPLICIT = 'explicit',
    }
    export enum deliver_policy {
        ALL = 'all',
        LAST = 'last',
        NEW = 'new',
    }
    export enum replay_policy {
        INSTANT = 'instant',
        ORIGINAL = 'original',
    }
}

