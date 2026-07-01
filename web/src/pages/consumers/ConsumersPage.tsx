import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConsumersPage } from "./hooks/useConsumersPage";
import ConsumersFilters from "./components/ConsumersFilters";
import ConsumersHeader from "./components/ConsumersHeader";
import ConsumersList from "./components/ConsumersList";
import { ConsumersStats } from "./components/ConsumersHeader";

export default function ConsumersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    searchQuery,
    selectedStream,
    filterStatus,
    showMoreFilters,
    selectedConsumers,
    filteredConsumers,
    totalConsumers,
    stats,
    streamOptions,
    activeFilterCount,
    isLoading,
    sseConnected,
    pauseResumePending,
    resetLagPending,
    deletePending,
    setSearchQuery,
    setSelectedStream,
    setFilterStatus,
    setShowMoreFilters,
    toggleConsumerSelection,
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
  } = useConsumersPage();

  return (
    <div className="p-4 md:p-6">
      <ConsumersHeader
        sseConnected={sseConnected}
        selectedCount={selectedConsumers.size}
        pauseResumePending={pauseResumePending}
        deletePending={deletePending}
        onBulkResume={handleBulkResume}
        onBulkPause={handleBulkPause}
        onBulkDelete={handleBulkDelete}
        onRefetch={refetch}
        onNavigateStreams={() => navigate("/streams")}
      />

      <ConsumersStats stats={stats} />

      <ConsumersFilters
        searchQuery={searchQuery}
        selectedStream={selectedStream}
        filterStatus={filterStatus}
        showMoreFilters={showMoreFilters}
        streamOptions={streamOptions}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearchQuery}
        onStreamChange={setSelectedStream}
        onStatusChange={setFilterStatus}
        onShowMoreFiltersToggle={() => setShowMoreFilters(!showMoreFilters)}
        onClear={clearFilters}
        getStatusLabel={getStatusLabel}
      />

      <ConsumersList
        consumers={filteredConsumers}
        isLoading={isLoading}
        selectedConsumers={selectedConsumers}
        resetLagPending={resetLagPending}
        onToggleAll={toggleAll}
        onToggleSelection={toggleConsumerSelection}
        onToggleExpansion={toggleExpand}
        isConsumerExpanded={isConsumerExpanded}
        onTogglePauseResume={handleTogglePauseResume}
        onViewDetails={(name) => navigate(`/consumers/${encodeURIComponent(name)}`)}
        onResetLag={handleResetLag}
        onDelete={handleDeleteConsumer}
        getStatusIcon={getStatusIcon}
        getStatusLabel={getStatusLabel}
        getLagColor={getLagColor}
      />

      <div className="mt-4 flex items-center justify-between text-sm text-dark-muted">
        <span>
          {t('consumers.showingConsumers', { filtered: filteredConsumers.length, total: totalConsumers })}
        </span>
      </div>
    </div>
  );
}
