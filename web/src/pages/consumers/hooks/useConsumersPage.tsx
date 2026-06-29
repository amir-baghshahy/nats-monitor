import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConsumerResponse as Consumer,
  StreamResponse as Stream,
} from "../../../types";
import { ConsumersService, StreamsService } from "../../../types";
import { useSSE } from "../../../hooks/useSSE";
import { useExpansion, useSelection } from "../../../hooks";
import { useConfirm } from "../../../components/ConfirmDialog";
import { useToast } from "../../../components/Toast";
import {
  deleteConsumer,
  resetConsumerLag,
  setConsumerState,
} from "../../../utils/natsOperations";
import { Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";

export type ConsumerFilterStatus = "all" | "active" | "stuck" | "idle";

export interface ConsumerStats {
  total: number;
  active: number;
  stuck: number;
  idle: number;
  totalLag: number;
  avgAckRate: number;
}

export interface UseConsumersPageReturn {
  searchQuery: string;
  selectedStream: string;
  filterStatus: ConsumerFilterStatus;
  showMoreFilters: boolean;
  selectedConsumers: Set<string>;
  filteredConsumers: Consumer[];
  totalConsumers: number;
  stats: ConsumerStats;
  streamOptions: string[];
  activeFilterCount: number;
  isLoading: boolean;
  sseConnected: boolean;
  pauseResumePending: boolean;
  resetLagPending: boolean;
  deletePending: boolean;
  setSearchQuery: (value: string) => void;
  setSelectedStream: (value: string) => void;
  setFilterStatus: (value: ConsumerFilterStatus) => void;
  setShowMoreFilters: (value: boolean) => void;
  toggleConsumerSelection: (item: string) => void;
  clearConsumerSelection: () => void;
  selectAllConsumers: (items: string[]) => void;
  toggleExpand: (item: string) => void;
  isConsumerExpanded: (item: string) => boolean;
  refetch: () => void;
  handleBulkResume: () => Promise<void>;
  handleBulkPause: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleTogglePauseResume: (consumer: Consumer) => void;
  handleResetLag: (consumer: Consumer) => void;
  handleDeleteConsumer: (consumer: Consumer) => Promise<void>;
  getStatusIcon: (consumer: Consumer) => JSX.Element;
  getStatusLabel: (status: string) => string;
  getLagColor: (lag: number) => string;
  clearFilters: () => void;
  toggleAll: () => void;
}

export function useConsumersPage(): UseConsumersPageReturn {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStream, setSelectedStream] = useState("all");
  const [filterStatus, setFilterStatus] = useState<ConsumerFilterStatus>("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const {
    selected: selectedConsumers,
    toggleSelection: toggleConsumerSelection,
    clearSelection: clearConsumerSelection,
    selectAll: selectAllConsumers,
  } = useSelection<string>();

  const { toggleExpansion: toggleExpand, isExpanded: isConsumerExpanded } =
    useExpansion<string>();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { connected: sseConnected } = useSSE("consumers");

  const {
    data: consumers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["consumers"],
    queryFn: () => ConsumersService.getConsumers(),
  });

  const { data: streams } = useQuery({
    queryKey: ["streams"],
    queryFn: () => StreamsService.getStreams(),
  });

  const filteredConsumers = useMemo(
    () =>
      (consumers ?? []).filter((consumer) => {
        const matchesSearch =
          (consumer.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (consumer.stream || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesStream =
          selectedStream === "all" || consumer.stream === selectedStream;

        let matchesStatus = true;
        if (filterStatus === "active") {
          matchesStatus = consumer.status === "active";
        } else if (filterStatus === "stuck") {
          matchesStatus = consumer.status === "stuck";
        } else if (filterStatus === "idle") {
          matchesStatus = consumer.status === "idle";
        }

        return matchesSearch && matchesStream && matchesStatus;
      }),
    [consumers, filterStatus, searchQuery, selectedStream],
  );

  const stats = useMemo<ConsumerStats>(
    () => ({
      total: filteredConsumers.length,
      active: filteredConsumers.filter(
        (consumer) => consumer.status === "active",
      ).length,
      stuck: filteredConsumers.filter((consumer) => consumer.status === "stuck")
        .length,
      idle: filteredConsumers.filter((consumer) => consumer.status === "idle")
        .length,
      totalLag: filteredConsumers.reduce(
        (acc, consumer) => acc + (consumer.lag || 0),
        0,
      ),
      avgAckRate:
        filteredConsumers.length > 0
          ? filteredConsumers.reduce(
              (acc, consumer) =>
                acc +
                  parseFloat(
                    String(consumer.ack_rate || "0").replace(/[^0-9.]/g, ""),
                  ) || 0,
              0,
            ) / filteredConsumers.length
          : 0,
    }),
    [filteredConsumers],
  );

  const deleteMutation = useMutation({
    mutationFn: ({ stream, name }: { stream: string; name: string }) =>
      deleteConsumer(stream, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      clearConsumerSelection();
      toast("success", t("consumers.consumerDeleted"));
    },
    onError: () => toast("error", t("consumers.consumerDeleteFailed")),
  });

  const pauseResumeMutation = useMutation({
    mutationFn: ({
      stream,
      name,
      paused,
    }: {
      stream: string;
      name: string;
      paused: boolean;
    }) => setConsumerState(stream, name, paused),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
    },
    onError: () => toast("error", t("consumers.consumerUpdateFailed")),
  });

  const resetLagMutation = useMutation({
    mutationFn: ({ stream, name }: { stream: string; name: string }) =>
      resetConsumerLag(stream, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      toast("success", t("consumers.lagReset"));
    },
    onError: () => toast("error", t("consumers.lagResetFailed")),
  });

  const handleBulkResume = async () => {
    const ok = await confirm({
      title: t("consumers.resumeConsumers"),
      message: t("consumers.resumeConsumersConfirm", {
        count: selectedConsumers.size,
      }),
      confirmLabel: t("consumers.resumeConsumers").split(" ")[0],
      variant: "info",
    });
    if (ok) {
      filteredConsumers.forEach((consumer) => {
        if (!consumer.name || !consumer.stream) return;
        if (selectedConsumers.has(consumer.name) && consumer.paused) {
          pauseResumeMutation.mutate({
            stream: consumer.stream,
            name: consumer.name,
            paused: false,
          });
        }
      });
    }
  };

  const handleBulkPause = async () => {
    const ok = await confirm({
      title: t("consumers.pauseConsumers"),
      message: t("consumers.pauseConsumersConfirm", {
        count: selectedConsumers.size,
      }),
      confirmLabel: t("consumers.pauseConsumers").split(" ")[0],
      variant: "warning",
    });
    if (ok) {
      filteredConsumers.forEach((consumer) => {
        if (!consumer.name || !consumer.stream) return;
        if (selectedConsumers.has(consumer.name) && !consumer.paused) {
          pauseResumeMutation.mutate({
            stream: consumer.stream,
            name: consumer.name,
            paused: true,
          });
        }
      });
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t("consumers.deleteConsumers"),
      message: t("consumers.deleteConsumersConfirm", {
        count: selectedConsumers.size,
      }),
      confirmLabel: t("common.delete"),
      variant: "danger",
    });
    if (ok) {
      filteredConsumers.forEach((consumer) => {
        if (!consumer.name || !consumer.stream) return;
        if (selectedConsumers.has(consumer.name)) {
          deleteMutation.mutate({
            stream: consumer.stream,
            name: consumer.name,
          });
        }
      });
    }
  };

  const handleTogglePauseResume = (consumer: Consumer) => {
    if (!consumer.name || !consumer.stream) return;
    const isPaused = consumer.paused;
    pauseResumeMutation.mutate({
      stream: consumer.stream,
      name: consumer.name,
      paused: !isPaused,
    });
  };

  const handleResetLag = (consumer: Consumer) => {
    if (!consumer.name || !consumer.stream) return;
    resetLagMutation.mutate({
      stream: consumer.stream,
      name: consumer.name,
    });
  };

  const handleDeleteConsumer = async (consumer: Consumer) => {
    const ok = await confirm({
      title: t("consumers.deleteConsumer"),
      message: t("consumers.deleteConsumerConfirm", { name: consumer.name }),
      confirmLabel: t("common.delete"),
      variant: "danger",
    });
    if (ok && consumer.name && consumer.stream) {
      deleteMutation.mutate({ stream: consumer.stream, name: consumer.name });
    }
  };

  const getStatusIcon = (consumer: Consumer) => {
    switch (consumer.status) {
      case "active":
        return <CheckCircle className="w-4 h-4 status-success" />;
      case "stuck":
        return <AlertCircle className="w-4 h-4 status-error" />;
      case "idle":
        return <Clock className="w-4 h-4 status-warning" />;
      default:
        return <Activity className="w-4 h-4 status-info" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t("consumers.active");
      case "stuck":
        return t("consumers.stuck");
      case "idle":
        return t("consumers.idle");
      default:
        return t("consumers.unknown");
    }
  };

  const getLagColor = (lag: number) => {
    if (lag > 10000) return "status-error";
    if (lag > 1000) return "status-warning";
    return "status-success";
  };

  const streamOptions = useMemo(
    () =>
      streams
        ?.map((stream: Stream) => stream.config?.name)
        .filter((name): name is string => Boolean(name)) ?? [],
    [streams],
  );

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedStream !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStream("all");
    setFilterStatus("all");
    setShowMoreFilters(false);
  };

  const toggleAll = () => {
    if (selectedConsumers.size === filteredConsumers.length) {
      clearConsumerSelection();
    } else {
      selectAllConsumers(
        filteredConsumers
          .map((consumer) => consumer.name)
          .filter((name): name is string => Boolean(name)),
      );
    }
  };

  return {
    searchQuery,
    selectedStream,
    filterStatus,
    showMoreFilters,
    selectedConsumers,
    filteredConsumers,
    totalConsumers: consumers?.length ?? 0,
    stats,
    streamOptions,
    activeFilterCount,
    isLoading,
    sseConnected,
    pauseResumePending: pauseResumeMutation.isPending,
    resetLagPending: resetLagMutation.isPending,
    deletePending: deleteMutation.isPending,
    setSearchQuery,
    setSelectedStream,
    setFilterStatus,
    setShowMoreFilters,
    toggleConsumerSelection,
    clearConsumerSelection,
    selectAllConsumers,
    toggleExpand,
    isConsumerExpanded,
    refetch,
    handleBulkResume,
    handleBulkPause,
    handleBulkDelete,
    handleTogglePauseResume,
    handleResetLag,
    handleDeleteConsumer,
    getStatusIcon,
    getStatusLabel,
    getLagColor,
    clearFilters,
    toggleAll,
  };
}
