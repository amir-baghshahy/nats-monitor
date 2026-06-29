import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StreamsService, ConsumersService } from '../../../types'
import { useSSE } from '../../../hooks/useSSE'

interface GraphNode {
  id: string
  type: 'stream' | 'consumer' | 'subject'
  data: {
    name: string
    subjects?: string[]
    messageCount?: number
    consumerCount?: number
    storage?: number
    lag?: number
    ackRate?: string
    status?: string
    health?: 'healthy' | 'warning' | 'critical'
  }
  position: { x: number; y: number }
}

interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'subscription' | 'flow'
  animated?: boolean
  data?: {
    rate?: number
    filter?: string
  }
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function useVisualStreamData() {
  const { data: streams = [] } = useQuery({
    queryKey: ['streams'],
    queryFn: () => StreamsService.getStreams(),
  })

  const { data: consumers = [] } = useQuery({
    queryKey: ['consumers'],
    queryFn: () => ConsumersService.getConsumers(),
  })

  const { connected: sseConnected } = useSSE('streams')

  // Helper function to determine stream health
  const getStreamHealth = (stream: any): 'healthy' | 'warning' | 'critical' => {
    const numPending = stream.state?.num_pending || 0
    if (numPending > 10000) return 'critical'
    if (numPending > 1000) return 'warning'
    return 'healthy'
  }

  // Helper function to determine consumer health
  const getConsumerHealth = (consumer: any): 'healthy' | 'warning' | 'critical' => {
    const lag = consumer.lag || 0
    if (lag >= 10000) return 'critical'
    if (lag >= 1000) return 'warning'
    return 'healthy'
  }

  // Transform data into graph nodes and edges
  const graphData = useMemo((): GraphData => {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Process streams
    streams.forEach((stream, index) => {
      const streamName = stream.config?.name || `stream-${index}`
      nodes.push({
        id: `stream-${streamName}`,
        type: 'stream',
        data: {
          name: streamName,
          subjects: stream.config?.subjects || [],
          messageCount: stream.state?.messages || 0,
          consumerCount: stream.state?.consumers || 0,
          storage: stream.state?.bytes || 0,
          health: getStreamHealth(stream),
        },
        position: { x: index * 350, y: 100 },
      })
    })

    // Process consumers and link to streams
    consumers.forEach((consumer) => {
      const streamName = consumer.stream
      if (streamName) {
        const consumerName = consumer.name || `consumer-${nodes.length}`
        nodes.push({
          id: `consumer-${consumerName}`,
          type: 'consumer',
          data: {
            name: consumerName,
            lag: consumer.lag || 0,
            ackRate: consumer.ack_rate || '0',
            status: consumer.status || 'unknown',
            health: getConsumerHealth(consumer),
          },
          position: { x: 0, y: 0 }, // Will be positioned by layout
        })

        edges.push({
          id: `${streamName}-${consumerName}`,
          source: `stream-${streamName}`,
          target: `consumer-${consumerName}`,
          type: 'subscription',
          animated: true,
        })
      }
    })

    return { nodes, edges }
  }, [streams, consumers])

  return { graphData, streams, consumers, sseConnected }
}