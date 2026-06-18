/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { internal_handlers_AlertCondition } from './internal_handlers_AlertCondition';
import type { internal_handlers_AlertSeverity } from './internal_handlers_AlertSeverity';
import type { time_Duration } from './time_Duration';
export type internal_handlers_Alert = {
    /**
     * Notification channels: "email", "webhook", "slack"
     */
    channels?: Array<string>;
    condition?: internal_handlers_AlertCondition;
    cooldown?: time_Duration;
    created_at?: string;
    description?: string;
    enabled?: boolean;
    id?: string;
    last_trigger?: string;
    name?: string;
    severity?: internal_handlers_AlertSeverity;
    trigger_count?: number;
    updated_at?: string;
};

