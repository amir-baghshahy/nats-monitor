/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_StreamMessage } from './github_com_amir_baghshahy_nats_horizon_internal_dto_StreamMessage';
export type github_com_amir_baghshahy_nats_horizon_internal_dto_PaginatedMessagesResponse = {
    messages?: Array<github_com_amir_baghshahy_nats_horizon_internal_dto_StreamMessage>;
    page?: number;
    page_size?: number;
    stream?: string;
    total?: number;
};

