import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Database,
  HardDrive,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Eye,
  Wifi,
  WifiOff,
  Trash2,
  X,
  Download,
} from "lucide-react";
import { useSSE } from "../hooks/useSSE";
import {
  useSelection,
  useExpansion,
  usePagination,
  useFilters,
} from "../hooks";
import { SearchBar, Pagination, BulkActions } from "../components/common";
import { StatusBadge, EmptyState } from "../components/ui";
import { StreamsService, ExportService } from "../types";
import { useToast } from "../components/Toast";
import type { github_com_amir_nats_monitor_internal_dto_StreamResponse as Stream } from "../types";
import type { github_com_amir_nats_monitor_internal_dto_CreateStreamRequest } from "../types";
import { formatBytes } from "../utils/formatters";

interface StreamFilters {
  search: string;
  storage: "file" | "memory" | "all";
  status: StreamHealthStatus;
  minMessages: number;
  maxMessages: number;
  minConsumers: number;
  subjectPattern: string;
}

interface StreamStats {
  total: number;
  fileStorage: number;
  memoryStorage: number;
  totalMessages: number;
  totalBytes: number;
  totalConsumers: number;
}

type StreamHealthStatus = "all" | "healthy" | "warning" | "critical";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const defaultFilters: StreamFilters = {
  search: "",
  storage: "all",
  status: "all",
  minMessages: 0,
  maxMessages: 0,
  minConsumers: 0,
  subjectPattern: "",
};

export default function Streams() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { connected: sseConnected } = useSSE("streams");

  const {
    data: streams = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["streams"],
    queryFn: () => StreamsService.getStreams(),
  });

  const streamFilterFn = (
    stream: Stream,
    filters: StreamFilters,
  ) => {
    const streamName = stream.config?.name || "";
    const matchesSearch =
      streamName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (stream.config?.subjects || []).some((s) =>
        s.toLowerCase().includes(filters.search.toLowerCase()),
      );

    const matchesStorage =
      filters.storage === "all" || stream.config?.storage === filters.storage;

    const lag = stream.state?.num_pending || 0;
    let matchesStatus = true;
    if (filters.status === "healthy") matchesStatus = lag < 1000;
    else if (filters.status === "warning")
      matchesStatus = lag >= 1000 && lag < 10000;
    else if (filters.status === "critical") matchesStatus = lag >= 10000;

    const messages = stream.state?.messages || 0;
    const matchesMinMessages = messages >= filters.minMessages;
    const matchesMaxMessages =
      filters.maxMessages === 0 || messages <= filters.maxMessages;
    const matchesMinConsumers =
      (stream.state?.consumers || 0) >= filters.minConsumers;
    const matchesSubjectPattern =
      filters.subjectPattern === "" ||
      (stream.config?.subjects || []).some((s) =>
        s.includes(filters.subjectPattern),
      );

    return (
      matchesSearch &&
      matchesStorage &&
      matchesStatus &&
      matchesMinMessages &&
      matchesMaxMessages &&
      matchesMinConsumers &&
      matchesSubjectPattern
    );
  };

  const {
    filters,
    updateFilter,
    resetFilters,
    applyFilters,
    hasActiveFilters,
  } = useFilters({
    initialFilters: defaultFilters,
    filterFn: streamFilterFn,
  });

  const { selected, toggleSelection, clearSelection, selectAll, isSelected } =
    useSelection<string>();

  const { toggleExpansion, isExpanded } = useExpansion<string>();

  const { page, goToPage, getPaginatedItems } = usePagination({
    perPage: 20,
  });

  const filteredStreams = applyFilters(streams);
  const paginatedStreams = getPaginatedItems(filteredStreams);

  const deleteMutation = useMutation({
    mutationFn: (name: string) => StreamsService.deleteStreams(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (name: string) => StreamsService.postStreamsPurge(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
    },
  });

  const exportAllMutation = useMutation({
    mutationFn: () => ExportService.getExportStreams(),
    onSuccess: (blob) => {
      downloadBlob(blob, `streams-${new Date().toISOString().slice(0, 10)}.json`);
      toast("success", "Streams export downloaded");
    },
    onError: (error: any) => {
      toast("error", error.response?.data?.error || "Failed to export streams");
    },
  });

  const exportStreamMutation = useMutation({
    mutationFn: ({
      name,
      format,
      includeMessages,
    }: {
      name: string;
      format: "json" | "csv" | "txt";
      includeMessages?: boolean;
    }) => ExportService.getExportStreams1(name, format, includeMessages),
    onSuccess: (blob, variables) => {
      downloadBlob(blob, `${variables.name}-${variables.format}`);
      toast("success", "Stream export downloaded");
    },
    onError: (error: any) => {
      toast("error", error.response?.data?.error || "Failed to export stream");
    },
  });

  const exportMessagesMutation = useMutation({
    mutationFn: ({
      name,
      subject,
      limit,
    }: {
      name: string;
      subject?: string;
      limit?: number;
    }) => ExportService.postExportStreamsMessages(name, subject, { subject, limit }),
    onSuccess: (blob, variables) => {
      const suffix = variables.subject ? variables.subject.replace(/\./g, "_") : "messages";
      downloadBlob(blob, `${variables.name}-${suffix}.json`);
      toast("success", "Messages export downloaded");
    },
    onError: (error: any) => {
      toast("error", error.response?.data?.error || "Failed to export messages");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: github_com_amir_nats_monitor_internal_dto_CreateStreamRequest) =>
      StreamsService.postStreams(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      setShowCreateModal(false);
    },
  });

  const stats: StreamStats = {
    total: filteredStreams.length,
    fileStorage: filteredStreams.filter((s) => s.config?.storage === "file")
      .length,
    memoryStorage: filteredStreams.filter((s) => s.config?.storage === "memory")
      .length,
    totalMessages: filteredStreams.reduce(
      (acc, s) => acc + (s.state?.messages || 0),
      0,
    ),
    totalBytes: filteredStreams.reduce(
      (acc, s) => acc + (s.state?.bytes || 0),
      0,
    ),
    totalConsumers: filteredStreams.reduce(
      (acc, s) => acc + (s.state?.consumers || 0),
      0,
    ),
  };

  const getStreamHealthStatus = (stream: Stream): StreamHealthStatus => {
    const lag = stream.state?.num_pending || 0;
    if (lag > 10000) return "critical";
    if (lag > 1000) return "warning";
    return "healthy";
  };

  const getStreamName = (stream: Stream): string =>
    stream.config?.name || "";

  const handleDelete = (streamName: string) => {
    if (
      confirm(`Delete stream "${streamName}"? This action cannot be undone.`)
    ) {
      deleteMutation.mutate(streamName);
    }
  };

  const handlePurge = (streamName: string) => {
    if (confirm(`Purge all messages from "${streamName}"?`)) {
      purgeMutation.mutate(streamName);
    }
  };

  const handleExportStream = (
    streamName: string,
    format: "json" | "csv" | "txt" = "json",
  ) => {
    exportStreamMutation.mutate({ name: streamName, format });
  };

  const handleExportMessages = (streamName: string, subject?: string) => {
    exportMessagesMutation.mutate({ name: streamName, subject, limit: 1000 });
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `Delete ${selected.size} selected streams? This action cannot be undone.`,
      )
    ) {
      selected.forEach((name) => deleteMutation.mutate(name));
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    selectAll(paginatedStreams.map((s) => getStreamName(s)));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Streams</h1>
          <p className="text-dark-muted mt-1">
            Manage and monitor JetStream streams
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-lg border border-dark-border text-xs">
            {sseConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400">Connecting...</span>
              </>
            )}
          </div>

          <button
            onClick={() => refetch()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Stream
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-dark-muted">Total Streams</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.fileStorage}</p>
              <p className="text-xs text-dark-muted">File Storage</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.memoryStorage}</p>
              <p className="text-xs text-dark-muted">Memory Storage</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {stats.totalMessages.toLocaleString()}
              </p>
              <p className="text-xs text-dark-muted">Total Messages</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalConsumers}</p>
              <p className="text-xs text-dark-muted">Total Consumers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3">
            <SearchBar
              value={filters.search}
              onChange={(value) => updateFilter("search", value)}
              placeholder="Search streams by name or subject..."
              className="flex-1"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[420px] xl:flex-none">
              <select
                value={filters.storage}
                onChange={(e) => updateFilter("storage", e.target.value as StreamFilters["storage"])}
                className="input"
              >
                <option value="all">All Storage</option>
                <option value="file">File</option>
                <option value="memory">Memory</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value as StreamHealthStatus)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-dark-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-dark-muted">
                Filters:
              </span>
              {!hasActiveFilters() ? (
                <span className="rounded-full bg-dark-bg px-3 py-1 text-xs text-dark-muted">
                  Showing all streams
                </span>
              ) : null}
              {filters.search ? (
                <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                  Search: {filters.search}
                </span>
              ) : null}
              {filters.storage !== "all" ? (
                <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                  Storage: {filters.storage}
                </span>
              ) : null}
              {filters.status !== "all" ? (
                <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                  Status: {filters.status}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters()}
                className="btn-secondary"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <BulkActions
        selectedCount={selected.size}
        totalCount={paginatedStreams.length}
        onSelectAll={handleSelectAll}
        onClearSelection={clearSelection}
        actions={[
          {
            label: "Export All",
            icon: Download,
            onClick: () => exportAllMutation.mutate(),
          },
          {
            label: "Delete",
            icon: Trash2,
            onClick: handleBulkDelete,
            variant: "danger",
          },
        ]}
      />

      {paginatedStreams.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No Streams Found"
          description={
            hasActiveFilters()
              ? "Try adjusting your filters"
              : "Create your first stream to get started"
          }
        />
      ) : (
        <>
          <div className="card divide-y divide-dark-border">
            {paginatedStreams.map((stream) => {
              const streamName = getStreamName(stream);
              const healthStatus = getStreamHealthStatus(stream);
              const isItemSelected = isSelected(streamName);
              const isItemExpanded = isExpanded(streamName);

              return (
                <div
                  key={streamName}
                  className={isItemSelected ? "bg-primary-500/5" : ""}
                >
                  <div className="p-4 hover:bg-dark-bg/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isItemSelected}
                        onChange={() => toggleSelection(streamName)}
                        className="w-4 h-4"
                      />

                      <button
                        onClick={() => toggleExpansion(streamName)}
                        className="p-1 hover:bg-dark-bg rounded transition-colors"
                      >
                        {isItemExpanded ? (
                          <ChevronDown className="w-4 h-4 text-dark-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-dark-muted" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            to={`/streams/${encodeURIComponent(streamName)}`}
                            className="font-mono text-sm text-primary-400 hover:underline"
                          >
                            {streamName}
                          </Link>

                          <StatusBadge
                            status={
                              healthStatus === "healthy"
                                ? "success"
                                : healthStatus === "warning"
                                  ? "warning"
                                  : "error"
                            }
                            size="small"
                          />

                          <span className="text-xs text-dark-muted">
                            {stream.config?.storage === "file"
                              ? "File"
                              : "Memory"}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-dark-muted">
                          <span>
                            {stream.state?.messages?.toLocaleString() || 0}{" "}
                            messages
                          </span>
                          <span>{formatBytes(stream.state?.bytes || 0)}</span>
                          <span>{stream.state?.consumers || 0} consumers</span>

                          {(stream.state?.num_pending || 0) > 0 && (
                            <span className="text-yellow-400">
                              {stream.state?.num_pending?.toLocaleString()}{" "}
                              pending
                            </span>
                          )}
                        </div>
                      </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/streams/${encodeURIComponent(streamName)}`,
                              )
                            }
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-dark-muted" />
                          </button>

                          <button
                            onClick={() => handleExportStream(streamName, "json")}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                            title="Export stream"
                          >
                            <Download className="w-4 h-4 text-dark-muted" />
                          </button>

                          <button
                            onClick={() => handleExportMessages(streamName)}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                            title="Export messages"
                          >
                            <MessageSquare className="w-4 h-4 text-dark-muted" />
                          </button>

                          <button
                            onClick={() => handlePurge(streamName)}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                            title="Purge messages"
                          >
                            <RefreshCw className="w-4 h-4 text-dark-muted" />
                          </button>

                        <button
                          onClick={() => handleDelete(streamName)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete stream"
                        >
                          <Trash2 className="w-4 h-4 text-dark-muted hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {isItemExpanded && (
                      <div className="mt-4 pl-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted mb-1">
                            Subjects
                          </p>
                          <div className="space-y-1">
                            {stream.config?.subjects?.map((subject: string) => (
                              <code
                                key={subject}
                                className="text-xs text-primary-400"
                              >
                                {subject}
                              </code>
                            ))}
                          </div>
                        </div>

                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted mb-1">
                            Configuration
                          </p>
                          <div className="space-y-1">
                            <p>Replicas: {stream.config?.replicas}</p>
                            <p>Retention: {stream.config?.retention}</p>
                            <p>Max Age: {stream.config?.max_age}s</p>
                          </div>
                        </div>

                        <div className="bg-dark-bg/50 rounded-lg p-3">
                          <p className="text-xs text-dark-muted mb-1">State</p>
                          <div className="space-y-1">
                            <p>
                              First Seq:{" "}
                              {stream.state?.first_seq?.toLocaleString() || 0}
                            </p>
                            <p>
                              Last Seq:{" "}
                              {stream.state?.last_seq?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Pagination
              page={page}
              perPage={20}
              total={filteredStreams.length}
              onPageChange={goToPage}
            />
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateStreamModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateStreamModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (data: github_com_amir_nats_monitor_internal_dto_CreateStreamRequest) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [storage, setStorage] = useState<"file" | "memory">("file");
  const [replicas, setReplicas] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
      storage: storage as unknown as github_com_amir_nats_monitor_internal_dto_CreateStreamRequest.storage,
      replicas,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create Stream</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stream Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-stream"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subjects</label>
            <input
              type="text"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="orders.*, events.*"
              className="input w-full"
              required
            />
            <p className="text-xs text-dark-muted mt-1">Comma-separated list</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Storage</label>
            <select
              value={storage}
              onChange={(e) => setStorage(e.target.value as "file" | "memory")}
              className="input w-full"
            >
              <option value="file">File</option>
              <option value="memory">Memory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Replicas</label>
            <input
              type="number"
              value={replicas}
              onChange={(e) => setReplicas(Number(e.target.value))}
              min={1}
              max={5}
              className="input w-full"
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Creating..." : "Create Stream"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
