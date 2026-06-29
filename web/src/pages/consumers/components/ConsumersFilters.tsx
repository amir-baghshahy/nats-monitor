import { useTranslation } from "react-i18next";
import { Filter, Search } from "lucide-react";

import type { ConsumerFilterStatus } from "../hooks/useConsumersPage";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

interface ConsumersFiltersProps {
  searchQuery: string;
  selectedStream: string;
  filterStatus: ConsumerFilterStatus;
  showMoreFilters: boolean;
  streamOptions: string[];
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onStreamChange: (value: string) => void;
  onStatusChange: (value: ConsumerFilterStatus) => void;
  onShowMoreFiltersToggle: () => void;
  onClear: () => void;
  getStatusLabel: (status: string) => string;
}

const statusOptions = ["all", "active", "stuck", "idle"] as const;

export default function ConsumersFilters({
  searchQuery,
  selectedStream,
  filterStatus,
  showMoreFilters,
  streamOptions,
  activeFilterCount,
  onSearchChange,
  onStreamChange,
  onStatusChange,
  onShowMoreFiltersToggle,
  onClear,
  getStatusLabel,
}: ConsumersFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="card mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-muted" />
            <input
              type="text"
              placeholder={t("consumers.searchPlaceholder")}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="input pl-11"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[420px] xl:flex-none">
            <Select
              value={selectedStream}
              onChange={onStreamChange}
              options={[
                { value: "all", label: t("consumers.allStreams") },
                ...streamOptions.map((name) => ({ value: name, label: name })),
              ]}
              aria-label={t("consumers.allStreams")}
            />

            <Select
              value={filterStatus}
              onChange={(value) =>
                onStatusChange(value as ConsumerFilterStatus)
              }
              options={[
                { value: "all", label: t("consumers.allStatus") },
                { value: "active", label: t("consumers.active") },
                { value: "stuck", label: t("consumers.stuck") },
                { value: "idle", label: t("consumers.idle") },
              ]}
              aria-label={t("consumers.allStatus")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-dark-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-dark-muted">
              {t("common.filters")}
            </span>
            {activeFilterCount === 0 ? (
              <span className="rounded-full bg-dark-bg px-3 py-1 text-xs text-dark-muted">
                {t("consumers.showingAllConsumers")}
              </span>
            ) : null}
            {searchQuery ? (
              <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                {t("consumers.searchFilter", { value: searchQuery })}
              </span>
            ) : null}
            {selectedStream !== "all" ? (
              <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                {t("consumers.streamFilter", { value: selectedStream })}
              </span>
            ) : null}
            {filterStatus !== "all" ? (
              <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-300 ring-1 ring-primary-500/30">
                {t("consumers.statusFilter", {
                  value: getStatusLabel(filterStatus),
                })}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onClear}
              disabled={activeFilterCount === 0}
              variant="secondary"
            >
              {t("consumers.clearFilters")}
            </Button>
            <Button
              onClick={onShowMoreFiltersToggle}
              variant="secondary"
              icon={<Filter className="h-4 w-4" />}
              iconPosition="left"
            >
              {showMoreFilters
                ? t("consumers.lessFilters")
                : t("consumers.moreFilters")}
            </Button>
          </div>
        </div>

        {showMoreFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-dark-border/50 bg-dark-bg/40 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-dark-muted">
                {t("consumers.quickStatus")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium ring-1 transition-all ${
                      filterStatus === status
                        ? "bg-primary-600 text-white ring-primary-500/50"
                        : "bg-dark-card text-dark-muted ring-dark-border hover:bg-dark-border hover:text-dark-text"
                    }`}
                  >
                    {status === "all"
                      ? t("common.all")
                      : getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-dark-muted">
                {t("consumers.stream")}
              </p>
              <Select
                value={selectedStream}
                onChange={onStreamChange}
                options={[
                  { value: "all", label: t("consumers.allStreams") },
                  ...streamOptions.map((name) => ({
                    value: name,
                    label: name,
                  })),
                ]}
                className="mt-3"
                aria-label={t("consumers.stream")}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-dark-muted">
                {t("common.search").replace("...", "")}
              </p>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("consumers.typeToFilter")}
                className="input mt-3"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
