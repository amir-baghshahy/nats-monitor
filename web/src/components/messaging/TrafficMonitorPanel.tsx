import { Activity, Play, RefreshCw, StopCircle } from "lucide-react";

interface MonitorEvent {
  type?: string;
  subject?: string;
  reply?: string;
  size?: number;
  timestamp?: number | string;
  data?: string;
  data_base64?: string;
  count?: number;
  bytes?: number;
  last_seen?: number;
  stats?: MonitorStats[];
}

interface MonitorStats {
  subject: string;
  count: number;
  bytes: number;
  last_seen?: number;
}

interface TrafficMonitorPanelProps {
  subjects: string;
  onSubjectsChange: (subjects: string) => void;
  isMonitoring: boolean;
  events: MonitorEvent[];
  onStart: () => void;
  onStop: () => void;
}

function formatBytes(bytes = 0) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatTimestamp(timestamp?: number | string) {
  if (!timestamp) return "N/A";
  return new Date(Number(timestamp) * 1000).toLocaleTimeString();
}

function getSubjectStats(events: MonitorEvent[]): MonitorStats[] {
  const stats = new Map<string, MonitorStats>();

  events.forEach((event) => {
    if (event.type === "stats" && event.stats) {
      event.stats.forEach((item) => stats.set(item.subject, item));
    }

    if (event.type === "message" && event.subject) {
      const current = stats.get(event.subject) || {
        subject: event.subject,
        count: 0,
        bytes: 0,
      };
      stats.set(event.subject, {
        ...current,
        count: current.count + 1,
        bytes: current.bytes + (event.size || 0),
        last_seen: Number(event.timestamp) || current.last_seen,
      });
    }
  });

  return Array.from(stats.values()).sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject));
}

export default function TrafficMonitorPanel({
  subjects,
  onSubjectsChange,
  isMonitoring,
  events,
  onStart,
  onStop,
}: TrafficMonitorPanelProps) {
  const subjectStats = getSubjectStats(events);
  const totalMessages = subjectStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalBytes = subjectStats.reduce((sum, stat) => sum + stat.bytes, 0);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary-400" />
              <h2 className="text-xl font-bold">Traffic Monitor</h2>
            </div>
            <p className="text-sm leading-6 text-dark-muted">
              Stream Core NATS traffic for one or more subjects. Use wildcards like orders.* to watch related subjects.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStart}
              disabled={isMonitoring}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Start Monitor
            </button>
            <button
              type="button"
              onClick={onStop}
              disabled={!isMonitoring}
              className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <StopCircle className="h-4 w-4" />
              Stop
            </button>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium mb-2">Subjects</label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={subjects}
              onChange={(e) => onSubjectsChange(e.target.value)}
              placeholder="orders.*, events.created"
              className="input flex-1 font-mono"
              disabled={isMonitoring}
            />
            <button
              type="button"
              onClick={onStart}
              disabled={isMonitoring}
              className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Restart
            </button>
          </div>
          <p className="mt-2 text-xs text-dark-muted">
            Separate multiple subjects with commas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <p className="text-xs text-dark-muted">Status</p>
          <p className="mt-2 text-2xl font-bold">{isMonitoring ? "Live" : "Idle"}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-muted">Subjects</p>
          <p className="mt-2 text-2xl font-bold">{subjectStats.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-muted">Messages</p>
          <p className="mt-2 text-2xl font-bold">{totalMessages.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-muted">Bytes</p>
          <p className="mt-2 text-2xl font-bold">{formatBytes(totalBytes)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-dark-border p-4">
          <h3 className="font-semibold">Subject Traffic</h3>
        </div>
        {subjectStats.length > 0 ? (
          <div className="divide-y divide-dark-border">
            {subjectStats.map((stat) => (
              <div key={stat.subject} className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{stat.subject}</p>
                    <p className="mt-1 text-xs text-dark-muted">
                      Last seen {formatTimestamp(stat.last_seen)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span>
                      <span className="text-dark-muted">Messages:</span>{" "}
                      <span className="font-mono">{stat.count.toLocaleString()}</span>
                    </span>
                    <span>
                      <span className="text-dark-muted">Bytes:</span>{" "}
                      <span className="font-mono">{formatBytes(stat.bytes)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-dark-muted">
            <Activity className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No traffic captured yet.</p>
            <p className="mt-1 text-sm">Start the monitor and publish messages to the selected subjects.</p>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-dark-border p-4">
          <h3 className="font-semibold">Recent Events</h3>
        </div>
        {events.length > 0 ? (
          <div className="max-h-[520px] overflow-y-auto divide-y divide-dark-border">
            {events.map((event, index) => (
              <div key={`${event.type}-${event.subject}-${event.timestamp}-${index}`} className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.type === "message"
                        ? "bg-primary-500/15 text-primary-300"
                        : "bg-blue-500/15 text-blue-300"
                    }`}>
                      {event.type || "event"}
                    </span>
                    {event.subject && (
                      <span className="font-mono text-sm text-primary-300 truncate">
                        {event.subject}
                      </span>
                    )}
                    <span className="text-xs text-dark-muted">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>

                  {event.type === "message" && (
                    <div className="space-y-2 text-sm">
                      {event.reply && (
                        <p className="text-dark-muted">
                          Reply: <span className="font-mono">{event.reply}</span>
                        </p>
                      )}
                      {event.size !== undefined && (
                        <p className="text-dark-muted">
                          Size: <span className="font-mono">{formatBytes(event.size)}</span>
                        </p>
                      )}
                      {event.data && (
                        <pre className="max-h-32 overflow-auto rounded-lg bg-dark-bg p-3 text-xs">
                          <code>{event.data}</code>
                        </pre>
                      )}
                    </div>
                  )}

                  {event.type === "stats" && event.stats && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {event.stats.map((stat) => (
                        <div key={stat.subject} className="rounded-lg bg-dark-bg p-3 text-sm">
                          <p className="font-mono text-primary-300 truncate">{stat.subject}</p>
                          <p className="mt-1 text-dark-muted">
                            {stat.count.toLocaleString()} messages · {formatBytes(stat.bytes)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-dark-muted">
            <p>Events will appear here while monitoring is active.</p>
          </div>
        )}
      </div>
    </div>
  );
}
