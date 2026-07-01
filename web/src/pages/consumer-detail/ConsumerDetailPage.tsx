import { useTranslation } from "react-i18next";
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
import { StatCard, PanelCard, Tabs } from "../../components/ui";
import { Button } from "../../components/ui";

export default function ConsumerDetailPage() {
  const { t } = useTranslation();
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

  if (!name) return <div>{t("consumers.notFound")}</div>;

  const StatusIcon = (() => {
    switch (consumerData.status) {
      case "active": return CheckCircle;
      case "paused": return Pause;
      case "stuck": return AlertTriangle;
      default: return TrendingUp;
    }
  })();

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/consumers" className="p-2 hover:bg-dark-bg rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{name}</h1>
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
            {t("consumers.stream")}:{" "}
            <Link to={`/streams/${encodeURIComponent(consumerData.stream ?? "")}`} className="text-primary-400 hover:underline">
              {consumerData.stream}
            </Link>
          </p>
        </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handlePauseResume}
              disabled={loadingAction !== null}
              icon={loadingAction === "pause-resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : consumerData.status === "stuck" || consumerData.status === "paused" || isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            />
           <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()} />
           <Button variant="secondary" icon={<Eye className="w-4 h-4" />} onClick={() => setActiveTab("messages")}>
             {t("consumers.peekMessages")}
           </Button>
           <Button variant="primary" icon={<Settings className="w-4 h-4" />} onClick={() => setActiveTab("config")}>
             {t("consumers.configure")}
           </Button>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
        <StatCard
          icon={TrendingUp}
          value={(consumerData.lag || 0).toLocaleString()}
          label={t("consumers.totalLag")}
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
          formatValue={false}
        />
        <StatCard
          icon={MessageSquare}
          value={(consumerData.num_pending || 0).toLocaleString()}
          label={t("consumers.pending")}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
          formatValue={false}
        />
        <StatCard
          icon={FastForward}
          value={(consumerData as any).num_delivered?.toLocaleString() ?? t("common.na")}
          label={t("consumers.delivered")}
          iconBg="bg-purple-500/20"
          iconColor="text-purple-400"
          formatValue={false}
        />
        <StatCard
          icon={CheckCircle}
          value={(consumerData as any).ack_rate ?? t("common.na")}
          label={t("consumers.avgAckRate")}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
          formatValue={false}
        />
        <StatCard
          icon={TrendingUp}
          value={(consumerData as any).paused ? t("streams.paused") : t("consumers.active")}
          label={t("consumers.state")}
          formatValue={false}
        />
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "config", label: "Configuration", icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="space-y-6">
          <PanelCard title={t("consumers.quickActions")}>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <Button
                 variant="secondary"
                 onClick={handleResetLag}
                 disabled={loadingAction === "reset-lag"}
                 icon={loadingAction === "reset-lag" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipBack className="w-4 h-4" />}
               >
                 {t("consumers.resetLag")}
               </Button>
               <Button
                 variant="secondary"
                 onClick={handleReplayMessages}
                 disabled={loadingAction === "replay"}
                 icon={loadingAction === "replay" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
               >
                 {t("consumers.replayMessages")}
               </Button>
               <Button variant="secondary" icon={<Eye className="w-4 h-4" />} onClick={() => setActiveTab("messages")}>
                 {t("consumers.peekMessages")}
               </Button>
               <Button
                 variant="secondary"
                 onClick={handleDeleteConsumer}
                 disabled={loadingAction === "delete"}
                 className="text-status-error"
                 icon={loadingAction === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
               >
                 {t("common.delete")}
               </Button>
             </div>
          </PanelCard>
        </div>
      )}

      {activeTab === "messages" && (
        <PanelCard
          header={
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t("consumers.pendingMessages", { count: pendingMessages?.messages?.length || 0 })}
              </h3>
               <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetchPending()}>
                 {t("common.refresh")}
               </Button>
            </div>
          }
        >

          {!pendingMessages || !pendingMessages.messages || pendingMessages.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t("consumers.noPendingMessages")}</h3>
              <p className="text-dark-muted">
                {consumerData.num_pending && consumerData.num_pending > 0
                  ? t("consumers.noPendingMessagesDescription", { count: consumerData.num_pending })
                  : t("consumers.noPendingMessagesDescriptionEmpty")}
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
                        <span className="text-xs text-dark-muted">{t("consumers.deliveredCount", { count: msg.num_delivered })}</span>
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
                        title={t("consumers.ack")}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNack(msg.sequence)}
                        disabled={nackPending}
                        className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                        title={t("consumers.nack")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTerm(msg.sequence)}
                        disabled={termPending}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        title={t("consumers.ackTerm")}
                      >
                        <FastForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      )}

      {activeTab === "config" && (
        <div className="space-y-6">
          <PanelCard title={t("consumers.consumerConfiguration")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">Durable</span>
                  <span className={`px-2 py-1 rounded text-xs ${consumerData.config?.durable ? "bg-green-500/20 text-green-400" : "bg-dark-border"}`}>
                    {consumerData.config?.durable ? t("consumers.yes") : t("consumers.no")}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.deliveryPolicy")}</span>
                  <span className="font-medium capitalize">{consumerData.config?.deliver_policy || "all"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.ackPolicy")}</span>
                  <span className="font-medium capitalize">{consumerData.config?.ack_policy || "explicit"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.replayPolicy")}</span>
                  <span className="font-medium capitalize">{consumerData.config?.replay_policy || "instant"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.maxDeliveries")}</span>
                  <span className="font-medium">
                    {consumerData.config?.max_deliver === -1 ? t("common.unlimited") : consumerData.config?.max_deliver || 3}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.ackWait")}</span>
                  <span className="font-medium">{(consumerData.config as any)?.ack_wait ?? t("common.na")}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.maxWaiting")}</span>
                  <span className="font-medium">{(consumerData.config as any)?.max_waiting ?? t("common.na")}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-lg">
                  <span className="text-dark-muted">{t("consumers.maxBatch")}</span>
                  <span className="font-medium">{(consumerData.config as any)?.max_batch ?? t("common.na")}</span>
                </div>
              </div>
            </div>
          </PanelCard>

          {(consumerData.config as any)?.filter_subject && (
            <PanelCard title={t("consumers.filterSubject")}>
              <div className="p-3 bg-dark-bg/50 rounded-lg">
                <p className="font-mono text-sm">{(consumerData.config as any).filter_subject}</p>
                <p className="text-xs text-dark-muted mt-1">{t("consumers.filterSubjectHelp")}</p>
              </div>
            </PanelCard>
          )}

           <PanelCard title={t("consumers.consumerActions")}>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <Button variant="secondary" icon={<Settings className="w-4 h-4" />} onClick={handleOpenEdit}>
                 {t("consumers.editConsumer")}
               </Button>
               <Button
                 variant="secondary"
                 onClick={handleResetLag}
                 disabled={loadingAction === "reset-lag"}
                 icon={loadingAction === "reset-lag" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipBack className="w-4 h-4" />}
               >
                 {t("consumers.resetLag")}
               </Button>
               <Button variant="secondary" icon={<Copy className="w-4 h-4" />} onClick={handleOpenClone}>
                 {t("consumers.cloneConsumer")}
               </Button>
               <Button
                 variant="secondary"
                 onClick={handleDeleteConsumer}
                 disabled={loadingAction === "delete"}
                 className="text-status-error"
                 icon={loadingAction === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
               >
                 {t("common.delete")}
               </Button>
             </div>
           </PanelCard>
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
