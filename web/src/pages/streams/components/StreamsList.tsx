import { Database, Download, RefreshCw, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BulkActions, Pagination } from "../../../components/common";
import { EmptyState } from "../../../components/ui";
import type { github_com_amir_nats_monitor_internal_dto_StreamResponse as Stream } from "../../../types";
import StreamRow from "./StreamRow";

interface StreamsListProps {
  streams: Stream[];
  filteredStreams: Stream[];
  isLoading: boolean;
  selected: Set<string>;
  page: number;
  hasActiveFilters: boolean;
  toggleSelection: (item: string) => void;
  clearSelection: () => void;
  isSelected: (item: string) => boolean;
  toggleExpansion: (item: string) => void;
  isExpanded: (item: string) => boolean;
  goToPage: (page: number) => void;
  onViewDetails: (streamName: string) => void;
  onDelete: (streamName: string) => Promise<void>;
  onPurge: (streamName: string) => Promise<void>;
  onExportStream: (streamName: string, format?: "json" | "csv" | "txt") => void;
  onExportMessages: (streamName: string, subject?: string) => void;
  onExportAll: () => void;
  onBulkDelete: () => Promise<void>;
  onSelectAll: () => void;
  getStreamHealthStatus: (
    stream: Stream,
  ) => "all" | "healthy" | "warning" | "critical";
  getStreamName: (stream: Stream) => string;
}

export default function StreamsList({
  streams,
  filteredStreams,
  isLoading,
  selected,
  page,
  hasActiveFilters,
  toggleSelection,
  clearSelection,
  isSelected,
  toggleExpansion,
  isExpanded,
  goToPage,
  onViewDetails,
  onDelete,
  onPurge,
  onExportStream,
  onExportMessages,
  onExportAll,
  onBulkDelete,
  onSelectAll,
  getStreamHealthStatus,
  getStreamName,
}: StreamsListProps) {
  const actions = [
    {
      label: "Export All",
      icon: Download as LucideIcon,
      onClick: onExportAll,
    },
    {
      label: "Delete",
      icon: Trash2 as LucideIcon,
      onClick: onBulkDelete,
      variant: "danger" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No Streams Found"
        description={
          hasActiveFilters
            ? "Try adjusting your filters"
            : "Create your first stream to get started"
        }
      />
    );
  }

  return (
    <>
      <BulkActions
        selectedCount={selected.size}
        totalCount={streams.length}
        onSelectAll={onSelectAll}
        onClearSelection={clearSelection}
        actions={actions}
      />

      <div className="card overflow-hidden flex flex-col max-h-[600px]">
        <div className="overflow-y-auto scrollbar-thin flex-1 divide-y divide-dark-border animate-fade-in">
          {streams.map((stream, index) => {
          const streamName = getStreamName(stream);
          const healthStatus = getStreamHealthStatus(stream);
          const isItemSelected = isSelected(streamName);
          const isItemExpanded = isExpanded(streamName);
          const delayClass = index === 0 ? "" : `animate-delay-${Math.min(index * 50, 500)}`;

          return (
            <div
              key={streamName}
              className={`animate-slide-in animate-duration-200 ${delayClass}`}
            >
              <StreamRow
                stream={stream}
                streamName={streamName}
                healthStatus={healthStatus}
                isItemSelected={isItemSelected}
                isItemExpanded={isItemExpanded}
                toggleSelection={toggleSelection}
                toggleExpansion={toggleExpansion}
                onViewDetails={onViewDetails}
                onDelete={onDelete}
                onPurge={onPurge}
                onExportStream={onExportStream}
                onExportMessages={onExportMessages}
              />
            </div>
          );
        })}
        </div>
        <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
          {streams.length} stream{streams.length !== 1 ? 's' : ''}
        </div>
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
  );
}
