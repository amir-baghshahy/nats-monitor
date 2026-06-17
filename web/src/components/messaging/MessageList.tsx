import { MessageSquare, Trash2, CheckCircle, Zap } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import MessageItem from "./MessageItem";
import type { Message, MessageFormat } from "../../hooks/useMessageList";

interface MessageListProps {
  /**
   * List of messages to display
   */
  messages: Message[];

  /**
   * Map of expanded message timestamps
   */
  expandedMessages: Set<number>;

  /**
   * Map of view modes by timestamp
   */
  viewModes: Map<number, MessageFormat["view"]>;

  /**
   * Map of message formats by timestamp
   */
  messageFormats: Map<number, MessageFormat["type"]>;

  /**
   * SSE connection status
   */
  sseConnected: boolean;

  /**
   * Auto-scroll enabled
   */
  autoScroll: boolean;

  /**
   * Ref for scroll target
   */
  messagesEndRef: React.RefObject<HTMLDivElement>;

  /**
   * Toggle expansion callback
   */
  onToggleExpand: (timestamp: number) => void;

  /**
   * Cycle view mode callback
   */
  onCycleViewMode: (timestamp: number) => void;

  /**
   * Copy message callback
   */
  onCopyMessage: (message: Message) => void;

  /**
   * Clear messages callback
   */
  onClearMessages: () => void;

  /**
   * Toggle auto-scroll callback
   */
  onToggleAutoScroll: () => void;

  /**
   * Maximum displayed messages
   * @default 50
   */
  maxDisplayed?: number;
}

/**
 * MessageList displays a list of NATS messages with controls
 */
export default function MessageList({
  messages,
  expandedMessages,
  viewModes,
  messageFormats,
  sseConnected,
  autoScroll,
  messagesEndRef,
  onToggleExpand,
  onCycleViewMode,
  onCopyMessage,
  onClearMessages,
  onToggleAutoScroll,
  maxDisplayed = 50,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Messages Yet"
        description="Subscribe to a subject or publish a message to get started."
      />
    );
  }

  // Reverse messages to show newest first, and limit displayed
  const displayedMessages = [...messages].reverse().slice(0, maxDisplayed);

  return (
    <div className="card overflow-hidden p-0">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg rounded-lg border border-dark-border">
          {sseConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">SSE Connected</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Polling</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoScroll}
            className={`px-4 py-2 rounded-lg transition-colors ${
              autoScroll ? "bg-green-500/20 text-green-400" : "hover:bg-dark-bg"
            }`}
          >
            Auto-scroll: {autoScroll ? "On" : "Off"}
          </button>

          <button
            onClick={onClearMessages}
            className="btn-secondary flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="divide-y divide-dark-border max-h-[60vh] overflow-y-auto">
        {displayedMessages.map((message) => {
          const timestamp = message.timestamp;
          const isExpanded = expandedMessages.has(timestamp);
          const viewMode = viewModes.get(timestamp) || "pretty";
          const format =
            (messageFormats.get(timestamp) || "text") === "hex"
              ? "text"
              : ((messageFormats.get(timestamp) || "text") as
                  | "json"
                  | "binary"
                  | "text");

          return (
            <MessageItem
              key={timestamp}
              message={message}
              isExpanded={isExpanded}
              viewMode={viewMode}
              format={format}
              onToggleExpand={() => onToggleExpand(timestamp)}
              onCycleViewMode={() => onCycleViewMode(timestamp)}
              onCopy={() => onCopyMessage(message)}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message count indicator */}
      {messages.length > maxDisplayed && (
        <div className="p-3 bg-dark-bg border-t border-dark-border text-center text-sm text-dark-muted">
          Showing {maxDisplayed} of {messages.length} messages (oldest{" "}
          {messages.length - maxDisplayed} hidden)
        </div>
      )}
    </div>
  );
}
