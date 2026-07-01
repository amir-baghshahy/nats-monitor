import { LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: "small" | "normal" | "large";
  iconClassName?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "normal",
  iconClassName,
}: EmptyStateProps) {
  const sizeClasses = {
    small: "p-8",
    normal: "p-12",
    large: "p-16",
  };

  const iconSize = {
    small: "h-10 w-10",
    normal: "h-16 w-16",
    large: "h-20 w-20",
  };

  const titleSize = {
    small: "text-base",
    normal: "text-lg",
    large: "text-xl",
  };

  return (
    <div className={cn("card", "text-center", sizeClasses[size])}>
      {Icon && (
        <div className={cn(
          "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-primary/50",
          iconClassName || "text-content-tertiary"
        )}>
          <Icon className={iconSize[size]} />
        </div>
      )}
      <h3 className={cn(titleSize[size], "font-semibold text-content-primary")}>{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-content-secondary">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}
