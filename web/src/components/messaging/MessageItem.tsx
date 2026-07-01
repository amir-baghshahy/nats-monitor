import { useTranslation } from 'react-i18next';
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
import type { Message } from "../../hooks/useMessageList";
import { FORMAT_COLORS } from "../../utils/constants";

interface MessageItemProps {
  message: Message;
  isExpanded: boolean;
  viewMode: "pretty" | "raw" | "hex";
  format: "json" | "binary" | "text";
  onToggleExpand: () => void;
  onCycleViewMode: () => void;
  onCopy: () => void;
}

export default function MessageItem({
  message,
  isExpanded,
  viewMode,
  format,
  onToggleExpand,
  onCycleViewMode,
  onCopy,
}: MessageItemProps) {
  const { t } = useTranslation();

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

  const nextViewModeLabel =
    viewMode === "pretty"
      ? t('messages.raw')
      : viewMode === "raw"
        ? t('messages.hex')
        : t('messages.pretty');

    return (
    <div className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors">
      <div className="p-4 hover:bg-dark-bg/50 transition-colors">
        <div className="flex items-start gap-4">
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-dark-bg rounded transition-colors mt-0.5"
            aria-label={isExpanded ? t('messages.collapse') : t('messages.expand')}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-dark-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-dark-muted" />
            )}
          </button>

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
                  {t('messages.replyLabel')} {message.reply}
                </span>
              )}
            </div>

            <div className="text-sm text-dark-muted truncate font-mono">
              {formattedData.substring(0, 100)}...
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCycleViewMode}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-xs"
              title={`${t('messages.viewMode')}: ${viewMode}`}
            >
              {viewMode === "pretty"
                ? t('messages.pretty')
                : viewMode === "raw"
                  ? t('messages.raw')
                  : t('messages.hex')}
            </button>

            <button
              onClick={onCopy}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              title={t('messages.copyMessage')}
            >
              <Copy className="w-4 h-4 text-dark-muted" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pl-8 space-y-4">
            <div className="bg-dark-bg/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  {t('messages.payload')} ({format.toUpperCase()})
                </h4>
                <button
                  onClick={onCycleViewMode}
                  className="text-xs text-primary-400 hover:underline"
                >
                  {t('messages.switchTo')} {nextViewModeLabel}
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

            {message.headers && Object.keys(message.headers).length > 0 && (
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('messages.headers')}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">{t('messages.subject')}</p>
                <p className="font-mono text-sm truncate">{message.subject}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">{t('common.size')}</p>
                <p className="text-sm">{formatBytes(message.size)}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">{t('messages.timestamp')}</p>
                <p className="text-sm">{formatTimestamp(message.timestamp)}</p>
              </div>
              {message.reply && (
                <div className="bg-dark-bg/50 rounded-lg p-3">
                  <p className="text-xs text-dark-muted">{t('messages.replyTo')}</p>
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
