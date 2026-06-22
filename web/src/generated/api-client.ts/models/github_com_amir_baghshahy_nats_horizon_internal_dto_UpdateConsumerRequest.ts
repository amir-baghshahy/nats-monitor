/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest = {
    ack_policy?: github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest.ack_policy;
    deliver_policy?: github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest.deliver_policy;
    max_deliver?: number;
    replay_policy?: github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest.replay_policy;
};
export namespace github_com_amir_baghshahy_nats_horizon_internal_dto_UpdateConsumerRequest {
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

