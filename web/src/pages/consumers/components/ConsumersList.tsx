import type { ConsumerResponse as Consumer } from "../../../types";
import ConsumerRow from "./ConsumerRow";

interface ConsumersListProps {
  consumers: Consumer[];
  isLoading: boolean;
  selectedConsumers: Set<string>;
  resetLagPending: boolean;
  onToggleAll: () => void;
  onToggleSelection: (name: string) => void;
  onToggleExpansion: (name: string) => void;
  isConsumerExpanded: (name: string) => boolean;
  onTogglePauseResume: (consumer: Consumer) => void;
  onViewDetails: (name: string) => void;
  onResetLag: (consumer: Consumer) => void;
  onDelete: (consumer: Consumer) => void;
  getStatusIcon: (consumer: Consumer) => JSX.Element;
  getStatusLabel: (status: string) => string;
  getLagColor: (lag: number) => string;
}

export default function ConsumersList({
  consumers,
  isLoading,
  selectedConsumers,
  resetLagPending,
  onToggleAll,
  onToggleSelection,
  onToggleExpansion,
  isConsumerExpanded,
  onTogglePauseResume,
  onViewDetails,
  onResetLag,
  onDelete,
  getStatusIcon,
  getStatusLabel,
  getLagColor,
}: ConsumersListProps) {
  return (
    <div className="card overflow-hidden flex flex-col max-h-[600px] animate-fade-in">
      <div className="bg-dark-bg border-b border-dark-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={
                selectedConsumers.size === consumers.length && consumers.length > 0
              }
              onChange={onToggleAll}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-dark-muted">
              {selectedConsumers.size > 0
                ? `${selectedConsumers.size} selected`
                : `${consumers.length} consumers`}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-dark-muted">Loading consumers...</div>
      ) : consumers.length === 0 ? (
        <div className="p-8 text-center text-dark-muted">
          No consumers found matching your filters
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-thin flex-1 divide-y divide-dark-border">
          {consumers.map((consumer, index) => {
            const consumerName = consumer.name || "";
            if (!consumerName) return null;
            const delayClass = index === 0 ? "" : `animate-delay-${Math.min(index * 50, 500)}`;

            return (
              <div
                key={consumerName}
                className={`animate-slide-in animate-duration-200 ${delayClass}`}
              >
                <ConsumerRow
                  consumer={consumer}
                  isSelected={selectedConsumers.has(consumerName)}
                  isExpanded={isConsumerExpanded(consumerName)}
                  resetLagPending={resetLagPending}
                  onToggleSelection={onToggleSelection}
                  onToggleExpansion={onToggleExpansion}
                  onTogglePauseResume={onTogglePauseResume}
                  onViewDetails={onViewDetails}
                  onResetLag={onResetLag}
                  onDelete={onDelete}
                  getStatusIcon={getStatusIcon}
                  getStatusLabel={getStatusLabel}
                  getLagColor={getLagColor}
                />
              </div>
            );
          })}
        </div>
      )}
      <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
        {consumers.length} consumer{consumers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
