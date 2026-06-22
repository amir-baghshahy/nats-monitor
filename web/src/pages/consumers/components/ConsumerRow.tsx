import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Pause,
  Play,
} from "lucide-react";
import type { github_com_amir_baghshahy_nats_monitor_internal_dto_ConsumerResponse as Consumer } from "../../../types";

interface ConsumerRowProps {
  consumer: Consumer;
  isSelected: boolean;
  isExpanded: boolean;
  resetLagPending: boolean;
  onToggleSelection: (name: string) => void;
  onToggleExpansion: (name: string) => void;
  onTogglePauseResume: (consumer: Consumer) => void;
  onViewDetails: (name: string) => void;
  onResetLag: (consumer: Consumer) => void;
  onDelete: (consumer: Consumer) => void;
  getStatusIcon: (consumer: Consumer) => JSX.Element;
  getStatusLabel: (status: string) => string;
  getLagColor: (lag: number) => string;
}

export default function ConsumerRow({
  consumer,
  isSelected,
  isExpanded,
  resetLagPending,
  onToggleSelection,
  onToggleExpansion,
  onTogglePauseResume,
  onViewDetails,
  onResetLag,
  onDelete,
  getStatusIcon,
  getStatusLabel,
  getLagColor,
}: ConsumerRowProps) {
  const consumerName = consumer.name || "";
  if (!consumerName) return null;

  return (
    <div className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors">
      <div className="p-4 hover:bg-dark-bg/50 transition-colors">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(consumerName)}
            className="w-4 h-4 rounded"
          />

          <button
            onClick={() => onToggleExpansion(consumerName)}
            className="p-1 hover:bg-dark-bg rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-dark-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-dark-muted" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {getStatusIcon(consumer)}
            <span className="text-sm">{getStatusLabel(consumer.status || "")}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium">{consumerName}</p>
            <div className="flex items-center gap-2 mt-1">
              <Link
                to={`/streams/${encodeURIComponent(consumer.stream || "")}`}
                className="text-xs text-primary-400 hover:underline"
              >
                {consumer.stream}
              </Link>
              {consumer.config?.durable && (
                <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                  Durable
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className={`font-medium ${getLagColor(consumer.lag || 0)}`}>
                {(consumer.lag || 0).toLocaleString()}
              </p>
              <p className="text-xs text-dark-muted">Lag</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{consumer.ack_rate || "N/A"}</p>
              <p className="text-xs text-dark-muted">ACK Rate</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{consumer.num_pending || consumer.lag || 0}</p>
              <p className="text-xs text-dark-muted">Pending</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePauseResume(consumer)}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              title={
                !consumer.paused
                  ? "Pause consumer"
                  : "Resume consumer"
              }
            >
              {!consumer.paused ? (
                <Pause className="w-4 h-4 text-dark-muted" />
              ) : (
                <Play className="w-4 h-4 text-dark-muted" />
              )}
            </button>
            <Link
              to={`/consumers/${encodeURIComponent(consumer.name || "")}`}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4 text-dark-muted" />
            </Link>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pl-8 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Delivery Policy</p>
                <p className="font-medium">{(consumer.config as { delivery?: string })?.delivery || "all"}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Ack Policy</p>
                <p className="font-medium">{consumer.config?.ack_policy || "explicit"}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Replay Policy</p>
                <p className="font-medium">{consumer.config?.replay_policy || "instant"}</p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-3">
                <p className="text-xs text-dark-muted">Max Deliveries</p>
                <p className="font-medium">{consumer.config?.max_deliver || "-1"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onViewDetails(consumerName)}
                className="btn-secondary text-sm"
              >
                Edit Configuration
              </button>
              <button
                onClick={() => onViewDetails(consumerName)}
                className="btn-secondary text-sm"
              >
                View Messages
              </button>
              <button
                onClick={() => onResetLag(consumer)}
                disabled={resetLagPending}
                className="btn-secondary text-sm"
              >
                Reset Lag
              </button>
              <button
                onClick={() => onDelete(consumer)}
                className="btn-secondary text-sm text-status-error"
              >
                Delete Consumer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
