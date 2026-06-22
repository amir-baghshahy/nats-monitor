import { RefreshCw, Wifi, WifiOff } from "lucide-react";

interface DashboardHeaderProps {
  /**
   * SSE connection status
   */
  sseConnected: boolean;

  /**
   * Refresh callback
   */
  onRefresh: () => void;
}

/**
 * Dashboard header with title, status, and refresh button
 */
export default function DashboardHeader({
  sseConnected,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-dark-muted">NATS JetStream Overview</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-lg border border-dark-border">
            {sseConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400">Polling</span>
              </>
            )}
          </div>

          <button
            onClick={onRefresh}
            className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
