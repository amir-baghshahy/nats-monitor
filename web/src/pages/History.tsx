import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HistoryService, StreamsService } from "../types";
import type { nats_monitoring_internal_dto_StreamResponse as Stream } from "../types";
import { BarChart3, History as HistoryIcon, RefreshCw } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";

const durations = ["1h", "6h", "24h", "7d"];

export default function History() {
  const [duration, setDuration] = useState("24h");
  const [selectedStream, setSelectedStream] = useState<string>("all");

  const { data: report, refetch } = useQuery<Record<string, any>>({
    queryKey: ["historyReport", duration],
    queryFn: () => HistoryService.getHistoryReport(duration) as Promise<Record<string, any>>,
  });

  const { data: streams } = useQuery({
    queryKey: ["streams"],
    queryFn: () => StreamsService.getStreams(),
  });

  const { data: streamHistory } = useQuery<Record<string, any>>({
    queryKey: ["streamHistory", selectedStream, duration],
    queryFn: () =>
      selectedStream !== "all"
        ? (HistoryService.getHistoryStreams(selectedStream, "messages", duration) as Promise<Record<string, any>>)
        : Promise.resolve({ points: [] }),
    enabled: selectedStream !== "all",
  });

  const streamOptions =
    streams?.map((stream: Stream) => stream.config?.name).filter(Boolean) || [];
  const historyStreams = report?.streams || [];
  const streamHistoryPoints = streamHistory?.points || [];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">History</h1>
          <p className="mt-1 text-dark-muted">
            Historical stream metrics and trend analysis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input w-full sm:w-auto"
          >
            {durations.map((item) => (
              <option key={item} value={item}>
                Last {item}
              </option>
            ))}
          </select>
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-6 card">
        <label className="mb-2 block text-sm text-dark-muted">Stream</label>
        <select
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
          className="input"
        >
          <option value="all">All Streams</option>
          {streamOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Stream Summary</h2>
          </div>
          {historyStreams.length > 0 ? (
            <div className="space-y-3">
              {historyStreams.map((stream: any) => (
                <div
                  key={stream.name}
                  className="rounded-xl bg-dark-bg/50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-medium">{stream.name}</p>
                    <p className="text-sm text-dark-muted">
                      {stream.messages?.toLocaleString?.() || 0} msgs
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-dark-muted">Bytes</p>
                      <p className="font-mono">
                        {(stream.bytes || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-muted">Trend</p>
                      <p className="font-mono">{stream.trend || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No History Data"
              description="Metrics history will appear after the collector has sampled stream data."
            />
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Messages Trend</h2>
          </div>
          {streamHistoryPoints.length > 0 ? (
            <div className="space-y-3">
              {streamHistoryPoints.map((point: any, index: number) => (
                <div
                  key={`${point.timestamp}-${index}`}
                  className="rounded-xl bg-dark-bg/50 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-muted">
                      {point.timestamp
                        ? new Date(point.timestamp).toLocaleString()
                        : "N/A"}
                    </span>
                    <span className="font-mono">
                      {(point.value || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No Stream Trend"
              description="Select a stream to view historical message points."
            />
          )}
        </div>
      </div>
    </div>
  );
}
