import {
  Copy,
  Code,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  formatBytes,
  formatTimestamp,
  toHexString,
  formatJSON,
} from "../../utils/formatters";

export interface Message {
  subject: string;
  data: string;
  data_base64: string;
  reply?: string;
  headers?: Record<string, string[]>;
  timestamp: number;
  size: number;
}
import { FORMAT_COLORS } from "../../utils/constants";

interface MessageItemProps {
  /**
   * The message to display
   */
  message: Message;

  /**
   * Whether the message is expanded
   */
  isExpanded: boolean;

  /**
   * Current view mode
   */
  viewMode: "pretty" | "raw" | "hex";

  /**
   * Detected message format
   */
  format: "json" | "binary" | "text";

  /**
   * Toggle expansion callback
   */
  onToggleExpand: () => void;

  /**
   * Cycle view mode callback
   */
  onCycleViewMode: () => void;

  /**
   * Copy message callback
   */
  onCopy: () => void;
}

/**
 * MessageItem displays a single NATS message with expandable details
 */
export default function MessageItem({
  message,
  isExpanded,
  viewMode,
  format,
  onToggleExpand,
  onCycleViewMode,
  onCopy,
}: MessageItemProps) {
  // Format message data based on view mode
  const formatMessageData = (): string => {
    switch (viewMode) {
      case "hex":
        return toHexString(message.data);
      case "pretty":
        if (format === "json") {
          return formatJSON(message.data);
        }
        return message.data;
      case "raw":
      default:
        return message.data;
    }
  };

  const formattedData = formatMessageData();
  const formatColorClass =
    FORMAT_COLORS[format] || "bg-gray-500/20 text-gray-400";

  return (
    <div className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors">
      <div className="p-4 hover:bg-dark-bg/50 transition-colors">
        <div className="flex items-start gap-4">
          {/* Expand Button */}
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-dark-bg rounded transition-colors mt-0.5"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-dark-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-dark-muted" />
            )}
          </button>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-sm text-primary-400">
                {message.subject}
              </span>

              <span
                className={`text-xs px-2 py-0.5 rounded ${formatColorClass}`}
              >
                {format.toUpperCase()}
              </span>

              <span className="text-xs text-dark-muted">
                {formatBytes(message.size)}
              </span>

              <span className="text-xs text-dark-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(message.timestamp, { time: true })}
              </span>

              {message.reply && (
                <span className="text-xs text-primary-400">
                  → {message.reply}
                </span>
              )}
            </div>

            <div className="text-sm text-dark-muted truncate font-mono">
              {formattedData.substring(0, 100)}...
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCycleViewMode}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-xs"
              title={`View mode: ${viewMode}`}
            >
              {viewMode === "pretty"
                ? "Pretty"
                : viewMode === "raw"
                  ? "Raw"
                  : "Hex"}
            </button>

            <button
              onClick={onCopy}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              title="Copy message"
            >
              <Copy className="w-4 h-4 text-dark-muted" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pl-8 space-y-4">
            {/* Payload */}
            <div className="bg-dark-bg/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Payload ({format.toUpperCase()})
                </h4>
                <button
                  onClick={onCycleViewMode}
                  className="text-xs text-primary-400 hover:underline"
                >
                  Switch to{" "}
                  {viewMode === "pretty"
                    ? "Raw"
                    : viewMode === "raw"
                      ? "Hex"
                      : "Pretty"}
                </button>
              </div>
              <pre className={`text-sm p-3 rounded overflow-x-auto bg-dark-bg`}>
                <code
                  className={
                    format === "json"
                      ? "text-green-400"
                      : format === "binary"
                        ? "text-orange-400"
                        : "text-blue-400"
                  }
                >
                  {formattedData}
                </code>
              </pre>
            </div>

            {/* Headers */}
            {message.headers && Object.keys(message.headers).length > 0 && (
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Headers
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(message.headers).map(([key, values]) => (
                    <div key={key} className="flex">
                      <span className="text-dark-muted mr-2">{key}:</span>
                      <span className="font-mono text-xs">
                        {Array.isArray(values) ? values.join(", ") : values}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Subject</p>
                <p className="font-mono text-sm truncate">{message.subject}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Size</p>
                <p className="text-sm">{formatBytes(message.size)}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Timestamp</p>
                <p className="text-sm">{formatTimestamp(message.timestamp)}</p>
              </div>
              {message.reply && (
                <div className="bg-dark-bg/50 rounded-lg p-3">
                  <p className="text-xs text-dark-muted">Reply To</p>
                  <p className="font-mono text-sm truncate">{message.reply}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
