/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { nats_monitoring_internal_dto_ActiveSubscription } from './nats_monitoring_internal_dto_ActiveSubscription';
export type nats_monitoring_internal_dto_SubscriptionsResponse = {
    connected?: boolean;
    count?: number;
    server?: string;
    status?: string;
    subscriptions?: Array<nats_monitoring_internal_dto_ActiveSubscription>;
};

