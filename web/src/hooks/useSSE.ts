import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface SSEEvent {
  type: string
  timestamp: number
  data: any
}

export function useSSE(channel: string) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const url = `/api/events?channel=${channel}`
    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log(`SSE connected to channel: ${channel}`)
      setConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent
        setLastEvent(data)

        // Invalidate relevant queries based on event type
        switch (data.type) {
          case 'stream:update':
            queryClient.invalidateQueries({ queryKey: ['streams'] })
            queryClient.invalidateQueries({ queryKey: ['stream', data.data.name] })
            break
          case 'consumer:update':
            queryClient.invalidateQueries({ queryKey: ['consumers'] })
            queryClient.invalidateQueries({ queryKey: ['consumer', data.data.name] })
            break
          case 'dashboard:update':
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
            break
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      setConnected(false)
    }

    eventSourceRef.current = eventSource

    return () => {
      console.log(`Closing SSE connection to channel: ${channel}`)
      eventSource.close()
    }
  }, [channel])

  return { connected, lastEvent }
}
