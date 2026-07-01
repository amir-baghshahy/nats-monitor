import { LucideIcon } from "lucide-react";
import { formatNumber } from "../../utils/formatters";

interface StatCardProps {
  /**
   * Icon to display
   */
  icon: LucideIcon;

  /**
   * Main value to display
   */
  value: number | string;

  /**
   * Label for the stat
   */
  label: string;

  /**
   * Background color class for icon container
   * @default "bg-primary-500/20"
   */
  iconBg?: string;

  /**
   * Icon color class
   * @default "text-primary-400"
   */
  iconColor?: string;

  /**
   * Size variant
   * @default "normal"
   */
  size?: "normal" | "small";

  /**
   * Whether to format number with locale
   * @default true
   */
  formatValue?: boolean;

  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * StatCard displays a statistic with icon, value, and label
 * Used extensively in dashboard and stats grids
 */
export default function StatCard({
  icon: Icon,
  value,
  label,
  iconBg = "bg-primary-500/20",
  iconColor = "text-primary-400",
  size = "normal",
  formatValue = true,
  onClick,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" && formatValue ? formatNumber(value) : value;

  const iconSize = size === "small" ? "w-3.5 h-3.5" : "w-4 h-4";
  const valueSize = size === "small" ? "text-base" : "text-xl";
  const labelSize = "text-[11px]";
  const containerSize = size === "small" ? "w-7 h-7" : "w-8 h-8";

  const card = (
    <div className="card">
      <div className="flex items-center gap-2">
        <div
          className={`${containerSize} rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`${iconSize} ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className={`${valueSize} font-bold leading-tight truncate`}>{displayValue}</p>
          <p className={`${labelSize} text-dark-muted truncate`}>{label}</p>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full">
        {card}
      </button>
    );
  }

  return card;
}
