import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";

interface DashboardHeaderProps {
  sseConnected: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({
  sseConnected,
  onRefresh,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-bold leading-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-xs text-dark-muted">{t("dashboard.subtitle")}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-bg rounded-lg border border-dark-border">
          {sseConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">{t("common.live")}</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="text-xs text-yellow-400">
                {t("common.polling")}
              </span>
            </>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRefresh}
        >
          {t("common.refresh")}
        </Button>
      </div>
    </div>
  );
}
