import { useTranslation } from 'react-i18next';
import { Activity, Play, RefreshCw, StopCircle } from "lucide-react";
import { Button } from "../ui";
import { formatBytes } from "../../utils/formatters";

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
  const { t } = useTranslation();

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
              <h2 className="text-xl font-bold">{t('messages.trafficMonitor')}</h2>
            </div>
            <p className="text-sm leading-6 text-dark-muted">
              {t('messages.trafficMonitorDescription')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={onStart} disabled={isMonitoring} icon={<Play className="h-4 w-4" />}>
              {t('messages.startMonitor')}
            </Button>
            <Button variant="secondary" onClick={onStop} disabled={!isMonitoring} icon={<StopCircle className="h-4 w-4" />}>
              {t('messages.stop')}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium mb-2">{t('messages.subjects')}</label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={subjects}
              onChange={(e) => onSubjectsChange(e.target.value)}
              placeholder={t('messages.enterSubjectPlaceholder')}
              className="input flex-1 font-mono"
              disabled={isMonitoring}
            />
            <Button variant="secondary" onClick={onStart} disabled={isMonitoring} icon={<RefreshCw className="h-4 w-4" />}>
              {t('messages.restart')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-dark-muted">
            {t('messages.subjectsHelp')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <p className="text-xs text-dark-muted">{t('messages.status')}</p>
          <p className="mt-2 text-2xl font-bold">{isMonitoring ? t('messages.live') : t('messages.idle')}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-muted">{t('messages.subjects')}</p>
          <p className="mt-2 text-2xl font-bold">{subjectStats.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-muted">{t('messages.messagesLabel')}</p>
          <p className="mt-2 text-2xl font-bold">{totalMessages.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-xs text-dark-muted">{t('messages.bytes')}</p>
          <p className="mt-2 text-2xl font-bold">{formatBytes(totalBytes)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-dark-border p-4">
          <h3 className="font-semibold">{t('messages.subjectTraffic')}</h3>
        </div>
        {subjectStats.length > 0 ? (
          <div className="divide-y divide-dark-border">
            {subjectStats.map((stat) => (
              <div key={stat.subject} className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{stat.subject}</p>
                    <p className="mt-1 text-xs text-dark-muted">
                      {t('messages.lastSeen')} {formatTimestamp(stat.last_seen)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span>
                      <span className="text-dark-muted">{t('messages.messagesLabel')}:</span>{" "}
                      <span className="font-mono">{stat.count.toLocaleString()}</span>
                    </span>
                    <span>
                      <span className="text-dark-muted">{t('messages.bytesLabel')}:</span>{" "}
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
            <p>{t('messages.noTrafficCaptured')}</p>
            <p className="mt-1 text-sm">{t('messages.noTrafficCapturedDescription')}</p>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-dark-border p-4">
          <h3 className="font-semibold">{t('messages.recentEvents')}</h3>
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
                      {event.type || t('messages.event')}
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
                          {t('messages.replyLabel')}: <span className="font-mono">{event.reply}</span>
                        </p>
                      )}
                      {event.size !== undefined && (
                        <p className="text-dark-muted">
                          {t('messages.sizeLabel')}: <span className="font-mono">{formatBytes(event.size)}</span>
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
                            {stat.count.toLocaleString()} {t('messages.messagesAnd')} {formatBytes(stat.bytes)}
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
            <p>{t('messages.eventsEmpty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
