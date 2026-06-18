/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type internal_handlers_AlertCondition = {
    /**
     * Optional consumer filter
     */
    consumer?: string;
    /**
     * ">", "<", "=", ">=", "<="
     */
    operator?: string;
    /**
     * Optional stream filter
     */
    stream?: string;
    /**
     * Threshold value
     */
    threshold?: number;
    /**
     * "lag", "latency", "messages", "consumer_lag", "storage"
     */
    type?: string;
};

