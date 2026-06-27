import { useCallback, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type {
  CreateStreamRequest,
  StreamResponse as Stream,
  StreamResponse,
} from "../../../types";
import { ExportService, StreamsService } from "../../../types";
import { useConfirm } from "../../../components/ConfirmDialog";
import { useToast } from "../../../components/Toast";
import {
  useExpansion,
  useFilters,
  usePagination,
  useSelection,
} from "../../../hooks";
import { useSSE } from "../../../hooks/useSSE";

export type StreamHealthStatus = "all" | "healthy" | "warning" | "critical";

export interface StreamFilters {
  search: string;
  storage: "file" | "memory" | "all";
  status: StreamHealthStatus;
  minMessages: number;
  maxMessages: number;
  minConsumers: number;
  subjectPattern: string;
}

export interface StreamStats {
  total: number;
  fileStorage: number;
  memoryStorage: number;
  totalMessages: number;
  totalBytes: number;
  totalConsumers: number;
}

export interface UseStreamsPageReturn {
  streams: Stream[];
  filteredStreams: Stream[];
  paginatedStreams: Stream[];
  stats: StreamStats;
  selected: Set<string>;
  page: number;
  isLoading: boolean;
  sseConnected: boolean;
  showCreateModal: boolean;
  createPending: boolean;
  deletePending: boolean;
  purgePending: boolean;
  exportAllPending: boolean;
  exportStreamPending: boolean;
  exportMessagesPending: boolean;
  filters: StreamFilters;
  updateFilter: <K extends keyof StreamFilters>(
    field: K,
    value: StreamFilters[K],
  ) => void;
  resetFilters: () => void;
  applyFilters: (items: Stream[]) => Stream[];
  hasActiveFilters: boolean;
  toggleSelection: (item: string) => void;
  clearSelection: () => void;
  selectAll: (items: string[]) => void;
  isSelected: (item: string) => boolean;
  toggleExpansion: (item: string) => void;
  isExpanded: (item: string) => boolean;
  goToPage: (page: number) => void;
  refetch: () => void;
  setShowCreateModal: (value: boolean) => void;
  createMutation: UseMutationResult<
    StreamResponse,
    unknown,
    CreateStreamRequest,
    unknown
  >;
  handleDelete: (streamName: string) => Promise<void>;
  handlePurge: (streamName: string) => Promise<void>;
  handleExportStream: (
    streamName: string,
    format?: "json" | "csv" | "txt",
  ) => void;
  handleExportMessages: (streamName: string, subject?: string) => void;
  handleExportAll: () => void;
  handleBulkDelete: () => Promise<void>;
  handleSelectAll: () => void;
  getStreamHealthStatus: (stream: Stream) => StreamHealthStatus;
  getStreamName: (stream: Stream) => string;
}

function downloadBlob(data: Blob | string | object, filename: string) {
  let blob: Blob;
  if (typeof data === "string") {
    blob = new Blob([data], { type: "application/octet-stream" });
  } else if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
  }
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

export function getStreamHealthStatus(stream: Stream): StreamHealthStatus {
  const lag = stream.state?.num_pending || 0;
  if (lag > 10000) return "critical";
  if (lag > 1000) return "warning";
  return "healthy";
}

export function getStreamName(stream: Stream): string {
  return stream.config?.name || "";
}

export function useStreamsPage(): UseStreamsPageReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirm();
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

  const streamFilterFn = useCallback((stream: Stream, filters: StreamFilters) => {
    const streamName = stream.config?.name || "";
    const matchesSearch =
      streamName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (stream.config?.subjects || []).some((subject) =>
        subject.toLowerCase().includes(filters.search.toLowerCase()),
      );

    const matchesStorage =
      filters.storage === "all" || stream.config?.storage === filters.storage;

    const lag = stream.state?.num_pending || 0;
    let matchesStatus = true;
    if (filters.status === "healthy") {
      matchesStatus = lag < 1000;
    } else if (filters.status === "warning") {
      matchesStatus = lag >= 1000 && lag < 10000;
    } else if (filters.status === "critical") {
      matchesStatus = lag >= 10000;
    }

    const messages = stream.state?.messages || 0;
    const matchesMinMessages = messages >= filters.minMessages;
    const matchesMaxMessages =
      filters.maxMessages === 0 || messages <= filters.maxMessages;
    const matchesMinConsumers =
      (stream.state?.consumers || 0) >= filters.minConsumers;
    const matchesSubjectPattern =
      filters.subjectPattern === "" ||
      (stream.config?.subjects || []).some((subject) =>
        subject.includes(filters.subjectPattern),
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
  }, []);

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

  const filteredStreams = useMemo(() => applyFilters(streams), [streams, filters, applyFilters]);
  const paginatedStreams = useMemo(() => getPaginatedItems(filteredStreams), [filteredStreams, page, getPaginatedItems]);

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
      downloadBlob(
        blob,
        `streams-${new Date().toISOString().slice(0, 10)}.json`,
      );
      toast("success", "Streams export downloaded");
    },
    onError: (error: any) => {
      toast("error", error?.body?.error || "Failed to export streams");
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
      downloadBlob(blob, `${variables.name}.${variables.format}`);
      toast("success", "Stream export downloaded");
    },
    onError: (error: any) => {
      toast("error", error?.body?.error || "Failed to export stream");
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
    }) =>
      ExportService.postExportStreamsMessages(name, subject, {
        subject,
        limit,
      }),
    onSuccess: (blob, variables) => {
      const suffix = variables.subject
        ? variables.subject.replace(/\./g, "_")
        : "messages";
      downloadBlob(blob, `${variables.name}-${suffix}.json`);
      toast("success", "Messages export downloaded");
    },
    onError: (error: any) => {
      toast(
        "error",
        error?.response?.data?.error || "Failed to export messages",
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStreamRequest) => StreamsService.postStreams(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast("error", error?.response?.data?.error || "Failed to create stream");
    },
  });

  const stats = useMemo<StreamStats>(
    () => ({
      total: filteredStreams.length,
      fileStorage: filteredStreams.filter(
        (stream) => stream.config?.storage === "file",
      ).length,
      memoryStorage: filteredStreams.filter(
        (stream) => stream.config?.storage === "memory",
      ).length,
      totalMessages: filteredStreams.reduce(
        (acc, stream) => acc + (stream.state?.messages || 0),
        0,
      ),
      totalBytes: filteredStreams.reduce(
        (acc, stream) => acc + (stream.state?.bytes || 0),
        0,
      ),
      totalConsumers: filteredStreams.reduce(
        (acc, stream) => acc + (stream.state?.consumers || 0),
        0,
      ),
    }),
    // Use streams length instead of filteredStreams reference to avoid infinite loop
    [
      streams.length,
      filters.search,
      filters.storage,
      filters.status,
      filters.minMessages,
      filters.maxMessages,
      filters.minConsumers,
      filters.subjectPattern,
    ],
  );

  const handleDelete = async (streamName: string) => {
    const ok = await confirm({
      title: "Delete Stream",
      message: `Delete "${streamName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) deleteMutation.mutate(streamName);
  };

  const handlePurge = async (streamName: string) => {
    const ok = await confirm({
      title: "Purge Stream",
      message: `Purge all messages from "${streamName}"?`,
      confirmLabel: "Purge",
      variant: "warning",
    });
    if (ok) purgeMutation.mutate(streamName);
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

  const handleExportAll = () => {
    exportAllMutation.mutate();
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: "Delete Streams",
      message: `Delete ${selected.size} selected streams? This action cannot be undone.`,
      confirmLabel: "Delete All",
      variant: "danger",
    });
    if (ok) {
      selected.forEach((name) => deleteMutation.mutate(name));
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    selectAll(paginatedStreams.map(getStreamName));
  };

  return {
    streams,
    filteredStreams,
    paginatedStreams,
    stats,
    selected,
    page,
    isLoading,
    sseConnected,
    showCreateModal,
    createPending: createMutation.isPending,
    deletePending: deleteMutation.isPending,
    purgePending: purgeMutation.isPending,
    exportAllPending: exportAllMutation.isPending,
    exportStreamPending: exportStreamMutation.isPending,
    exportMessagesPending: exportMessagesMutation.isPending,
    filters,
    updateFilter,
    resetFilters,
    applyFilters,
    hasActiveFilters,
    toggleSelection,
    clearSelection,
    selectAll,
    isSelected,
    toggleExpansion,
    isExpanded,
    goToPage,
    refetch,
    setShowCreateModal,
    createMutation,
    handleDelete,
    handlePurge,
    handleExportStream,
    handleExportMessages,
    handleExportAll,
    handleBulkDelete,
    handleSelectAll,
    getStreamHealthStatus,
    getStreamName,
  };
}

export type { Stream };
