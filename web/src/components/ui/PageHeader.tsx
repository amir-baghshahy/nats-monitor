import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  sseConnected?: boolean;
  sseLabel?: string;
  sseDisconnectedLabel?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  sseConnected,
  sseLabel,
  sseDisconnectedLabel,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary-400" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-dark-muted truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {sseConnected !== undefined && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-bg rounded-lg border border-dark-border">
            {sseConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">{sseLabel || "Live"}</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <span className="text-xs text-yellow-400">{sseDisconnectedLabel || "Connecting..."}</span>
              </>
            )}
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
