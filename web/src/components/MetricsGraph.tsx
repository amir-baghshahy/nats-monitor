import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { HealthService, MetricsService } from '../types'
import { TrendingUp, TrendingDown, Activity, HardDrive, Cpu } from 'lucide-react'

interface DataPoint {
  timestamp: number
  value: number
}

interface MetricsGraphProps {
  title: string
  icon: React.ReactNode
  color: string
  queryKey: string[]
  queryFn: () => Promise<any>
  getValue: (data: any) => number
  maxPoints?: number
}

export function MetricsGraph({
  title,
  icon,
  color,
  queryKey,
  queryFn,
  getValue,
  maxPoints = 30,
}: MetricsGraphProps) {
  const { t } = useTranslation()
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])

  const { data } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (data) {
      const value = getValue(data)
      const now = Date.now()

      setDataPoints(prev => {
        const updated = [...prev, { timestamp: now, value }]
        if (updated.length > maxPoints) {
          return updated.slice(-maxPoints)
        }
        return updated
      })
    }
  }, [data, getValue, maxPoints])

  const currentValue = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0
  const previousValue = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : currentValue
  const change = currentValue - previousValue
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0

  // Color logic based on metric type
  const isGoodIncrease = title === t('messages.messagesLabel') || title === t('messages.messageRate')
  const colorClass = change > 0
    ? (isGoodIncrease ? 'text-green-400' : 'text-red-400')
    : change < 0
      ? (isGoodIncrease ? 'text-red-400' : 'text-green-400')
      : 'text-gray-400'

  // Generate SVG sparkline points
  const sparklinePoints = dataPoints.length >= 2
    ? dataPoints.map((point, index) => {
        const x = (index / (maxPoints - 1)) * 100
        const maxValue = Math.max(...dataPoints.map(p => p.value), 1)
        const minValue = Math.min(...dataPoints.map(p => p.value), 0)
        const range = maxValue - minValue || 1
        const y = 90 - ((point.value - minValue) / range) * 70 // Keep within 10-90% height for padding
        return `${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    : ''

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.replace(')', ', 0.2)').replace('rgb', 'rgba') }}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xl font-bold">{currentValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${colorClass}`}>
            {change > 0 && <TrendingUp className="w-3 h-3" />}
            {change < 0 && <TrendingDown className="w-3 h-3" />}
            <span>{change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-dark-muted">{t('common.vsLastPeriod')}</p>
        </div>
      </div>

      {/* Modern SVG Sparkline */}
      <div className="relative h-20 bg-dark-bg rounded-lg overflow-hidden">
        {dataPoints.length >= 2 ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Subtle grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

            {/* Area fill with gradient */}
            <defs>
              <linearGradient id={`gradient-${color.replace(/\D/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,100 ${sparklinePoints} 100,100`}
              fill={`url(#gradient-${color.replace(/\D/g, '')})`}
            />

            {/* Main sparkline */}
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* End point dot */}
            {dataPoints.length > 0 && (() => {
              const points = sparklinePoints.split(' ')
              const lastPoint = points[points.length - 1]?.split(',')
              return lastPoint && lastPoint[1] ? (
                <circle
                  cx="100"
                  cy={lastPoint[1]}
                  r="2.5"
                  fill={color}
                />
              ) : null
            })()}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-dark-muted text-xs">
            Collecting data...
          </div>
        )}
      </div>
    </div>
  )
}

export function SystemMetrics() {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsGraph
        title={t('messages.messagesLabel')}
        icon={<Activity className="w-5 h-5 text-green-400" />}
        color="rgb(74, 222, 128)"
        queryKey={['dashboardStats']}
        queryFn={() => HealthService.getDashboardStats()}
        getValue={(data) => data?.messages || 0}
      />

      <MetricsGraph
        title={t('common.memory')}
        icon={<Cpu className="w-5 h-5 text-orange-400" />}
        color="rgb(251, 146, 60)"
        queryKey={['systemMetrics']}
        queryFn={() => MetricsService.getMetricsSystem()}
        getValue={(data) => data?.memory?.used || 0}
      />

      <MetricsGraph
        title={t('common.storage')}
        icon={<HardDrive className="w-5 h-5 text-purple-400" />}
        color="rgb(192, 132, 252)"
        queryKey={['systemMetrics']}
        queryFn={() => MetricsService.getMetricsSystem()}
        getValue={(data) => data?.storage?.used || 0}
      />

      <MetricsGraph
        title={t('messages.messageRate')}
        icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
        color="rgb(34, 211, 238)"
        queryKey={['rateMetrics']}
        queryFn={() => MetricsService.getMetricsRates()}
        getValue={(data) => {
          const totalMessages = data?.streams?.reduce((sum: number, s: any) => sum + (s?.messages || 0), 0) || 0
          return totalMessages
        }}
      />
    </div>
  )
}

export function ResourceUsageBar({ label, used, max, color }: { label: string; used: number; max: number; color: string }) {
  const { t } = useTranslation()
  const percentage = max > 0 ? (used / max) * 100 : 0

  return (
    <div className="bg-dark-bg rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-dark-muted">{formatBytes(used)} / {formatBytes(max)}</span>
      </div>
      <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${percentage > 90 ? 'text-red-400' : percentage > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
          {percentage.toFixed(1)}%
        </span>
        <span className="text-xs text-dark-muted">
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
