import { useState } from "react";
import { ChevronDown, ChevronUp, Server, Radio, Clock, Download, Upload, Wifi, WifiOff } from "lucide-react";
import type { ConnectionInfo } from "../../types";
import { useTranslation } from "react-i18next";

interface ConnectionStatusProps {
  connected: boolean;
  connections: ConnectionInfo[];
}

const INITIAL_VISIBLE = 5;

function formatNumber(v: number | undefined) {
  return new Intl.NumberFormat().format(v || 0);
}

export default function ConnectionStatus({ connected, connections }: ConnectionStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  const list = connections || [];
  const visible = expanded ? list : list.slice(0, INITIAL_VISIBLE);
  const hasMore = list.length > INITIAL_VISIBLE;

  const totalSubs = list.reduce((s, c) => s + (c.subs_count || 0), 0);
  const totalPending = list.reduce((s, c) => s + (c.pending_bytes || 0), 0);
  const serverCount = new Set(list.map(c => c.server || c.server_id || "unknown")).size;

  return (
    <div className="card mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
            <Radio className="h-3.5 w-3.5 text-primary-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight">{t('dashboard.connectionStatus')}</h3>
            <p className="text-[11px] text-dark-muted truncate">
              {list.length === 0
                ? (t('dashboard.noActiveConnections') || 'No active connections')
                : t('dashboard.activeConnections', { count: list.length })}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 ${
          connected
            ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/25'
            : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25'
        }`}>
          {connected
            ? <Wifi className="h-3 w-3" />
            : <WifiOff className="h-3 w-3" />}
          {connected ? t('common.connected') : t('common.disconnected')}
        </span>
      </div>

      {/* Summary stats — always show */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { label: t('dashboard.active'), value: list.length },
          { label: t('dashboard.subscriptions'), value: formatNumber(totalSubs) },
          { label: t('dashboard.pending'), value: formatNumber(totalPending) },
          { label: t('dashboard.servers'), value: serverCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-dark-bg/50 px-2 py-2 text-center">
            <p className="text-[10px] text-dark-muted leading-tight">{label}</p>
            <p className="text-sm font-semibold tabular-nums mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="rounded-lg border border-dashed border-dark-border/50 bg-dark-bg/30 py-8 text-center">
          <Radio className="mx-auto mb-2 h-7 w-7 opacity-25" />
          <p className="text-xs text-dark-muted">{t('dashboard.noActiveConnections') || 'No active connections'}</p>
          <p className="text-[11px] text-dark-muted/60 mt-0.5">
            {t('dashboard.connectionsWillAppear') || 'Client connections will appear here'}
          </p>
        </div>
      )}

      {/* Connection list */}
      {list.length > 0 && (
        <div className="space-y-1">
          {visible.map((conn) => (
            <ConnectionRow key={conn.cid ?? conn.ip ?? conn.name ?? Math.random()} conn={conn} t={t} />
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dark-border/40 py-1.5 text-[11px] text-dark-muted hover:text-dark-text hover:bg-dark-bg/40 transition-colors mt-1"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" />{t('dashboard.showLess') || 'Show less'}</>
              ) : (
                <><ChevronDown className="h-3 w-3" />{t('dashboard.showMore', { count: list.length - INITIAL_VISIBLE }) || `Show ${list.length - INITIAL_VISIBLE} more`}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectionRow({ conn, t }: { conn: ConnectionInfo; t: any }) {
  const [open, setOpen] = useState(false);

  const label = conn.user || conn.name || (t('connections.anonymous') || 'Anonymous');
  const addr = conn.ip ? `${conn.ip}${conn.port ? `:${conn.port}` : ''}` : null;

  return (
    <div className="rounded-lg border border-dark-border/40 bg-dark-bg/20 overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-dark-bg/50 transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />

        <Server className="h-3.5 w-3.5 text-dark-muted shrink-0" />

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs font-medium truncate">{label}</span>
          {addr && (
            <span className="text-[10px] font-mono text-dark-muted/70 truncate hidden sm:block" title={addr}>
              {addr}
            </span>
          )}
        </div>

        {conn.cid != null && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-primary-500/10 text-primary-400 shrink-0">
            #{conn.cid}
          </span>
        )}

        <div className="hidden sm:flex items-center gap-1 shrink-0 text-[10px] text-dark-muted">
          <span>{conn.subs_count || 0} subs</span>
        </div>

        <ChevronDown className={`h-3 w-3 text-dark-muted shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-dark-border/40 px-3 py-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
          <DetailRow label={t('dashboard.rtt') || 'RTT'} value={conn.rtt || '—'} />
          <DetailRow label={t('dashboard.subscriptions') || 'Subs'} value={conn.subs_count ?? 0} />
          <DetailRow label={t('dashboard.pending') || 'Pending'} value={formatNumber(conn.pending_bytes)} />
          <DetailRow
            label={t('dashboard.in') || 'In'}
            value={
              <span className="flex items-center gap-1">
                <Download className="h-2.5 w-2.5" />
                {formatNumber(conn.in_msgs)}
              </span>
            }
          />
          <DetailRow
            label={t('dashboard.out') || 'Out'}
            value={
              <span className="flex items-center gap-1">
                <Upload className="h-2.5 w-2.5" />
                {formatNumber(conn.out_msgs)}
              </span>
            }
          />
          <DetailRow
            label={t('dashboard.lastActivity') || 'Last active'}
            value={
              conn.last_activity ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(conn.last_activity).toLocaleTimeString()}
                </span>
              ) : '—'
            }
          />
          {conn.server && (
            <div className="col-span-full border-t border-dark-border/30 pt-1.5 mt-0.5 flex items-center gap-2">
              <span className="text-dark-muted shrink-0">{t('dashboard.natsServer') || 'NATS server'}</span>
              <span className="font-mono text-[10px] text-dark-muted/70 truncate" title={conn.server}>
                {conn.server}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-dark-muted shrink-0">{label}</span>
      <span className="font-medium text-right tabular-nums">{value}</span>
    </div>
  );
}
