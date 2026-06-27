import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HistoryService, StreamsService } from '../../../types'
import type { StreamResponse as Stream } from '../../../types'

export interface UseHistoryReturn {
  duration: string
  setDuration: React.Dispatch<React.SetStateAction<string>>
  selectedStream: string
  setSelectedStream: React.Dispatch<React.SetStateAction<string>>
  refetch: () => void
  streamOptions: (string | undefined)[]
  historyStreams: any[]
  streamHistoryPoints: any[]
}

export function useHistory(): UseHistoryReturn {
  const [duration, setDuration] = useState('24h')
  const [selectedStream, setSelectedStream] = useState<string>('all')

  const { data: report, refetch } = useQuery<Record<string, any>>({
    queryKey: ['historyReport', duration],
    queryFn: () => HistoryService.getHistoryReport(duration) as Promise<Record<string, any>>,
  })

  const { data: streams } = useQuery({
    queryKey: ['streams'],
    queryFn: () => StreamsService.getStreams(),
  })

  const { data: streamHistory } = useQuery<Record<string, any>>({
    queryKey: ['streamHistory', selectedStream, duration],
    queryFn: () =>
      selectedStream !== 'all'
        ? (HistoryService.getHistoryStreams(selectedStream, 'messages', duration) as Promise<Record<string, any>>)
        : Promise.resolve({ data: [] }),
    enabled: selectedStream !== 'all',
  })

  const streamOptions =
    streams?.map((stream: Stream) => stream.config?.name).filter(Boolean) || []
  const historyStreams = report?.streams || []
  const streamHistoryPoints = streamHistory?.data || []

  return {
    duration,
    setDuration,
    selectedStream,
    setSelectedStream,
    refetch,
    streamOptions,
    historyStreams,
    streamHistoryPoints,
  }
}
