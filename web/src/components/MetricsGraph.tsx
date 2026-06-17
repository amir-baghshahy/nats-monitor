import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HealthService, MetricsService } from '../types'
import { TrendingUp, Activity, HardDrive, Cpu } from 'lucide-react'

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
  maxPoints = 60,
}: MetricsGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])

  const { data } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: 2000,
  })

  // Update data points when new data arrives
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

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    if (dataPoints.length < 2) return

    // Find min/max values
    const values = dataPoints.map(p => p.value)
    const minValue = Math.min(...values, 0)
    const maxValue = Math.max(...values, 1)
    const valueRange = maxValue - minValue || 1

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (rect.height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }

    // Draw line graph
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height)
    gradient.addColorStop(0, color.replace(')', ', 0.5)').replace('rgb', 'rgba'))
    gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'))

    ctx.beginPath()
    ctx.moveTo(0, rect.height)

    const xStep = rect.width / (maxPoints - 1)

    dataPoints.forEach((point, index) => {
      const x = index * xStep
      const y = rect.height - ((point.value - minValue) / valueRange) * rect.height

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    // Fill area under line
    const lastX = (dataPoints.length - 1) * xStep
    ctx.lineTo(lastX, rect.height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    dataPoints.forEach((point, index) => {
      const x = index * xStep
      const y = rect.height - ((point.value - minValue) / valueRange) * rect.height

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw dot at last point
    if (dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1]
      const lastX = (dataPoints.length - 1) * xStep
      const lastY = rect.height - ((lastPoint.value - minValue) / valueRange) * rect.height

      ctx.beginPath()
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [dataPoints, color, maxPoints])

  const currentValue = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0
  const previousValue = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : currentValue
  const change = currentValue - previousValue
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color.replace(')', ', 0.2)').replace('rgb', 'rgba') }}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-2xl font-bold">{currentValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </p>
          <p className="text-xs text-dark-muted">vs last period</p>
        </div>
      </div>
      <div className="relative h-24 bg-dark-bg rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}

// System Metrics Panel
export function SystemMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsGraph
        title="Messages"
        icon={<Activity className="w-5 h-5 text-green-400" />}
        color="rgb(74, 222, 128)"
        queryKey={['dashboardStats']}
        queryFn={() => HealthService.getDashboardStats()}
        getValue={(data) => data?.messages || 0}
      />

      <MetricsGraph
        title="Memory"
        icon={<Cpu className="w-5 h-5 text-orange-400" />}
        color="rgb(251, 146, 60)"
        queryKey={['systemMetrics']}
        queryFn={() => MetricsService.getMetricsSystem()}
        getValue={(data) => data?.memory?.used || 0}
      />

      <MetricsGraph
        title="Storage"
        icon={<HardDrive className="w-5 h-5 text-purple-400" />}
        color="rgb(192, 132, 252)"
        queryKey={['systemMetrics']}
        queryFn={() => MetricsService.getMetricsSystem()}
        getValue={(data) => data?.storage?.used || 0}
      />

      <MetricsGraph
        title="Message Rate"
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

// Resource Usage Bar
export function ResourceUsageBar({ label, used, max, color }: { label: string; used: number; max: number; color: string }) {
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
          {percentage > 90 ? 'Critical' : percentage > 70 ? 'Warning' : 'Healthy'}
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
