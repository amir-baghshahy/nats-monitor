/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PendingMessage } from './PendingMessage';
export type PendingMessagesResponse = {
    consumer?: string;
    messages?: Array<PendingMessage>;
    num_ack_pending?: number;
    num_pending?: number;
    stream?: string;
};

