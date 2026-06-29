/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertCondition } from './AlertCondition';
import type { AlertSeverity } from './AlertSeverity';
import type { Duration } from './Duration';
export type Alert = {
    /**
     * Notification channels: "email", "webhook", "slack"
     */
    channels?: Array<string>;
    /**
     * Email address for email notifications
     */
    emailAddress?: string;
    /**
     * Webhook URL for webhook notifications
     */
    webhookUrl?: string;
    /**
     * Slack webhook URL for Slack notifications
     */
    slackWebhookUrl?: string;
    condition?: AlertCondition;
    cooldown?: Duration;
    created_at?: string;
    description?: string;
    enabled?: boolean;
    id?: string;
    last_trigger?: string;
    name?: string;
    severity?: AlertSeverity;
    trigger_count?: number;
    updated_at?: string;
};

