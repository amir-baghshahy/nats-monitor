import {
  ConsumersService,
  HealthService,
  MessagesService,
  StreamsService,
  ApiError,
} from "../types";
import type {
  github_com_amir_nats_monitor_internal_dto_PublishMessageRequest,
  github_com_amir_nats_monitor_internal_dto_PurgeStreamRequest,
  github_com_amir_nats_monitor_internal_dto_ReplayRequest,
  github_com_amir_nats_monitor_internal_dto_ResetLagRequest,
  github_com_amir_nats_monitor_internal_dto_UpdateStreamRequest,
} from "../types";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return typeof error.body?.error === "string" ? error.body.error : fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export async function resetConsumerLag(
  streamName: string,
  consumerName: string,
  targetSequence?: number,
): Promise<{ success: boolean; message: string; newSequence?: number }> {
  try {
    const payload: github_com_amir_nats_monitor_internal_dto_ResetLagRequest | undefined =
      targetSequence !== undefined ? { sequence: targetSequence } : undefined;

    const response = await ConsumersService.postStreamsConsumersLagReset(
      streamName,
      consumerName,
      payload,
    );

    return {
      success: true,
      message: "Lag reset successfully",
      newSequence: response.new_sequence,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to reset lag"),
    };
  }
}

export async function replayMessages(
  streamName: string,
  consumerName: string,
  options: {
    startSequence?: number;
    endSequence?: number;
    startTime?: Date;
    endTime?: Date;
    filter?: string;
  } = {},
): Promise<{ success: boolean; message: string; replayId?: string }> {
  try {
    const payload: github_com_amir_nats_monitor_internal_dto_ReplayRequest = {};

    if (options.startSequence) payload.start_seq = options.startSequence;
    if (options.endSequence) payload.end_seq = options.endSequence;
    if (options.startTime)
      payload.start_seq = Math.floor(options.startTime.getTime() / 1000);
    if (options.endTime)
      payload.end_seq = Math.floor(options.endTime.getTime() / 1000);
    if (options.filter) payload.filter_subject = options.filter;

    const response = await ConsumersService.postStreamsConsumersReplay(
      streamName,
      consumerName,
      payload,
    );

    return {
      success: true,
      message: "Message replay started",
      replayId: response.replay_id,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to start replay"),
    };
  }
}

export async function publishMessage(
  streamName: string,
  request: github_com_amir_nats_monitor_internal_dto_PublishMessageRequest,
): Promise<{ success: boolean; message: string }> {
  try {
    await MessagesService.postStreamsMessagesPublish(streamName, request);
    return {
      success: true,
      message: "Message published successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to publish message"),
    };
  }
}

export async function deleteMessage(
  streamName: string,
  sequence: number,
): Promise<{ success: boolean; message: string }> {
  try {
    await MessagesService.deleteStreamsMessages(streamName, String(sequence));
    return {
      success: true,
      message: `Message ${sequence} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to delete message"),
    };
  }
}

export async function purgeStream(
  streamName: string,
  filter?: {
    subject?: string;
    sequence?: number;
  },
): Promise<{ success: boolean; message: string; purgedCount?: number }> {
  try {
    const payload: github_com_amir_nats_monitor_internal_dto_PurgeStreamRequest | undefined =
      filter && (filter.subject || filter.sequence !== undefined)
        ? filter
        : undefined;

    const response = await StreamsService.postStreamsPurge(streamName, payload);

    return {
      success: true,
      message: response.message || "Stream purged successfully",
      purgedCount: response.remaining,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to purge stream"),
    };
  }
}

export async function deleteConsumer(
  streamName: string,
  consumerName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await ConsumersService.deleteStreamsConsumers(streamName, consumerName);
    return {
      success: true,
      message: `Consumer ${consumerName} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to delete consumer"),
    };
  }
}

export async function setConsumerState(
  streamName: string,
  consumerName: string,
  paused: boolean,
): Promise<{ success: boolean; message: string }> {
  try {
    if (paused) {
      await ConsumersService.postStreamsConsumersPause(
        streamName,
        consumerName,
      );
    } else {
      await ConsumersService.postStreamsConsumersResume(
        streamName,
        consumerName,
      );
    }

    return {
      success: true,
      message: paused ? "Consumer paused" : "Consumer resumed",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to update consumer state"),
    };
  }
}

export async function terminateConnection(
  connectionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await HealthService.deleteConnections(connectionId);
    return {
      success: true,
      message: "Connection terminated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to terminate connection"),
    };
  }
}

export async function deleteStream(
  streamName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await StreamsService.deleteStreams(streamName);
    return {
      success: true,
      message: `Stream ${streamName} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to delete stream"),
    };
  }
}

export async function updateStreamConfig(
  streamName: string,
  config: {
    subjects?: string[];
    retention?: string;
    max_age?: number;
    max_bytes?: number;
    max_msg_size?: number;
    replicas?: number;
    storage?: string;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    const payload: github_com_amir_nats_monitor_internal_dto_UpdateStreamRequest = {
      subjects: config.subjects,
      max_age:
        config.max_age !== undefined ? String(config.max_age) : undefined,
      max_bytes: config.max_bytes,
      replicas: config.replicas,
    };

    await StreamsService.putStreams(streamName, payload);
    return {
      success: true,
      message: "Stream configuration updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to update stream configuration"),
    };
  }
}
