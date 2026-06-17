/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_PendingMessage } from './nats_monitoring_internal_dto_PendingMessage';
export type nats_monitoring_internal_dto_PendingMessagesResponse = {
    consumer?: string;
    messages?: Array<nats_monitoring_internal_dto_PendingMessage>;
    num_ack_pending?: number;
    num_pending?: number;
    stream?: string;
};

