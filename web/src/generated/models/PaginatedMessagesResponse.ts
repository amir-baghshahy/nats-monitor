/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StreamMessage } from './StreamMessage';
export type PaginatedMessagesResponse = {
    messages?: Array<StreamMessage>;
    page?: number;
    page_size?: number;
    stream?: string;
    total?: number;
};

