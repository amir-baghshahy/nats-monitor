/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ConsumerConfigResponse } from './nats_monitoring_internal_dto_ConsumerConfigResponse';
export type nats_monitoring_internal_dto_ConsumerResponse = {
    ack_rate?: string;
    config?: nats_monitoring_internal_dto_ConsumerConfigResponse;
    lag?: number;
    name?: string;
    num_pending?: number;
    paused?: boolean;
    status?: string;
    stream?: string;
};

