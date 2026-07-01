interface PanelCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyState?: React.ReactNode;
}

export default function PanelCard({
  title,
  subtitle,
  icon,
  header,
  footer,
  maxHeight,
  children,
  className = "",
  loading = false,
  empty = false,
  emptyState,
}: PanelCardProps) {
  return (
    <div
      className={`card overflow-hidden flex flex-col ${className}`}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
    >
      {/* Header */}
      {(header || title) && (
        <div className="px-3 py-2.5 border-b border-dark-border bg-dark-bg/50 flex-shrink-0">
          {header || (
            <div className="flex items-center gap-2">
              {icon && (
                <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-xs font-semibold">{title}</h3>
                {subtitle && <p className="text-[10px] text-dark-muted">{subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : empty ? (
        <div className="flex-1 flex items-center justify-center p-4">
          {emptyState}
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin flex-1 p-3">{children}</div>
      )}

      {/* Footer */}
      {footer && (
        <div className="px-3 py-2 border-t border-dark-border bg-dark-bg/50 text-center text-[10px] text-dark-muted flex-shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
