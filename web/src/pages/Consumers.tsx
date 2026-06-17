import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConsumersService, StreamsService } from "../types";
import type {
  nats_monitoring_internal_dto_ConsumerResponse as Consumer,
  nats_monitoring_internal_dto_StreamResponse as Stream,
} from "../types";
import {
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Zap,
  Plus,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";
import {
  deleteConsumer,
  setConsumerState,
  resetConsumerLag,
} from "../utils/natsOperations";
import { useToast } from "../components/Toast";

export default function Consumers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStream, setSelectedStream] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "stuck" | "idle"
  >("all");
  const [selectedConsumers, setSelectedConsumers] = useState<Set<string>>(
    new Set(),
  );
  const [expandedConsumers, setExpandedConsumers] = useState<Set<string>>(
    new Set(),
  );
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  // SSE connection for real-time updates
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

  // Filter consumers
  const filteredConsumers =
    consumers?.filter((consumer: Consumer) => {
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
      if (filterStatus === "active")
        matchesStatus = consumer.status === "active";
      else if (filterStatus === "stuck")
        matchesStatus = consumer.status === "stuck";
      else if (filterStatus === "idle")
        matchesStatus = consumer.status === "idle";

      return matchesSearch && matchesStream && matchesStatus;
    }) || [];

  // Stats
  const stats = {
    total: filteredConsumers.length,
    active: filteredConsumers.filter((c: Consumer) => c.status === "active")
      .length,
    stuck: filteredConsumers.filter((c: Consumer) => c.status === "stuck")
      .length,
    idle: filteredConsumers.filter((c: Consumer) => c.status === "idle").length,
    totalLag: filteredConsumers.reduce(
      (acc: number, c: Consumer) => acc + (c.lag || 0),
      0,
    ),
    avgAckRate:
      filteredConsumers.length > 0
        ? filteredConsumers.reduce(
            (acc: number, c: Consumer) =>
              acc +
              parseInt(String(c.ack_rate || "0").replace(/[^\d]/g, "") || "0"),
            0,
          ) / filteredConsumers.length
        : 0,
  };

  const deleteMutation = useMutation({
    mutationFn: ({ stream, name }: { stream: string; name: string }) =>
      deleteConsumer(stream, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      setSelectedConsumers(new Set());
      toast("success", "Consumer deleted");
    },
    onError: () => toast("error", "Failed to delete consumer"),
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
    onError: () => toast("error", "Failed to update consumer"),
  });

  const resetLagMutation = useMutation({
    mutationFn: ({ stream, name }: { stream: string; name: string }) =>
      resetConsumerLag(stream, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      toast("success", "Lag reset");
    },
    onError: () => toast("error", "Failed to reset lag"),
  });

  const handleBulkResume = () => {
    if (confirm(`Resume ${selectedConsumers.size} selected consumers?`)) {
      filteredConsumers.forEach((c: any) => {
        if (selectedConsumers.has(c.name) && c.status !== "active") {
          pauseResumeMutation.mutate({
            stream: c.stream,
            name: c.name,
            paused: false,
          });
        }
      });
    }
  };

  const handleBulkPause = () => {
    if (confirm(`Pause ${selectedConsumers.size} selected consumers?`)) {
      filteredConsumers.forEach((c: any) => {
        if (selectedConsumers.has(c.name) && c.status === "active") {
          pauseResumeMutation.mutate({
            stream: c.stream,
            name: c.name,
            paused: true,
          });
        }
      });
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedConsumers.size} selected consumers?`)) {
      filteredConsumers.forEach((c: any) => {
        if (selectedConsumers.has(c.name)) {
          deleteMutation.mutate({ stream: c.stream, name: c.name });
        }
      });
    }
  };

  const getStatusIcon = (consumer: any) => {
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
        return "Active";
      case "stuck":
        return "Stuck";
      case "idle":
        return "Idle";
      default:
        return "Unknown";
    }
  };

  const getLagColor = (lag: number) => {
    if (lag > 10000) return "status-error";
    if (lag > 1000) return "status-warning";
    return "status-success";
  };

  const toggleConsumerSelection = (consumerName: string) => {
    const newSelected = new Set(selectedConsumers);
    if (newSelected.has(consumerName)) {
      newSelected.delete(consumerName);
    } else {
      newSelected.add(consumerName);
    }
    setSelectedConsumers(newSelected);
  };

  const toggleExpand = (consumerName: string) => {
    const newExpanded = new Set(expandedConsumers);
    if (newExpanded.has(consumerName)) {
      newExpanded.delete(consumerName);
    } else {
      newExpanded.add(consumerName);
    }
    setExpandedConsumers(newExpanded);
  };

  const toggleAll = () => {
    if (selectedConsumers.size === filteredConsumers.length) {
      setSelectedConsumers(new Set());
    } else {
      setSelectedConsumers(new Set(filteredConsumers.map((c: any) => c.name)));
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Consumers</h1>
          <p className="text-dark-muted mt-1">
            Monitor and manage JetStream consumers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* SSE Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-lg border border-dark-border text-xs">
            {sseConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 status-success" />
                <span className="text-status-success">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 status-warning" />
                <span className="text-status-warning">Connecting...</span>
              </>
            )}
          </div>

          {selectedConsumers.size > 0 && (
            <>
              <button
                onClick={handleBulkResume}
                disabled={pauseResumeMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume ({selectedConsumers.size})
              </button>
              <button
                onClick={handleBulkPause}
                disabled={pauseResumeMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause ({selectedConsumers.size})
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteMutation.isPending}
                className="btn-secondary flex items-center gap-2 text-status-error"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedConsumers.size})
              </button>
            </>
          )}
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/streams")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Consumer
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-dark-muted">Total</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-dark-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.stuck}</p>
              <p className="text-xs text-dark-muted">Stuck</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.idle}</p>
              <p className="text-xs text-dark-muted">Idle</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(stats.totalLag / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-dark-muted">Total Lag</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.floor(stats.avgAckRate)}
              </p>
              <p className="text-xs text-dark-muted">Avg ACK/s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search consumers by name or stream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="input"
            >
              <option value="all">All Streams</option>
              {streams?.map((stream: Stream) => (
                <option
                  key={stream.config?.name}
                  value={stream.config?.name}
                >
                  {stream.config?.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="stuck">Stuck</option>
              <option value="idle">Idle</option>
            </select>
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showMoreFilters ? "Less Filters" : "More Filters"}
            </button>
          </div>
        </div>
      </div>

      {/* Consumers List */}
      <div className="card overflow-hidden p-0">
        {/* Table Header */}
        <div className="bg-dark-bg border-b border-dark-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={
                  selectedConsumers.size === filteredConsumers.length &&
                  filteredConsumers.length > 0
                }
                onChange={toggleAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-dark-muted">
                {selectedConsumers.size > 0
                  ? `${selectedConsumers.size} selected`
                  : `${filteredConsumers.length} consumers`}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-dark-muted">
            Loading consumers...
          </div>
        ) : filteredConsumers.length === 0 ? (
          <div className="p-8 text-center text-dark-muted">
            No consumers found matching your filters
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredConsumers.map((consumer: any) => {
              const consumerName = consumer.name || "";
              if (!consumerName) return null;
              const isExpanded = expandedConsumers.has(consumerName);
              const isSelected = selectedConsumers.has(consumerName);

              return (
                <div
                  key={consumerName}
                  className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors"
                >
                  {/* Main Row */}
                  <div className="p-4 hover:bg-dark-bg/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleConsumerSelection(consumerName)}
                        className="w-4 h-4 rounded"
                      />

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpand(consumerName)}
                        className="p-1 hover:bg-dark-bg rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-dark-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-dark-muted" />
                        )}
                      </button>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(consumer)}
                        <span className="text-sm">
                          {getStatusLabel(consumer.status)}
                        </span>
                      </div>

                      {/* Consumer Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{consumerName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Link
                            to={`/streams/${encodeURIComponent(consumer.stream)}`}
                            className="text-xs text-primary-400 hover:underline"
                          >
                            {consumer.stream}
                          </Link>
                          {consumer.config?.durable && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                              Durable
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p
                            className={`font-medium ${getLagColor(consumer.lag || 0)}`}
                          >
                            {(consumer.lag || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-dark-muted">Lag</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">
                            {consumer.ack_rate || "N/A"}
                          </p>
                          <p className="text-xs text-dark-muted">ACK Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">
                            {consumer.num_pending || consumer.lag || 0}
                          </p>
                          <p className="text-xs text-dark-muted">Pending</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const stream = consumer.stream;
                            const consumerName = consumer.name;
                            const isPaused = consumer.status !== "active";
                            pauseResumeMutation.mutate({
                              stream,
                              name: consumerName,
                              paused: !isPaused,
                            });
                          }}
                          className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                          title={
                            consumer.status === "active"
                              ? "Pause consumer"
                              : "Resume consumer"
                          }
                        >
                          {consumer.status === "active" ? (
                            <Pause className="w-4 h-4 text-dark-muted" />
                          ) : (
                            <Play className="w-4 h-4 text-dark-muted" />
                          )}
                        </button>
                        <Link
                          to={`/consumers/${encodeURIComponent(consumer.name)}`}
                          className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-dark-muted" />
                        </Link>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pl-8 space-y-4">
                        {/* Configuration Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-dark-bg/50 rounded-lg p-3">
                            <p className="text-xs text-dark-muted">
                              Delivery Policy
                            </p>
                            <p className="font-medium">
                              {consumer.config?.delivery || "all"}
                            </p>
                          </div>
                          <div className="bg-dark-bg/50 rounded-lg p-3">
                            <p className="text-xs text-dark-muted">
                              Ack Policy
                            </p>
                            <p className="font-medium">
                              {consumer.config?.ack_policy || "explicit"}
                            </p>
                          </div>
                          <div className="bg-dark-bg/50 rounded-lg p-3">
                            <p className="text-xs text-dark-muted">
                              Replay Policy
                            </p>
                            <p className="font-medium">
                              {consumer.config?.replay_policy || "instant"}
                            </p>
                          </div>
                          <div className="bg-dark-bg/50 rounded-lg p-3">
                            <p className="text-xs text-dark-muted">
                              Max Deliveries
                            </p>
                            <p className="font-medium">
                              {consumer.config?.max_deliver || "-1"}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/consumers/${encodeURIComponent(consumer.name)}`,
                              )
                            }
                            className="btn-secondary text-sm"
                          >
                            Edit Configuration
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/consumers/${encodeURIComponent(consumer.name)}`,
                              )
                            }
                            className="btn-secondary text-sm"
                          >
                            View Messages
                          </button>
                          <button
                            onClick={() =>
                              resetLagMutation.mutate({
                                stream: consumer.stream,
                                name: consumer.name,
                              })
                            }
                            disabled={resetLagMutation.isPending}
                            className="btn-secondary text-sm"
                          >
                            Reset Lag
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(`Delete consumer "${consumer.name}"?`)
                              ) {
                                deleteMutation.mutate({
                                  stream: consumer.stream,
                                  name: consumer.name,
                                });
                              }
                            }}
                            className="btn-secondary text-sm text-status-error"
                          >
                            Delete Consumer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-dark-muted">
        <span>
          Showing {filteredConsumers.length} of {consumers?.length || 0}{" "}
          consumers
        </span>
      </div>
    </div>
  );
}
