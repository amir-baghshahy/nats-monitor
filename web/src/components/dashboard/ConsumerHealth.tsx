import type { github_com_amir_nats_monitor_internal_dto_ConsumerResponse as ConsumerResponse } from "../../types";
import { getConsumerStatus } from "../../utils/validators";

interface ConsumerHealthProps {
  consumers: ConsumerResponse[];
}

export default function ConsumerHealth({ consumers }: ConsumerHealthProps) {
  if (!consumers || consumers.length === 0) {
    return null;
  }

  const topLagging = [...consumers]
    .sort(
      (a, b) => (b.lag || b.num_pending || 0) - (a.lag || a.num_pending || 0),
    )
    .slice(0, 5);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Consumer Health (Highest Lag)</h3>
      </div>

      <div className="space-y-2">
        {topLagging.map((consumer) => {
          const lag = consumer.lag || consumer.num_pending || 0;
          const status = getConsumerStatus(lag);

          const statusText =
            status === "error"
              ? "Critical"
              : status === "warning"
                ? "Slow"
                : "Healthy";

          return (
            <div
              key={consumer.name}
              className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{consumer.name}</p>
                <p className="text-xs text-dark-muted">
                  {consumer.stream || "Not specified"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    status === "error"
                      ? "text-red-400"
                      : status === "warning"
                        ? "text-yellow-400"
                        : "text-green-400"
                  }`}
                >
                  {lag.toLocaleString()} lag
                </p>
                <p className="text-xs text-dark-muted">{statusText}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
