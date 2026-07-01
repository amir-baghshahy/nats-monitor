import { useEffect, useRef, useCallback } from "react";
import type { Message } from "./useMessageList";

interface UseNATSSubscriptionOptions {
  /**
   * Callback when a new message arrives
   */
  onMessage?: (message: Message) => void;

  /**
   * Callback when connection status changes
   */
  onStatusChange?: (connected: boolean) => void;

  /**
   * Callback on error
   */
  onError?: (error: Event) => void;
}

interface UseNATSSubscriptionReturn {
  /**
   * Subscribe to a NATS subject
   */
  subscribe: (subject: string) => void;

  /**
   * Unsubscribe from a NATS subject
   */
  unsubscribe: (subject: string) => void;

  /**
   * Check if subscribed to a subject
   */
  isSubscribed: (subject: string) => boolean;

  /**
   * Get all active subscriptions
   */
  getSubscriptions: () => string[];

  /**
   * Unsubscribe from all subjects
   */
  unsubscribeAll: () => void;
}

/**
 * Hook for managing NATS SSE subscriptions
 * Replaces the global window.__sse_sources pattern
 */
export function useNATSSubscription(
  options: UseNATSSubscriptionOptions = {},
): UseNATSSubscriptionReturn {
  const { onMessage, onStatusChange, onError } = options;

  // Store callbacks in refs so subscribe/unsubscribe never need to be
  // recreated when the caller passes new function references each render.
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with the latest props without causing re-renders.
  onMessageRef.current = onMessage;
  onStatusChangeRef.current = onStatusChange;
  onErrorRef.current = onError;

  // Store EventSources in a ref to avoid re-renders
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const subscriptionsRef = useRef<Set<string>>(new Set());

  // Cleanup function
  const cleanup = useCallback(() => {
    eventSourcesRef.current.forEach((source) => {
      source.close();
    });
    eventSourcesRef.current.clear();
    subscriptionsRef.current.clear();
  }, []);

  // Subscribe to a subject
  const subscribe = useCallback(
    (subject: string) => {
      if (subscriptionsRef.current.has(subject)) {
        return; // Already subscribed
      }

      try {
        const eventSource = new EventSource(
          `/api/core/subscribe?subject=${encodeURIComponent(subject)}`,
        );

        eventSource.onopen = () => {
          onStatusChangeRef.current?.(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Skip connection messages
            if (data.type === "connected") {
              return;
            }

            const message: Message = data;
            onMessageRef.current?.(message);
          } catch (err) {
            console.error("Failed to parse SSE message:", err);
          }
        };

        eventSource.onerror = (error) => {
          onStatusChangeRef.current?.(false);
          onErrorRef.current?.(error);
          eventSource.close();
          subscriptionsRef.current.delete(subject);
          eventSourcesRef.current.delete(subject);
        };

        eventSourcesRef.current.set(subject, eventSource);
        subscriptionsRef.current.add(subject);
      } catch (err) {
        console.error("Failed to create EventSource:", err);
        onErrorRef.current?.(err as Event);
      }
    },
    [],
  );

  // Unsubscribe from a subject
  const unsubscribe = useCallback((subject: string) => {
    const source = eventSourcesRef.current.get(subject);
    if (source) {
      source.close();
      eventSourcesRef.current.delete(subject);
      subscriptionsRef.current.delete(subject);
      onStatusChangeRef.current?.(false);
    }
  }, []);

  // Check if subscribed
  const isSubscribed = useCallback((subject: string): boolean => {
    return subscriptionsRef.current.has(subject);
  }, []);

  // Get all subscriptions
  const getSubscriptions = useCallback((): string[] => {
    return Array.from(subscriptionsRef.current);
  }, []);

  // Unsubscribe from all
  const unsubscribeAll = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    subscribe,
    unsubscribe,
    isSubscribed,
    getSubscriptions,
    unsubscribeAll,
  };
}
