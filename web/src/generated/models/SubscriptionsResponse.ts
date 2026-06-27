/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActiveSubscription } from './ActiveSubscription';
export type SubscriptionsResponse = {
    connected?: boolean;
    count?: number;
    server?: string;
    status?: string;
    subscriptions?: Array<ActiveSubscription>;
};

