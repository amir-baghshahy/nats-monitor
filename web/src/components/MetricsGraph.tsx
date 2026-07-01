import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { HealthService, MetricsService } from '../types'
import { TrendingUp, TrendingDown, Activity, HardDrive, Cpu } from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, YAxis
} from 'recharts'

interface DataPoint {
  timestamp: number
  value: number
}

interface ChartPoint {
  t: number
  v: number
}

interface MetricsGraphProps {
  title: string
  icon: React.ReactNode
  color: string
  queryKey: string[]
  queryFn: () => Promise<any>
  getValue: (data: any) => number
  maxPoints?: number
  formatValue?: (v: number) => string
}

const DEFAULT_FORMAT = (v: number) => v.toLocaleString()

export function MetricsGraph({
  title,
  icon,
  color,
  queryKey,
  queryFn,
  getValue,
  maxPoints = 30,
  formatValue = DEFAULT_FORMAT,
}: MetricsGraphProps) {
  const { t } = useTranslation()
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])

  const { data } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (data == null) return
    const value = getValue(data)
    const now = Date.now()
    setDataPoints(prev => {
      const updated = [...prev, { timestamp: now, value }]
      return updated.length > maxPoints ? updated.slice(-maxPoints) : updated
    })
  }, [data, getValue, maxPoints])

  const currentValue = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0
  const previousValue = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : currentValue
  const change = currentValue - previousValue
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0

  const isPositiveGood = title === t('messages.messagesLabel') || title === t('messages.messageRate')
  const trendColor =
    change > 0 ? (isPositiveGood ? 'text-green-400' : 'text-red-400')
    : change < 0 ? (isPositiveGood ? 'text-red-400' : 'text-green-400')
    : 'text-dark-muted'

  const chartData: ChartPoint[] = dataPoints.map(p => ({ t: p.timestamp, v: p.value }))

  const hexColor = color.startsWith('rgb')
    ? rgbToHex(color)
    : color

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: color.replace(')', ', 0.15)').replace('rgb', 'rgba') }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-dark-muted truncate leading-tight">{title}</p>
            <p className="text-base font-bold leading-tight tabular-nums">{formatValue(currentValue)}</p>
          </div>
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
          {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
          <span>{change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
        </div>
      </div>

      <div className="h-14 w-full">
        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`grad-${hexColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={hexColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={hexColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border border-dark-border bg-dark-card/95 px-2 py-1 text-xs shadow-lg">
                      <span className="font-mono" style={{ color: hexColor }}>
                        {formatValue(payload[0].value as number)}
                      </span>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={hexColor}
                strokeWidth={1.5}
                fill={`url(#grad-${hexColor})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-dark-muted/60">
            {t('common.collectingData') || 'Collecting data…'}
          </div>
        )}
      </div>
    </div>
  )
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/\d+/g)
  if (!match || match.length < 3) return '#94a3b8'
  const [r, g, b] = match.map(Number)
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')
}

export function SystemMetrics() {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricsGraph
        title={t('messages.messagesLabel')}
        icon={<Activity className="w-4 h-4 text-green-400" />}
        color="rgb(74, 222, 128)"
        queryKey={['dashboardStats']}
        queryFn={() => HealthService.getDashboardStats()}
        getValue={(data) => data?.messages || 0}
      />
      <MetricsGraph
        title={t('common.memory')}
        icon={<Cpu className="w-4 h-4 text-orange-400" />}
        color="rgb(251, 146, 60)"
        queryKey={['systemMetrics']}
        queryFn={() => MetricsService.getMetricsSystem()}
        getValue={(data) => data?.memory?.used || 0}
        formatValue={(v) => v >= 1048576 ? `${(v / 1048576).toFixed(1)}MB` : v >= 1024 ? `${(v / 1024).toFixed(0)}KB` : `${v}B`}
      />
      <MetricsGraph
        title={t('common.storage')}
        icon={<HardDrive className="w-4 h-4 text-purple-400" />}
        color="rgb(192, 132, 252)"
        queryKey={['systemMetrics-storage']}
        queryFn={() => MetricsService.getMetricsSystem()}
        getValue={(data) => data?.storage?.used || 0}
        formatValue={(v) => v >= 1048576 ? `${(v / 1048576).toFixed(1)}MB` : v >= 1024 ? `${(v / 1024).toFixed(0)}KB` : `${v}B`}
      />
      <MetricsGraph
        title={t('messages.messageRate')}
        icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
        color="rgb(34, 211, 238)"
        queryKey={['rateMetrics']}
        queryFn={() => MetricsService.getMetricsRates()}
        getValue={(data) =>
          data?.streams?.reduce((sum: number, s: any) => sum + (s?.messages || 0), 0) || 0
        }
      />
    </div>
  )
}

export function ResourceUsageBar({
  label, used, max, color,
}: { label: string; used: number; max: number; color: string }) {
  const { t } = useTranslation()
  const percentage = max > 0 ? (used / max) * 100 : 0

  return (
    <div className="bg-dark-bg rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-dark-muted">{formatBytes(used)} / {formatBytes(max)}</span>
      </div>
      <div className="w-full bg-dark-border rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[10px] ${percentage > 90 ? 'text-red-400' : percentage > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
          {percentage.toFixed(1)}%
        </span>
        <span className="text-[10px] text-dark-muted">
          {percentage > 90 ? t('common.critical') : percentage > 70 ? t('common.warning') : t('common.healthy')}
        </span>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}
