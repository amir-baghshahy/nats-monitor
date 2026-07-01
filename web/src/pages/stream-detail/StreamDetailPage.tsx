import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowLeft,
  Copy as CopyIcon,
  Database,
  Download,
  FileText,
  Filter,
  HardDrive,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useStreamDetail } from "./hooks/useStreamDetail";
import EditStreamModal from "./components/EditStreamModal";
import { StatCard, PanelCard, EmptyState, Tabs } from "../../components/ui";
import { Button } from "../../components/ui";
import { formatBytes } from "../../utils/formatters";

export default function StreamDetailPage() {
  const { t } = useTranslation();
  const {
    name,
    stream: streamData,
    consumers,
    activeTab,
    isPaused,
    loadingAction,
    showEditModal,
    editForm,
    updatePending,
    setActiveTab,
    setIsPaused,
    setShowEditModal,
    setEditForm,
    refetch,
    handlePurgeStream,
    handleDeleteStream,
    handleEditConfig,
    handleUpdateStream,
    handleCloneStream,
    navigate,
  } = useStreamDetail();

  if (!name) return <div>{t("streams.notFound")}</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-4 mb-4">
        <Link
          to="/streams"
          className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{name}</h1>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                (streamData.state?.num_pending || 0) > 1000
                  ? "bg-status-warning/20 text-status-warning"
                  : "bg-status-success/20 text-status-success"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isPaused ? "" : "animate-pulse"}`}
              />
              <span className="text-sm font-medium">
                {isPaused
                  ? t("streams.paused")
                  : (streamData.state?.num_pending || 0) > 1000
                    ? t("streams.highLag")
                    : t("streams.healthy")}
              </span>
            </div>
          </div>
          <p className="text-dark-muted mt-1">
            {streamData.config?.subjects?.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={
              isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )
            }
            onClick={() => setIsPaused(!isPaused)}
          />
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
          />
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={() =>
              window.open(
                `/api/export/streams/${encodeURIComponent(name)}`,
                "_blank",
              )
            }
          >
            {t("streams.export")}
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setActiveTab("consumers")}
          >
            {t("streams.addConsumer")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
        <StatCard
          icon={MessageSquare}
          value={(streamData.state?.messages || 0).toLocaleString()}
          label={t("streams.messages")}
          formatValue={false}
        />
        <StatCard
          icon={HardDrive}
          value={formatBytes(streamData.state?.bytes || 0)}
          label={t("streams.storage")}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
          formatValue={false}
        />
        <StatCard
          icon={Users}
          value={streamData.state?.consumers || 0}
          label={t("streams.consumers")}
          iconBg="bg-green-500/20"
          iconColor="text-green-400"
        />
        <StatCard
          icon={TrendingUp}
          value={(streamData.state?.num_pending || 0).toLocaleString()}
          label="Lag"
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
          formatValue={false}
        />
        <StatCard
          icon={Database}
          value={
            streamData.config?.storage === "file"
              ? t("streams.file")
              : t("streams.memory")
          }
          label={t("streams.storageType")}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
          formatValue={false}
        />
        <StatCard
          icon={Zap}
          value={streamData.config?.replicas || 1}
          label={t("streams.replicas")}
          iconBg="bg-purple-500/20"
          iconColor="text-purple-400"
        />
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: t("streams.overview"), icon: Activity },
          { id: "messages", label: t("streams.messages"), icon: MessageSquare },
          { id: "consumers", label: t("streams.consumers"), icon: Users },
          { id: "config", label: t("streams.configuration"), icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="space-y-6">
          <PanelCard title={t("streams.streamInformation")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted mb-1">
                  {t("streams.firstSequence")}
                </p>
                <p className="font-mono font-medium">
                  {streamData.state?.first_seq?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted mb-1">
                  {t("streams.lastSequence")}
                </p>
                <p className="font-mono font-medium">
                  {streamData.state?.last_seq?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted mb-1">
                  {t("streams.created")}
                </p>
                <p className="text-sm">
                  {streamData.state?.first_ts
                    ? new Date(streamData.state?.first_ts).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted mb-1">
                  {t("streams.lastMessage")}
                </p>
                <p className="text-sm">
                  {streamData.state?.last_ts
                    ? new Date(streamData.state?.last_ts).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </PanelCard>
        </div>
      )}

      {activeTab === "messages" && (
        <PanelCard
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                  <input
                    type="text"
                    placeholder={t("streams.searchMessagesPlaceholder")}
                    className="input pl-10"
                  />
                </div>
                <Button
                  variant="secondary"
                  icon={<Filter className="w-4 h-4" />}
                  onClick={() => navigate(`/messages`)}
                >
                  Filters
                </Button>
              </div>
            </div>
          }
        >
          <div className="text-center py-8 text-dark-muted">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t("streams.useMessageBrowser")}</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-sm text-dark-muted">
                {(streamData.state?.messages || 0).toLocaleString()}{" "}
                {t("streams.messages")}
              </span>
              <Button
                variant="primary"
                onClick={() =>
                  navigate(`/messages?stream=${encodeURIComponent(name)}`)
                }
              >
                {t("streams.openMessageBrowser")}
              </Button>
            </div>
          </div>
        </PanelCard>
      )}

      {activeTab === "consumers" && (
        <div className="space-y-4">
          {consumers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("streams.noConsumers")}
              action={{
                label: t("streams.createConsumer"),
                onClick: () => setActiveTab("consumers"),
              }}
            />
          ) : (
            consumers.map((consumer: any) => (
              <PanelCard key={consumer.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-2 rounded-full ${consumer.status === "active" ? "status-success" : "status-warning"}`}
                    />
                    <div>
                      <Link
                        to={`/consumers/${encodeURIComponent(consumer.name)}`}
                        className="font-medium text-primary-400 hover:underline"
                      >
                        {consumer.name}
                      </Link>
                      <p className="text-xs text-dark-muted mt-1">
                        {consumer.config?.durable
                          ? t("streams.durable")
                          : t("streams.ephemeral")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-medium">
                        {(consumer.lag || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-dark-muted">
                        {t("streams.lag")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">
                        {consumer.ack_rate || "N/A"}
                      </p>
                      <p className="text-xs text-dark-muted">
                        {t("streams.ackRate")}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/consumers/${encodeURIComponent(consumer.name)}`,
                        )
                      }
                    >
                      {t("streams.manage")}
                    </Button>
                  </div>
                </div>
              </PanelCard>
            ))
          )}
        </div>
      )}

      {activeTab === "config" && (
        <div className="space-y-6">
          <PanelCard title={t("streams.streamConfiguration")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-muted">{t("streams.name")}</span>
                  <span className="font-medium">{streamData.config?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">
                    {t("streams.storage")}
                  </span>
                  <span className="font-medium">
                    {streamData.config?.storage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">
                    {t("streams.retention")}
                  </span>
                  <span className="font-medium">
                    {streamData.config?.retention}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">
                    {t("streams.replicas")}
                  </span>
                  <span className="font-medium">
                    {streamData.config?.replicas}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-muted">{t("streams.maxAge")}</span>
                  <span className="font-medium">
                    {streamData.config?.max_age
                      ? streamData.config.max_age
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">
                    {t("streams.maxBytes")}
                  </span>
                  <span className="font-medium">
                    {formatBytes(streamData.config?.max_bytes || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">
                    {t("streams.maxMsgSize")}
                  </span>
                  <span className="font-medium">
                    {formatBytes((streamData.config as any)?.max_msg_size || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">
                    {t("streams.subjects")}
                  </span>
                  <span className="font-mono text-sm">
                    {streamData.config?.subjects?.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard title={t("streams.streamActions")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="secondary"
                icon={<FileText className="w-4 h-4" />}
                onClick={handleEditConfig}
              >
                {t("streams.editConfig")}
              </Button>
              <Button
                variant="secondary"
                onClick={handlePurgeStream}
                disabled={loadingAction === "purge"}
                icon={
                  loadingAction === "purge" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )
                }
              >
                {t("streams.purgeStream")}
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeleteStream}
                disabled={loadingAction === "delete"}
                className="text-status-error"
                icon={
                  loadingAction === "delete" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )
                }
              >
                {t("streams.deleteStream")}
              </Button>
              <Button
                variant="secondary"
                icon={<CopyIcon className="w-4 h-4" />}
                onClick={handleCloneStream}
              >
                {t("streams.cloneStream")}
              </Button>
            </div>
          </PanelCard>
        </div>
      )}

      {showEditModal && (
        <EditStreamModal
          name={name}
          editForm={editForm}
          updatePending={updatePending}
          setEditForm={setEditForm}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateStream}
        />
      )}
    </div>
  );
}
