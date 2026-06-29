import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "../../../components/ui/Select";

interface AlertsFiltersProps {
  filterSeverity: "all" | "critical" | "warning" | "info";
  onFilterChange: (severity: "all" | "critical" | "warning" | "info") => void;
}

export default function AlertsFilters({
  filterSeverity,
  onFilterChange,
}: AlertsFiltersProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-dark-muted" />
        <Select
          value={filterSeverity}
          onChange={(value) => onFilterChange(value as any)}
          options={[
            { value: "all", label: t("alerts.allSeverities") },
            { value: "critical", label: t("alerts.critical") },
            { value: "warning", label: t("alerts.warning") },
            { value: "info", label: t("alerts.info") },
          ]}
          className="w-40"
          aria-label={t("alerts.filterBySeverity")}
        />
      </div>
    </div>
  );
}
