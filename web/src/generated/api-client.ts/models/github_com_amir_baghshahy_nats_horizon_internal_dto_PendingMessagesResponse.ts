/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessage } from './github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessage';
export type github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessagesResponse = {
    consumer?: string;
    messages?: Array<github_com_amir_baghshahy_nats_horizon_internal_dto_PendingMessage>;
    num_ack_pending?: number;
    num_pending?: number;
    stream?: string;
};

