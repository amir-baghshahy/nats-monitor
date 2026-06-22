/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { github_com_amir_baghshahy_nats_horizon_internal_dto_ActiveSubscription } from './github_com_amir_baghshahy_nats_horizon_internal_dto_ActiveSubscription';
export type github_com_amir_baghshahy_nats_horizon_internal_dto_SubscriptionsResponse = {
    connected?: boolean;
    count?: number;
    server?: string;
    status?: string;
    subscriptions?: Array<github_com_amir_baghshahy_nats_horizon_internal_dto_ActiveSubscription>;
};

