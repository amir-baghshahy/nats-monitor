import { useTranslation } from "react-i18next";
import { SearchBar } from "../../../components/common";
import Select from "../../../components/ui/Select";
import type { StreamFilters } from "../hooks/useStreamsPage";

interface StreamsFiltersProps {
  filters: StreamFilters;
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof StreamFilters>(field: K, value: StreamFilters[K]) => void;
  resetFilters: () => void;
}

export default function StreamsFilters({
  filters,
  hasActiveFilters,
  updateFilter,
  resetFilters,
}: StreamsFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="card mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <SearchBar
            value={filters.search}
            onChange={(value) => updateFilter("search", value)}
            placeholder={t("streams.searchPlaceholder")}
            className="flex-1"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[420px] xl:flex-none">
            <Select
              value={filters.storage}
              onChange={(value) => updateFilter("storage", value as StreamFilters["storage"])}
              options={[
                { value: "all", label: t("streams.allStorage") },
                { value: "file", label: t("streams.file") },
                { value: "memory", label: t("streams.memory") },
              ]}
              aria-label={t("streams.storage")}
            />

            <Select
              value={filters.status}
              onChange={(value) => updateFilter("status", value as StreamFilters["status"])}
              options={[
                { value: "all", label: t("streams.allStatus") },
                { value: "healthy", label: t("streams.healthy") },
                { value: "warning", label: t("streams.warning") },
                { value: "critical", label: t("streams.critical") },
              ]}
              aria-label={t("streams.status")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-dark-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
             <span className="text-xs font-medium text-dark-muted">{t("streams.filters")}:</span>
            {!hasActiveFilters ? (
               <span className="rounded-full bg-dark-bg px-3 py-1 text-xs text-dark-muted">
                 {t("streams.showingAllStreams")}
               </span>
            ) : null}
            {filters.search ? (
               <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                 {t("streams.searchFilter")}: {filters.search}
               </span>
            ) : null}
            {filters.storage !== "all" ? (
               <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                 {t("streams.storageFilter")}: {filters.storage}
               </span>
            ) : null}
            {filters.status !== "all" ? (
               <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                 {t("streams.statusFilter")}: {filters.status}
               </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="btn-secondary"
            >
               {t("streams.clearFilters")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
