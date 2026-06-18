import { X } from "lucide-react";

interface SubscriptionBarProps {
  /**
   * Set of active subscriptions
   */
  subscriptions: Set<string>;

  /**
   * Subscribe callback
   */
  onSubscribe: (subject: string) => void;

  /**
   * Unsubscribe callback
   */
  onUnsubscribe: (subject: string) => void;
}

/**
 * SubscriptionBar manages NATS subject subscriptions
 */
export default function SubscriptionBar({
  subscriptions,
  onSubscribe,
  onUnsubscribe,
}: SubscriptionBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement;
      const subject = target.value.trim();
      if (subject) {
        onSubscribe(subject);
        target.value = "";
      }
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Enter subject (e.g., 'orders.*', 'events.>')"
            className="input w-full font-mono"
            onKeyPress={handleKeyPress}
          />
          <p className="text-xs text-dark-muted mt-2">
            A subject is the NATS address messages are sent to. Subscribe to watch matching traffic.
          </p>
        </div>

        {subscriptions.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from(subscriptions).map((sub) => (
              <div
                key={sub}
                className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm font-mono"
              >
                <span>{sub}</span>
                <button
                  onClick={() => onUnsubscribe(sub)}
                  className="hover:text-red-400 transition-colors"
                  aria-label={`Unsubscribe from ${sub}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {subscriptions.size === 0 && (
        <p className="text-xs text-dark-muted mt-2">
          Tip: Use wildcards like{" "}
          <code className="bg-dark-bg px-1 rounded">*</code> for single level or{" "}
          <code className="bg-dark-bg px-1 rounded">&gt;</code> for all levels
        </p>
      )}
    </div>
  );
}
