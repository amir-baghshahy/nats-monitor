import {
  RefreshCw,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Code,
  Clock,
  Copy as CopyIcon,
  Check,
  Maximize2,
  MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import EmptyState from "../../../components/ui/EmptyState";
import PanelCard from "../../../components/ui/PanelCard";
import { Button } from "../../../components/ui";
import { formatBytes } from "../../../utils/formatters";

interface Message {
  sequence: number;
  subject: string;
  data: any;
  size: number;
  timestamp: string;
  headers?: Record<string, string[]>;
}

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  selected: Set<number>;
  viewMode: "list" | "grid";
  expanded: Set<number>;
  copiedMessage: number | null;
  isDeletePending: boolean;
  onSelectAll: () => void;
  onToggleSelection: (sequence: number) => void;
  onToggleExpand: (sequence: number) => void;
  onCopy: (data: string, sequence: number) => void;
  onDelete: (sequence: number) => void;
  setViewMode: (mode: "list" | "grid") => void;
}

const MAX_DISPLAY_PAYLOAD_SIZE = 50 * 1024; // 50 KB

const decoder = new TextDecoder();

const parseMessageData = (data: any): string => {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return decoder.decode(new Uint8Array(data));
  return JSON.stringify(data, null, 2);
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
};

export default function MessagesList({
  messages,
  isLoading,
  selected,
  viewMode,
  expanded,
  copiedMessage,
  isDeletePending,
  onSelectAll,
  onToggleSelection,
  onToggleExpand,
  onCopy,
  onDelete,
  setViewMode,
}: MessagesListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <PanelCard>
        <div className="p-6 text-center text-dark-muted">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          {t('common.loading')}
        </div>
      </PanelCard>
    );
  }

  if (messages.length === 0) {
    return (
      <PanelCard>
        <EmptyState
          icon={MessageSquare}
          title={t('messages.noMessagesYet')}
          description={t('messages.noMessagesYetDescription')}
        />
      </PanelCard>
    );
  }

  return (
    <PanelCard
      maxHeight={600}
      header={
        <div className="bg-dark-bg border-b border-dark-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selected.size === messages.length && messages.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-dark-muted">
                {selected.size > 0
                  ? `${selected.size} ${t('common.selected')}`
                  : `${messages.length} ${t('messages.messageCount', { count: messages.length })}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-primary-500/20 text-primary-400"
                    : "hover:bg-dark-bg"
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary-500/20 text-primary-400"
                    : "hover:bg-dark-bg"
                }`}
              >
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      }
      footer={
        <span>{t('messages.messageCount', { count: messages.length })}</span>
      }
    >

      {/* Messages */}
      <div className="overflow-y-auto scrollbar-thin flex-1 divide-y divide-dark-border">
        {messages.map((message, index) => {
          const sequence = message.sequence;
          const isExpanded = expanded.has(sequence);
          const isSelected = selected.has(sequence);
          const messageData = parseMessageData(message.data);
          const headers = message.headers || {};
          const delayClass = index === 0 ? "" : `animate-delay-${Math.min(index * 50, 500)}`;

          return (
            <div
              key={sequence}
              className={`border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors animate-slide-in animate-duration-200 ${delayClass}`}
            >
              <div className="p-4 hover:bg-dark-bg/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(sequence)}
                    className="w-4 h-4 rounded mt-1"
                  />

                  {/* Expand Button */}
                  <button
                    onClick={() => onToggleExpand(sequence)}
                    className="p-1 hover:bg-dark-bg rounded transition-colors mt-0.5"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-dark-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-dark-muted" />
                    )}
                  </button>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-primary-400">
                        #{sequence}
                      </span>
                      <span className="text-sm font-medium">{message.subject}</span>
                      <span className="text-xs text-dark-muted">
                        {formatBytes(message.size || 0)}
                      </span>
                      <span className="text-xs text-dark-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-dark-muted truncate">
                      {messageData.substring(0, 100)}...
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleExpand(sequence)}
                      className="p-2 hover:bg-dark-bg rounded-lg hover-lift active-scale"
                      title={t('messages.viewFullMessage')}
                    >
                      <Eye className="w-4 h-4 text-dark-muted" />
                    </button>
                    <button
                      onClick={() => onCopy(messageData, sequence)}
                      className="p-2 hover:bg-dark-bg rounded-lg hover-lift active-scale"
                      title={t('messages.copyMessage')}
                    >
                      {copiedMessage === sequence ? (
                        <Check className="w-4 h-4 text-green- animate-bounce-in" />
                      ) : (
                        <CopyIcon className="w-4 h-4 text-dark-muted" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(sequence)}
                      disabled={isDeletePending}
                      className="p-2 hover:bg-red-500/20 rounded-lg hover-lift active-scale text-status-error"
                      title={t('messages.deleteMessage')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pl-8 space-y-4 animate-fade-in-down">
                    {/* Headers */}
                    <div className="bg-dark-bg/50 rounded-lg p-4 hover-scale">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {t('messages.headers')}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(headers).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="text-dark-muted mr-2">{key}:</span>
                            <span className="font-mono text-xs">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payload */}
                    <div className="bg-dark-bg/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          {t('messages.payload')}
                        </h4>
                        <button
                          onClick={() => onToggleExpand(sequence)}
                          className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          {t('messages.collapse')}
                        </button>
                      </div>
                      <pre className="text-sm bg-dark-bg p-3 rounded overflow-x-auto">
                        <code className="text-green-400">
                          {messageData.length > MAX_DISPLAY_PAYLOAD_SIZE
                            ? messageData.slice(0, MAX_DISPLAY_PAYLOAD_SIZE) +
                              t('messages.truncated')
                            : messageData}
                        </code>
                      </pre>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-dark-bg/50 rounded-lg p-3">
                        <p className="text-xs text-dark-muted">{t('messages.sequence')}</p>
                        <p className="font-mono text-sm">{sequence.toLocaleString()}</p>
                      </div>
                      <div className="bg-dark-bg/50 rounded-lg p-3">
                        <p className="text-xs text-dark-muted">{t('messages.timestamp')}</p>
                        <p className="text-sm">
                          {new Date(message.timestamp || Date.now()).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-dark-bg/50 rounded-lg p-3">
                        <p className="text-xs text-dark-muted">{t('common.size')}</p>
                        <p className="text-sm">{formatBytes(message.size || 0)}</p>
                      </div>
                      <div className="bg-dark-bg/50 rounded-lg p-3">
                        <p className="text-xs text-dark-muted">{t('messages.subject')}</p>
                        <p className="text-sm font-mono truncate">{message.subject}</p>
                      </div>
                    </div>

                    {/* Actions */}
                     <div className="flex items-center gap-3 pt-2">
                       <Button variant="secondary" size="sm" onClick={() => onCopy(messageData, sequence)}>
                         {copiedMessage === sequence ? (
                           <>
                              <Check className="w-3 h-3" /> {t('messages.copied')}
                           </>
                         ) : (
                           t('messages.copyPayload')
                         )}
                       </Button>
                       <Button
                         variant="secondary"
                         size="sm"
                         className="text-status-error"
                         onClick={() => onDelete(sequence)}
                         disabled={isDeletePending}
                       >
                         {t('common.delete')}
                       </Button>
                     </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}
