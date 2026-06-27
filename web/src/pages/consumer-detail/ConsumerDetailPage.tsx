import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  FastForward,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Settings,
  SkipBack,
  SkipForward,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useConsumerDetail } from "./hooks/useConsumerDetail";
import EditConsumerModal from "./components/EditConsumerModal";
import CloneConsumerModal from "./components/CloneConsumerModal";

export default function ConsumerDetailPage() {
  const {
    name,
    consumerData,
    activeTab,
    isPaused,
    loadingAction,
    showEditModal,
    showCloneModal,
    cloneName,
    editForm,
    pendingMessages,
    ackPending,
    nackPending,
    termPending,
    updatePending,
    clonePending,
    setActiveTab,
    setShowEditModal,
    setShowCloneModal,
    setCloneName,
    setEditForm,
    refetch,
    refetchPending,
    handleResetLag,
    handleReplayMessages,
    handlePauseResume,
    handleDeleteConsumer,
    handleOpenEdit,
    handleOpenClone,
    handleUpdateConsumer,
    handleCloneConsumer,
    handleAck,
    handleNack,
    handleTerm,
  } = useConsumerDetail();

  if (!name) return <div>Consumer not found</div>;

  const StatusIcon = (() => {
    switch (consumerData.status) {
      case "active": return CheckCircle;
      case "paused": return Pause;
      case "stuck": return AlertTriangle;
      default: return TrendingUp;
    }
  })();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/consumers" className="p-2 hover:bg-dark-bg rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              consumerData.status === "active"
                ? "bg-status-success/20 text-status-success"
                : consumerData.status === "stuck"
                  ? "bg-status-error/20 text-status-error"
                  : "bg-status-warning/20 text-status-warning"
            }`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{consumerData.status}</span>
            </div>
            {consumerData.config?.durable && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">Durable</span>
            )}
          </div>
          <p className="text-dark-muted mt-1">
            Stream:{" "}
            <Link to={`/streams/${encodeURIComponent(consumerData.stream ?? "")}`} className="text-primary-400 hover:underline">
              {consumerData.stream}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePauseResume}
            disabled={loadingAction !== null}
            className={`btn-secondary flex items-center gap-2 ${consumerData.status === "stuck" ? "text-status-success" : ""} ${loadingAction === "pause-resume" ? "opacity-50" : ""}`}
          >
            {loadingAction === "pause-resume" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : consumerData.status === "stuck" || consumerData.status === "paused" || isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveTab("messages")} className="btn-secondary flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Peek Messages
          </button>
          <button onClick={() => setActiveTab("config")} className="btn-primary flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(consumerData.lag || 0).toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{(consumerData.num_pending || 0).toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{(consumerData as any).num_delivered?.toLocaleString() ?? "N/A"}</p>
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
              <p className="text-2xl font-bold">{(consumerData as any).ack_rate ?? "N/A"}</p>
              <p className="text-xs text-dark-muted">ACK Rate</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(consumerData as any).paused ? "Paused" : "Active"}</p>
              <p className="text-xs text-dark-muted">State</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-dark-bg p-1 rounded-lg w-fit">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "config", label: "Configuration", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleResetLag}
                disabled={loadingAction === "reset-lag"}
                className={`btn-secondary flex items-center gap-2 ${loadingAction === "reset-lag" ? "opacity-50" : ""}`}
              >
                {loadingAction === "reset-lag" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipBack className="w-4 h-4" />}
                Reset Lag
              </button>
              <button
                onClick={handleReplayMessages}
                disabled={loadingAction === "replay"}
                className={`btn-secondary flex items-center gap-2 ${loadingAction === "replay" ? "opacity-50" : ""}`}
              >
                {loadingAction === "replay" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
                Replay Messages
              </button>
              <button onClick={() => setActiveTab("messages")} className="btn-secondary flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Peek Messages
              </button>
              <button
                onClick={handleDeleteConsumer}
                disabled={loadingAction === "delete"}
                className={`btn-secondary flex items-center gap-2 text-status-error ${loadingAction === "delete" ? "opacity-50" : ""}`}
              >
                {loadingAction === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
            <button onClick={() => refetchPending()} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {!pendingMessages || !pendingMessages.messages || pendingMessages.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Pending Messages</h3>
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
                        <span className="font-mono text-sm text-primary-400">#{msg.sequence}</span>
                        <span className="text-sm font-mono text-dark-muted">{msg.subject}</span>
                        <span className="text-xs text-dark-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-dark-muted">Delivered: {msg.num_delivered}x</span>
                      </div>
                      <pre className="text-sm p-3 bg-dark-bg rounded overflow-x-auto max-h-32">
                        <code className="text-green-400">{msg.data}</code>
                      </pre>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAck(msg.sequence)}
                        disabled={ackPending}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        title="Ack"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNack(msg.sequence)}
                        disabled={nackPending}
                        className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                        title="Nack"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTerm(msg.sequence)}
                        disabled={termPending}
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
            <h3 className="text-lg font-semibold mb-4">Consumer Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Durable</span>
                  <span className={`px-2 py-1 rounded text-xs ${consumerData.config?.durable ? "bg-green-500/20 text-green-400" : "bg-dark-border"}`}>
                    {consumerData.config?.durable ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Delivery Policy</span>
                  <span className="font-medium capitalize">{consumerData.config?.deliver_policy || "all"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Ack Policy</span>
                  <span className="font-medium capitalize">{consumerData.config?.ack_policy || "explicit"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Replay Policy</span>
                  <span className="font-medium capitalize">{consumerData.config?.replay_policy || "instant"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Max Deliveries</span>
                  <span className="font-medium">
                    {consumerData.config?.max_deliver === -1 ? "Unlimited" : consumerData.config?.max_deliver || 3}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Ack Wait</span>
                  <span className="font-medium">{(consumerData.config as any)?.ack_wait ?? "N/A"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Max Waiting</span>
                  <span className="font-medium">{(consumerData.config as any)?.max_waiting ?? "N/A"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Max Batch</span>
                  <span className="font-medium">{(consumerData.config as any)?.max_batch ?? "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {(consumerData.config as any)?.filter_subject && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Filter Subject</h3>
              <div className="p-3 bg-dark-bg/50 rounded-lg">
                <p className="font-mono text-sm">{(consumerData.config as any).filter_subject}</p>
                <p className="text-xs text-dark-muted mt-1">Only messages matching this subject will be delivered</p>
              </div>
            </div>
          )}

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
                className={`btn-secondary flex items-center gap-2 ${loadingAction === "reset-lag" ? "opacity-50" : ""}`}
              >
                {loadingAction === "reset-lag" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipBack className="w-4 h-4" />}
                Reset Lag
              </button>
              <button onClick={handleOpenClone} className="btn-secondary flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Clone Consumer
              </button>
              <button
                onClick={handleDeleteConsumer}
                disabled={loadingAction === "delete"}
                className={`btn-secondary flex items-center gap-2 text-status-error ${loadingAction === "delete" ? "opacity-50" : ""}`}
              >
                {loadingAction === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditConsumerModal
          name={name}
          editForm={editForm}
          updatePending={updatePending}
          setEditForm={setEditForm}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateConsumer}
        />
      )}

      {showCloneModal && (
        <CloneConsumerModal
          name={name}
          stream={consumerData.stream}
          cloneName={cloneName}
          clonePending={clonePending}
          setCloneName={setCloneName}
          onClose={() => setShowCloneModal(false)}
          onClone={handleCloneConsumer}
        />
      )}
    </div>
  );
}
