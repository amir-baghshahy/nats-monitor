/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type nats_monitoring_internal_dto_UpdateConsumerRequest = {
    ack_policy?: nats_monitoring_internal_dto_UpdateConsumerRequest.ack_policy;
    deliver_policy?: nats_monitoring_internal_dto_UpdateConsumerRequest.deliver_policy;
    max_deliver?: number;
    replay_policy?: nats_monitoring_internal_dto_UpdateConsumerRequest.replay_policy;
};
export namespace nats_monitoring_internal_dto_UpdateConsumerRequest {
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

