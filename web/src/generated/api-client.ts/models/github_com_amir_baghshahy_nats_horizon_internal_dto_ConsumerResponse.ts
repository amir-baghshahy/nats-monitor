/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerConfigResponse } from './github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerConfigResponse';
export type github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerResponse = {
    ack_rate?: string;
    config?: github_com_amir_baghshahy_nats_horizon_internal_dto_ConsumerConfigResponse;
    lag?: number;
    name?: string;
    num_pending?: number;
    paused?: boolean;
    status?: string;
    stream?: string;
};

