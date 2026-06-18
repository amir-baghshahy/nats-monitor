import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ConsumersService } from "../types";
import type {
  github_com_amir_nats_monitor_internal_dto_AckMessageRequest,
  github_com_amir_nats_monitor_internal_dto_AckTermMessageRequest,
  github_com_amir_nats_monitor_internal_dto_NackMessageRequest,
} from "../types";
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Settings,
  TrendingUp,
  Activity,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  SkipForward,
  SkipBack,
  BarChart3,
  FastForward,
  Loader2,
  Check,
  X,
  Clock,
  Copy,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  resetConsumerLag,
  replayMessages,
  setConsumerState,
  deleteConsumer,
} from "../utils/natsOperations";

export default function ConsumerDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "overview" | "messages" | "config"
  >("overview");
  const [isPaused, setIsPaused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [editForm, setEditForm] = useState({
    ack_policy: "explicit",
    deliver_policy: "all",
    replay_policy: "instant",
    max_deliver: -1,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { data: consumer, refetch } = useQuery({
    queryKey: ["consumer", name],
    queryFn: () => ConsumersService.getConsumers1(name || ""),
    refetchInterval: isPaused || isTabHidden ? false : 5000,
    refetchOnWindowFocus: false,
    enabled: !!name,
  });

  const consumerData = consumer || {
    name: name,
    stream: "",
    status: "unknown",
    lag: 0,
    num_pending: 0,
    config: {
      durable: false,
      ack_policy: "explicit",
      deliver_policy: "all",
      replay_policy: "instant",
      max_deliver: -1,
    },
  };

  // Fetch pending messages
  const { data: pendingMessages, refetch: refetchPending } = useQuery({
    queryKey: ["pendingMessages", consumerData.stream, name],
    queryFn: () =>
      ConsumersService.getStreamsConsumersPending(
        consumerData.stream ?? "",
        name || "",
      ),
    enabled: !!consumerData.stream && !!name && activeTab === "messages",
    refetchInterval: 5000,
  });

  const ackMutation = useMutation({
    mutationFn: (sequence: number) => {
      const payload: github_com_amir_nats_monitor_internal_dto_AckMessageRequest = {
        sequence,
      };
      return ConsumersService.postStreamsConsumersAck(
        consumerData.stream ?? "",
        name || "",
        payload,
      );
    },
    onSuccess: () => {
      refetchPending();
      refetch();
    },
  });

  const nackMutation = useMutation({
    mutationFn: ({ sequence, delay }: { sequence: number; delay?: number }) => {
      const payload: github_com_amir_nats_monitor_internal_dto_NackMessageRequest = {
        sequence,
      };
      if (delay !== undefined) payload.delay = delay;
      return ConsumersService.postStreamsConsumersNack(
        consumerData.stream ?? "",
        name || "",
        payload,
      );
    },
    onSuccess: () => {
      refetchPending();
      refetch();
    },
  });

  const termMutation = useMutation({
    mutationFn: (sequence: number) => {
      const payload: github_com_amir_nats_monitor_internal_dto_AckTermMessageRequest = {
        sequence,
      };
      return ConsumersService.postStreamsConsumersTerm(
        consumerData.stream ?? "",
        name || "",
        payload,
      );
    },
    onSuccess: () => {
      refetchPending();
      refetch();
    },
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: {
      ack_policy?: string;
      deliver_policy?: string;
      replay_policy?: string;
      max_deliver?: number;
    }) =>
      ConsumersService.putStreamsConsumers(
        consumerData.stream ?? "",
        name || "",
        payload as any,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumer", name] });
      refetch();
      setShowEditModal(false);
      showToast("Consumer updated", "success");
    },
    onError: (err: any) => showToast(err?.body?.error || "Update failed", "error"),
  });

  const cloneMutation = useMutation({
    mutationFn: (newName: string) =>
      ConsumersService.postStreamsConsumers(consumerData.stream ?? "", {
        name: newName,
        durable: newName,
        ack_policy: (consumerData.config?.ack_policy as any) || "explicit",
        deliver_policy: (consumerData.config?.deliver_policy as any) || "all",
        replay_policy: (consumerData.config?.replay_policy as any) || "instant",
        max_deliver: consumerData.config?.max_deliver ?? -1,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      setShowCloneModal(false);
      showToast(`Consumer "${result.name}" created`, "success");
    },
    onError: (err: any) => showToast(err?.body?.error || "Clone failed", "error"),
  });

  const handleOpenEdit = () => {
    setEditForm({
      ack_policy: consumerData.config?.ack_policy || "explicit",
      deliver_policy: consumerData.config?.deliver_policy || "all",
      replay_policy: consumerData.config?.replay_policy || "instant",
      max_deliver: consumerData.config?.max_deliver ?? -1,
    });
    setShowEditModal(true);
  };

  const handleOpenClone = () => {
    setCloneName(`${name}-copy`);
    setShowCloneModal(true);
  };

  const handleResetLag = async () => {
    if (!name || !consumerData.stream) return;
    setLoadingAction("reset-lag");
    const result = await resetConsumerLag(consumerData.stream, name);
    if (result.success) {
      showToast(result.message, "success");
      refetch();
    } else {
      showToast(result.message, "error");
    }
    setLoadingAction(null);
  };

  const handleReplayMessages = async () => {
    if (!name || !consumerData.stream) return;
    setLoadingAction("replay");
    const result = await replayMessages(consumerData.stream ?? "", name || "");
    if (result.success) {
      showToast(result.message, "success");
      refetch();
    } else {
      showToast(result.message, "error");
    }
    setLoadingAction(null);
  };

  const handlePauseResume = async () => {
    if (!name || !consumerData.stream) return;
    setLoadingAction("pause-resume");
    const newState = !isPaused;
    const result = await setConsumerState(consumerData.stream, name, newState);
    if (result.success) {
      setIsPaused(newState);
      showToast(result.message, "success");
    } else {
      showToast(result.message, "error");
    }
    setLoadingAction(null);
  };

  const handleDeleteConsumer = async () => {
    if (!name || !consumerData.stream) return;
    if (!confirm(`Are you sure you want to delete consumer "${name}"?`)) return;
    setLoadingAction("delete");
    const result = await deleteConsumer(consumerData.stream, name);
    if (result.success) {
      showToast(result.message, "success");
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      navigate(`/streams/${encodeURIComponent(consumerData.stream ?? "")}`);
    } else {
      showToast(result.message, "error");
    }
    setLoadingAction(null);
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "paused":
        return Pause;
      case "stuck":
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  if (!name) return <div>Consumer not found</div>;

  const StatusIcon = getStatusIcon(consumerData.status);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/consumers"
          className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                consumerData.status === "active"
                  ? "bg-status-success/20 text-status-success"
                  : consumerData.status === "stuck"
                    ? "bg-status-error/20 text-status-error"
                    : "bg-status-warning/20 text-status-warning"
              }`}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">
                {consumerData.status}
              </span>
            </div>
            {consumerData.config?.durable && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                Durable
              </span>
            )}
          </div>
          <p className="text-dark-muted mt-1">
            Stream:{" "}
            <Link
              to={`/streams/${encodeURIComponent(consumerData.stream ?? "")}`}
              className="text-primary-400 hover:underline"
            >
              {consumerData.stream}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePauseResume}
            disabled={loadingAction !== null}
            className={`btn-secondary flex items-center gap-2 ${
              consumerData.status === "stuck" ? "text-status-success" : ""
            } ${loadingAction === "pause-resume" ? "opacity-50" : ""}`}
          >
            {loadingAction === "pause-resume" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : consumerData.status === "stuck" ||
              consumerData.status === "paused" ||
              isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className="btn-secondary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Peek Messages
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className="btn-primary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(consumerData.lag || 0).toLocaleString()}
              </p>
              <p className="text-xs text-dark-muted">Lag</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(consumerData.num_pending || 0).toLocaleString()}
              </p>
              <p className="text-xs text-dark-muted">Pending</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <FastForward className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(consumerData as { num_delivered?: number }).num_delivered?.toLocaleString() ?? "N/A"}
              </p>
              <p className="text-xs text-dark-muted">Delivered</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(consumerData as { ack_rate?: string }).ack_rate ?? "N/A"}
              </p>
              <p className="text-xs text-dark-muted">ACK Rate</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(consumerData as { paused?: boolean }).paused ? "Paused" : "Active"}
              </p>
              <p className="text-xs text-dark-muted">State</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-dark-bg p-1 rounded-lg w-fit">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "config", label: "Configuration", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-primary-600 text-white"
                : "text-dark-muted hover:text-dark-text hover:bg-dark-border"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleResetLag}
                disabled={loadingAction === "reset-lag"}
                className={`btn-secondary flex items-center gap-2 ${
                  loadingAction === "reset-lag" ? "opacity-50" : ""
                }`}
              >
                {loadingAction === "reset-lag" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SkipBack className="w-4 h-4" />
                )}
                Reset Lag
              </button>
              <button
                onClick={handleReplayMessages}
                disabled={loadingAction === "replay"}
                className={`btn-secondary flex items-center gap-2 ${
                  loadingAction === "replay" ? "opacity-50" : ""
                }`}
              >
                {loadingAction === "replay" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SkipForward className="w-4 h-4" />
                )}
                Replay Messages
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className="btn-secondary flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Peek Messages
              </button>
              <button
                onClick={handleDeleteConsumer}
                disabled={loadingAction === "delete"}
                className={`btn-secondary flex items-center gap-2 text-status-error ${
                  loadingAction === "delete" ? "opacity-50" : ""
                }`}
              >
                {loadingAction === "delete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Pending Messages ({pendingMessages?.messages?.length || 0})
            </h3>
            <button
              onClick={() => refetchPending()}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {!pendingMessages ||
          !pendingMessages.messages ||
          pendingMessages.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No Pending Messages
              </h3>
              <p className="text-dark-muted">
                {consumerData.num_pending && consumerData.num_pending > 0
                  ? `This consumer has ${consumerData.num_pending} pending messages, but they may not be fetchable (push consumer).`
                  : "This consumer has no pending messages."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMessages.messages.map((msg: any) => (
                <div key={msg.sequence} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-primary-400">
                          #{msg.sequence}
                        </span>
                        <span className="text-sm font-mono text-dark-muted">
                          {msg.subject}
                        </span>
                        <span className="text-xs text-dark-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-dark-muted">
                          Delivered: {msg.num_delivered}x
                        </span>
                      </div>
                      <pre className="text-sm p-3 bg-dark-bg rounded overflow-x-auto max-h-32">
                        <code className="text-green-400">{msg.data}</code>
                      </pre>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => ackMutation.mutate(msg.sequence)}
                        disabled={ackMutation.isPending}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        title="Ack"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          nackMutation.mutate({ sequence: msg.sequence })
                        }
                        disabled={nackMutation.isPending}
                        className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                        title="Nack"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => termMutation.mutate(msg.sequence)}
                        disabled={termMutation.isPending}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        title="Ack Term (no re-deliver)"
                      >
                        <FastForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "config" && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Consumer Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Durable</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${consumerData.config?.durable ? "bg-green-500/20 text-green-400" : "bg-dark-border"}`}
                  >
                    {consumerData.config?.durable ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Delivery Policy</span>
                  <span className="font-medium capitalize">
                    {consumerData.config?.deliver_policy || "all"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Ack Policy</span>
                  <span className="font-medium capitalize">
                    {consumerData.config?.ack_policy || "explicit"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Replay Policy</span>
                  <span className="font-medium capitalize">
                    {consumerData.config?.replay_policy || "instant"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Max Deliveries</span>
                  <span className="font-medium">
                    {consumerData.config?.max_deliver === -1
                      ? "Unlimited"
                      : consumerData.config?.max_deliver || 3}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Ack Wait</span>
                  <span className="font-medium">
                    {(consumerData.config as any)?.ack_wait ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Max Waiting</span>
                  <span className="font-medium">
                    {(consumerData.config as any)?.max_waiting ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Max Batch</span>
                  <span className="font-medium">
                    {(consumerData.config as any)?.max_batch ?? "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Subject */}
          {(consumerData.config as any)?.filter_subject && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Filter Subject</h3>
              <div className="p-3 bg-dark-bg/50 rounded-lg">
                <p className="font-mono text-sm">
                  {(consumerData.config as any).filter_subject}
                </p>
                <p className="text-xs text-dark-muted mt-1">
                  Only messages matching this subject will be delivered
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Consumer Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={handleOpenEdit} className="btn-secondary flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Edit Config
              </button>
              <button
                onClick={handleResetLag}
                disabled={loadingAction === "reset-lag"}
                className={`btn-secondary flex items-center gap-2 ${
                  loadingAction === "reset-lag" ? "opacity-50" : ""
                }`}
              >
                {loadingAction === "reset-lag" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SkipBack className="w-4 h-4" />
                )}
                Reset Lag
              </button>
              <button onClick={handleOpenClone} className="btn-secondary flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Clone Consumer
              </button>
              <button
                onClick={handleDeleteConsumer}
                disabled={loadingAction === "delete"}
                className={`btn-secondary flex items-center gap-2 text-status-error ${
                  loadingAction === "delete" ? "opacity-50" : ""
                }`}
              >
                {loadingAction === "delete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Consumer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h2 className="text-xl font-semibold">Edit Consumer: {name}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-dark-muted"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-dark-muted mb-1">Ack Policy</label>
                <select
                  className="input w-full"
                  value={editForm.ack_policy}
                  onChange={(e) => setEditForm({ ...editForm, ack_policy: e.target.value })}
                >
                  <option value="explicit">Explicit</option>
                  <option value="all">All</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Deliver Policy</label>
                <select
                  className="input w-full"
                  value={editForm.deliver_policy}
                  onChange={(e) => setEditForm({ ...editForm, deliver_policy: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="last">Last</option>
                  <option value="new">New</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Replay Policy</label>
                <select
                  className="input w-full"
                  value={editForm.replay_policy}
                  onChange={(e) => setEditForm({ ...editForm, replay_policy: e.target.value })}
                >
                  <option value="instant">Instant</option>
                  <option value="original">Original</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Max Deliver (-1 = unlimited)</label>
                <input
                  type="number"
                  className="input w-full"
                  min={-1}
                  value={editForm.max_deliver}
                  onChange={(e) => setEditForm({ ...editForm, max_deliver: parseInt(e.target.value) || -1 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-dark-border">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => updateMutation.mutate({
                  ack_policy: editForm.ack_policy,
                  deliver_policy: editForm.deliver_policy,
                  replay_policy: editForm.replay_policy,
                  max_deliver: editForm.max_deliver,
                })}
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Consumer Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h2 className="text-xl font-semibold">Clone Consumer</h2>
              <button
                onClick={() => setShowCloneModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-dark-muted"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm text-dark-muted mb-1">New Consumer Name</label>
              <input
                type="text"
                className="input w-full"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="my-consumer-copy"
              />
              <p className="text-xs text-dark-muted mt-2">
                Creates a new durable consumer on stream <span className="font-mono">{consumerData.stream}</span> with the same configuration.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-dark-border">
              <button onClick={() => setShowCloneModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => cloneMutation.mutate(cloneName)}
                disabled={cloneMutation.isPending || !cloneName.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {cloneMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Clone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
