import { LucideIcon } from "lucide-react";

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
    <div className={`card text-center ${sizeClasses[size]}`}>
      {Icon && (
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-bg/60 ${iconClassName || "text-dark-muted"}`}>
          <Icon className={`${iconSize[size]}`} />
        </div>
      )}
      <h3 className={`${titleSize[size]} font-semibold text-dark-text`}>{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-dark-muted">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-6">
          {action.label}
        </button>
      )}
    </div>
  );
}
