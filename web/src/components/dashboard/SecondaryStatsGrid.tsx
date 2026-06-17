import { HardDrive, Zap, Server, TrendingUp } from "lucide-react";
import StatCard from "../ui/StatCard";
import { getHealthStatus } from "../../utils/validators";

interface AccountInfo {
  memory?: number;
  storage?: number;
  streams?: number;
  consumers?: number;
  api?: { total?: number; errors?: number };
}

interface SecondaryStatsGridProps {
  account: AccountInfo;
}

export default function SecondaryStatsGrid({
  account,
}: SecondaryStatsGridProps) {
  const apiHealthStatus = getHealthStatus(
    account.api?.total || 0,
    account.api?.errors || 0,
  );

  const apiStatusColor =
    apiHealthStatus === "success"
      ? "bg-green-500/20 text-green-400"
      : apiHealthStatus === "warning"
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-red-500/20 text-red-400";

  const errorStatusColor =
    (account.api?.errors || 0) > 0
      ? "bg-red-500/20 text-red-400"
      : "bg-green-500/20 text-green-400";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={HardDrive}
        value={account.storage || 0}
        label="Storage Used"
        iconBg="bg-purple-500/20"
        iconColor="text-purple-400"
        size="small"
        formatValue={false}
      />

      <StatCard
        icon={Zap}
        value={account.memory || 0}
        label="Memory Used"
        iconBg="bg-orange-500/20"
        iconColor="text-orange-400"
        size="small"
        formatValue={false}
      />

      <StatCard
        icon={Server}
        value={account.api?.total || 0}
        label="API Calls"
        iconBg={apiStatusColor}
        size="small"
      />

      <StatCard
        icon={TrendingUp}
        value={account.api?.errors || 0}
        label="API Errors"
        iconBg={errorStatusColor}
        size="small"
      />
    </div>
  );
}
