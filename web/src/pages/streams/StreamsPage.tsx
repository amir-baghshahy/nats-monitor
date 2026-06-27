import { useNavigate } from "react-router-dom";
import { useStreamsPage } from "./hooks/useStreamsPage";
import StreamsFilters from "./components/StreamsFilters";
import StreamsHeader from "./components/StreamsHeader";
import StreamsList from "./components/StreamsList";
import StreamsStats from "./components/StreamsStats";
import CreateStreamModal from "./components/CreateStreamModal";
import type { CreateStreamRequest } from "../../types";

export default function StreamsPage() {
  const navigate = useNavigate();
  const {
    filteredStreams,
    paginatedStreams,
    stats,
    selected,
    page,
    isLoading,
    sseConnected,
    showCreateModal,
    createPending,
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    toggleSelection,
    clearSelection,
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
  } = useStreamsPage();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <StreamsHeader
        sseConnected={sseConnected}
        onShowCreateModal={() => setShowCreateModal(true)}
        onRefetch={refetch}
      />

      <StreamsStats stats={stats} />

      <StreamsFilters
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
      />

      <StreamsList
        streams={paginatedStreams}
        filteredStreams={filteredStreams}
        isLoading={isLoading}
        selected={selected}
        page={page}
        hasActiveFilters={hasActiveFilters}
        toggleSelection={toggleSelection}
        clearSelection={clearSelection}
        isSelected={isSelected}
        toggleExpansion={toggleExpansion}
        isExpanded={isExpanded}
        goToPage={goToPage}
        onViewDetails={(streamName) => navigate(`/streams/${encodeURIComponent(streamName)}`)}
        onDelete={handleDelete}
        onPurge={handlePurge}
        onExportStream={handleExportStream}
        onExportMessages={handleExportMessages}
        onExportAll={handleExportAll}
        onBulkDelete={handleBulkDelete}
        onSelectAll={handleSelectAll}
        getStreamHealthStatus={getStreamHealthStatus}
        getStreamName={getStreamName}
      />

      {showCreateModal && (
        <CreateStreamModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data: CreateStreamRequest) => createMutation.mutate(data)}
          isPending={createPending}
        />
      )}
    </div>
  );
}
