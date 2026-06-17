import { useState, useCallback, useRef, useEffect } from "react";
import { detectMessageFormat } from "../utils/formatters";
import { LIMITS } from "../utils/constants";

export interface Message {
  subject: string;
  data: string;
  data_base64: string;
  reply?: string;
  headers?: Record<string, string[]>;
  timestamp: number;
  size: number;
}

export interface MessageFormat {
  type: "json" | "text" | "binary" | "hex";
  view: "pretty" | "raw" | "hex";
}

interface UseMessageListOptions {
  /**
   * Maximum number of messages to keep
   * @default 1000
   */
  maxMessages?: number;

  /**
   * Enable auto-scroll to bottom on new messages
   * @default true
   */
  autoScroll?: boolean;
}

interface UseMessageListReturn {
  /**
   * List of messages
   */
  messages: Message[];

  /**
   * Map of message formats by timestamp
   */
  messageFormats: Map<number, MessageFormat["type"]>;

  /**
   * Set of expanded message timestamps
   */
  expandedMessages: Set<number>;

  /**
   * Map of view modes by timestamp
   */
  viewModes: Map<number, MessageFormat["view"]>;

  /**
   * Add a message to the list
   */
  addMessage: (message: Message) => void;

  /**
   * Clear all messages
   */
  clearMessages: () => void;

  /**
   * Toggle message expansion
   */
  toggleExpand: (timestamp: number) => void;

  /**
   * Cycle view mode for a message
   */
  cycleViewMode: (timestamp: number) => void;

  /**
   * Ref for auto-scroll target
   */
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for managing message list state
 */
export function useMessageList(
  options: UseMessageListOptions = {},
): UseMessageListReturn {
  const { maxMessages = LIMITS.MAX_MESSAGES_IN_LIST, autoScroll = true } =
    options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageFormats, setMessageFormats] = useState<
    Map<number, MessageFormat["type"]>
  >(new Map());
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set(),
  );
  const [viewModes, setViewModes] = useState<
    Map<number, MessageFormat["view"]>
  >(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Add a message to the list
  const addMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        const updated = [...prev, message];

        // Trim to max size
        if (updated.length > maxMessages) {
          return updated.slice(-maxMessages);
        }

        return updated;
      });

      // Detect and store format
      const format = detectMessageFormat(message.data);
      setMessageFormats((prev) => new Map(prev).set(message.timestamp, format));
    },
    [maxMessages],
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setExpandedMessages(new Set());
  }, []);

  // Toggle message expansion
  const toggleExpand = useCallback((timestamp: number) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(timestamp)) {
        newSet.delete(timestamp);
      } else {
        newSet.add(timestamp);
      }

      return newSet;
    });
  }, []);

  // Cycle view mode for a message
  const cycleViewMode = useCallback((timestamp: number) => {
    setViewModes((prev) => {
      const current = prev.get(timestamp) || "pretty";
      const modes: MessageFormat["view"][] = ["pretty", "raw", "hex"];
      const currentIndex = modes.indexOf(current);
      const next = modes[(currentIndex + 1) % modes.length];

      return new Map(prev).set(timestamp, next);
    });
  }, []);

  return {
    messages,
    messageFormats,
    expandedMessages,
    viewModes,
    addMessage,
    clearMessages,
    toggleExpand,
    cycleViewMode,
    messagesEndRef,
  };
}
