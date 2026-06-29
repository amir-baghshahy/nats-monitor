import { Handle, Position, NodeProps } from "reactflow";
import { Users, Pause, Play, AlertTriangle } from "lucide-react";
import { formatNumber } from "../../../../utils/formatters";

export function ConsumerNode({ data, selected }: NodeProps) {
  const healthColor =
    data.health === "critical"
      ? "text-red-400"
      : data.health === "warning"
        ? "text-orange-400"
        : "text-green-400";

  const healthBgColor =
    data.health === "critical"
      ? "bg-red-500/20"
      : data.health === "warning"
        ? "bg-orange-500/20"
        : "bg-green-500/20";

  const isPaused = data.status === "paused";

  return (
    <div className="consumer-node">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-dark-border !border-2 !border-dark-muted"
      />
      <div
        className={`rounded-xl border-2 ${selected ? "border-primary-500" : "border-dark-border/60"} bg-dark-card p-3 shadow-lg min-w-[180px] transition-all hover:shadow-xl`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${healthBgColor}`}
          >
            <Users className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <h4
            className="font-medium text-dark-text text-sm truncate max-w-[120px]"
            title={data.name}
          >
            {data.name}
          </h4>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-dark-muted">Lag:</span>
            <span className={`font-medium tabular-nums ${healthColor}`}>
              {formatNumber(data.lag || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dark-muted">Ack Rate:</span>
            <span className="font-medium text-dark-text tabular-nums">
              {data.ackRate || "0"}/s
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1.5">
            {isPaused ? (
              <>
                <Pause className="h-3 w-3 text-orange-400" />
                <span className="text-orange-400 font-medium">Paused</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-green-400" />
                <span className="text-green-400 font-medium">Active</span>
              </>
            )}
          </div>

          {data.health === "critical" && (
            <div className="flex items-center gap-1 mt-1 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span>High lag</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
