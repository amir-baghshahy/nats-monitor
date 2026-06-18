import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessagesService, StreamsService } from "../types";
import type { github_com_amir_nats_monitor_internal_dto_StreamResponse as Stream } from "../types";
import {
  Search,
  Send,
  Trash2,
  Eye,
  RefreshCw,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Code,
  FileText,
  Clock,
  Copy as CopyIcon,
  Check,
} from "lucide-react";
import { deleteMessage } from "../utils/natsOperations";
import { useToast } from "../components/Toast";
import { useSSE } from "../hooks/useSSE";
import { CoreMessagingContent } from "./CoreMessaging";

const MAX_DISPLAY_PAYLOAD_SIZE = 50 * 1024; // 50 KB

const decoder = new TextDecoder();

// Defined outside the component so it is not re-created on every render
// and the decoder instance is reused instead of allocating one per message.
const parseMessageData = (data: any): string => {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return decoder.decode(new Uint8Array(data));
  return JSON.stringify(data, null, 2);
};

export default function Messages() {
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(
    new Set(),
  );
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set(),
  );
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeMessageTab, setActiveMessageTab] = useState<"stream" | "core">(
    "stream",
  );
  const [messagesPerPage, setMessagesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { connected: sseConnected } = useSSE("messages");

  const publishMutation = useMutation({
    mutationFn: (data: { stream: string; subject: string; data: string }) =>
      MessagesService.postStreamsMessagesPublish(data.stream, {
        subject: data.subject,
        payload: data.data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedStream] });
      setShowPublishModal(false);
      toast("success", "Message published");
    },
    onError: (err: any) =>
      toast("error", err.response?.data?.error || "Failed to publish"),
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: (sequence: number) => deleteMessage(selectedStream, sequence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedStream] });
    },
  });

  const copyMessage = async (data: string, sequence: number) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopiedMessage(sequence);
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const deleteSelectedMessages = async () => {
    if (!confirm(`Delete ${selectedMessages.size} message(s)?`)) return;
    for (const sequence of selectedMessages) {
      await deleteMutation.mutateAsync(sequence);
    }
    setSelectedMessages(new Set());
  };

  const { data: streams } = useQuery({
    queryKey: ["streams"],
    queryFn: () => StreamsService.getStreams(),
  });

  const streamList = streams || [];

  // Set default stream when streams are loaded — must be in useEffect to avoid
  // calling setState during render which causes an infinite re-render loop
  useEffect(() => {
    if (!selectedStream && streamList[0]?.config?.name) {
      setSelectedStream(streamList[0].config.name);
    }
  }, [streamList, selectedStream]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStream, messagesPerPage]);

  // Fetch messages from API — disable polling when SSE is active to avoid redundant requests
  const {
    data: messagesPage,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["messagesPage", selectedStream, currentPage, messagesPerPage],
    queryFn: () =>
      MessagesService.getMessagesPage(
        selectedStream,
        currentPage,
        messagesPerPage,
      ) as unknown as Promise<{
        messages: any[];
        total: number;
      }>,
    enabled: !!selectedStream,
    refetchInterval: sseConnected ? false : 5000,
  });

  const displayMessages = messagesPage?.messages || [];
  const totalMessages = messagesPage?.total || displayMessages.length;
  const totalPages = Math.max(1, Math.ceil(totalMessages / messagesPerPage));

  const toggleMessageSelection = (sequence: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(sequence)) {
      newSelected.delete(sequence);
    } else {
      newSelected.add(sequence);
    }
    setSelectedMessages(newSelected);
  };

  const toggleExpand = (sequence: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(sequence)) {
      newExpanded.delete(sequence);
    } else {
      newExpanded.add(sequence);
    }
    setExpandedMessages(newExpanded);
  };

  const toggleAll = () => {
    if (selectedMessages.size === displayMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(displayMessages.map((m: any) => m.sequence)));
    }
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

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Message Browser</h1>
          <p className="text-dark-muted mt-1">
            View, publish, and manage stream messages
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedMessages.size > 0 && (
            <>
              <button
                onClick={() => toast("info", "Export coming soon")}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export ({selectedMessages.size})
              </button>
              <button
                onClick={deleteSelectedMessages}
                className="btn-secondary flex items-center gap-2 text-status-error"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedMessages.size})
              </button>
            </>
          )}
          <button
            onClick={() => setShowPublishModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Publish Message
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-dark-border pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveMessageTab("stream")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeMessageTab === "stream"
                ? "bg-primary-500/20 text-primary-400"
                : "text-dark-muted hover:bg-dark-bg hover:text-dark-text"
            }`}
          >
            Stream Messages
          </button>
          <button
            type="button"
            onClick={() => setActiveMessageTab("core")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeMessageTab === "core"
                ? "bg-primary-500/20 text-primary-400"
                : "text-dark-muted hover:bg-dark-bg hover:text-dark-text"
            }`}
          >
            Core Messaging
          </button>
        </div>
      </div>

      {activeMessageTab === "stream" && (
        <>

      {/* Stream Selector */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-dark-muted mb-2">
              Select Stream
            </label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="input w-full"
            >
              {streams?.map((stream: any) => (
                <option
                  key={stream.config?.name || stream.name}
                  value={stream.config?.name || stream.name}
                >
                  {stream.config?.name || stream.name} (
                  {stream.state?.messages?.toLocaleString()} messages)
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-sm text-dark-muted mb-2">
              Search Messages
            </label>
            <Search className="absolute left-3 top-9 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search by subject, content, or headers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Less Filters" : "Filters"}
            </button>
            <button onClick={() => refetchMessages()} className="btn-secondary">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-dark-muted">
              Showing {(currentPage - 1) * messagesPerPage + 1}-
              {Math.min(currentPage * messagesPerPage, totalMessages)} of{" "}
              {totalMessages.toLocaleString()} messages
            </span>
            <select
              value={messagesPerPage}
              onChange={(e) => setMessagesPerPage(parseInt(e.target.value))}
              className="input py-1 text-sm w-24"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
              className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-dark-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
              className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => refetchMessages()}
              className="btn-secondary text-sm py-1 px-3 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="card overflow-hidden p-0">
        {/* Header */}
        <div className="bg-dark-bg border-b border-dark-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={
                  selectedMessages.size === displayMessages.length &&
                  displayMessages.length > 0
                }
                onChange={toggleAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-dark-muted">
                {selectedMessages.size > 0
                  ? `${selectedMessages.size} selected`
                  : `${displayMessages.length} messages`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary-500/20 text-primary-400" : "hover:bg-dark-bg"}`}
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary-500/20 text-primary-400" : "hover:bg-dark-bg"}`}
              >
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="divide-y divide-dark-border">
          {isLoadingMessages ? (
            <div className="p-8 text-center text-dark-muted">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading messages...
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="p-8 text-center text-dark-muted">
              {selectedStream
                ? "No messages found for this stream."
                : "Select a stream to browse messages."}
            </div>
          ) : null}
          {displayMessages.map((message: any) => {
            const sequence = message.sequence || message.id;
            const isExpanded = expandedMessages.has(sequence);
            const isSelected = selectedMessages.has(sequence);
            const messageData = parseMessageData(message.data);
            const headers = message.headers || {
              "Nats-Stream": selectedStream,
              "Nats-Sequence": String(sequence),
              "Content-Type": "application/json",
            };

            return (
              <div
                key={sequence}
                className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors"
              >
                <div className="p-4 hover:bg-dark-bg/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMessageSelection(sequence)}
                      className="w-4 h-4 rounded mt-1"
                    />

                    {/* Expand Button */}
                    <button
                      onClick={() => toggleExpand(sequence)}
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
                        <span className="text-sm font-medium">
                          {message.subject}
                        </span>
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
                        onClick={() => toggleExpand(sequence)}
                        className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                        title="View full message"
                      >
                        <Eye className="w-4 h-4 text-dark-muted" />
                      </button>
                      <button
                        onClick={() => copyMessage(messageData, sequence)}
                        className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                        title="Copy message"
                      >
                        {copiedMessage === sequence ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <CopyIcon className="w-4 h-4 text-dark-muted" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete message #${sequence}?`)) {
                            deleteMutation.mutate(sequence);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-status-error"
                        title="Delete message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pl-8 space-y-4">
                      {/* Headers */}
                      <div className="bg-dark-bg/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Headers
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(headers).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="text-dark-muted mr-2">
                                {key}:
                              </span>
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
                            Payload
                          </h4>
                          <button
                            onClick={() => toggleExpand(sequence)}
                            className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            {expandedMessages.has(sequence)
                              ? "Collapse"
                              : "Expand"}
                          </button>
                        </div>
                        <pre className="text-sm bg-dark-bg p-3 rounded overflow-x-auto">
                          <code className="text-green-400">
                            {messageData.length > MAX_DISPLAY_PAYLOAD_SIZE
                              ? messageData.slice(0, MAX_DISPLAY_PAYLOAD_SIZE) +
                                "\n... [truncated — payload too large to display fully]"
                              : messageData}
                          </code>
                        </pre>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted">Sequence</p>
                          <p className="font-mono text-sm">
                            {sequence.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted">Timestamp</p>
                          <p className="text-sm">
                            {new Date(
                              message.timestamp || Date.now(),
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted">Size</p>
                          <p className="text-sm">
                            {formatBytes(message.size || 0)}
                          </p>
                        </div>
                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted">Subject</p>
                          <p className="text-sm font-mono truncate">
                            {message.subject}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setShowPublishModal(true);
                            toast(
                              "info",
                              "Set the subject and payload to reply",
                            );
                          }}
                          className="btn-secondary text-sm"
                        >
                          Reply To
                        </button>
                        <button
                          onClick={() => copyMessage(messageData, sequence)}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          {copiedMessage === sequence ? (
                            <>
                              <Check className="w-3 h-3" /> Copied!
                            </>
                          ) : (
                            "Copy Payload"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(
                                {
                                  subject: message.subject,
                                  sequence: sequence,
                                  data: messageData,
                                  timestamp: message.timestamp,
                                },
                                null,
                                2,
                              ),
                            );
                            toast("success", "Raw message copied");
                          }}
                          className="btn-secondary text-sm"
                        >
                          View Raw
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete message #${sequence}?`)) {
                              deleteMutation.mutate(sequence);
                              setExpandedMessages((prev) => {
                                const next = new Set(prev);
                                next.delete(sequence);
                                return next;
                              });
                            }
                          }}
                          className="btn-secondary text-sm text-status-error"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Publish Message Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Publish Message</h2>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                publishMutation.mutate({
                  stream: (formData.get("stream") as string) || selectedStream,
                  subject: formData.get("subject") as string,
                  data: formData.get("payload") as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Stream</label>
                <select
                  name="stream"
                  className="input w-full"
                  defaultValue={selectedStream}
                >
                  {streams?.map((stream: Stream) => (
                    <option
                      key={stream.config?.name || ""}
                      value={stream.config?.name || ""}
                    >
                      {stream.config?.name || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  placeholder="orders.created"
                  className="input w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payload (JSON)
                </label>
                <textarea
                  name="payload"
                  placeholder='{"order_id": "123", "amount": 99.99}'
                  className="input w-full font-mono h-40"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {publishMutation.isPending ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {activeMessageTab === "core" && <CoreMessagingContent />}
    </div>
  );
}
