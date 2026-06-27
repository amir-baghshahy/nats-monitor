import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricsService } from "../../../types";
import type { MetricSeries, MetricsResponse } from "../../../types";

export interface UseMetricsReturn {
  selectedStream: string | null;
  setSelectedStream: React.Dispatch<React.SetStateAction<string | null>>;
  duration: string;
  setDuration: React.Dispatch<React.SetStateAction<string>>;
  autoRefresh: boolean;
  setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  metrics: MetricsResponse | undefined;
  rates: any;
  systemMetrics: any;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  getErrorMessage: (error: unknown) => string;
  getLatestValue: (series?: MetricSeries) => number;
  getTrend: (series?: MetricSeries) => number;
  getSeries: (
    metrics: MetricsResponse | undefined,
    name: string,
    type: string,
  ) => MetricSeries | undefined;
  streamNames: string[];
  totalMessages: number;
  totalStorage: number;
  rateStreams: any[];
  rateTotalMessages: number;
  rateTotalBytes: number;
}

export function useMetrics(): UseMetricsReturn {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [duration, setDuration] = useState("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: metrics,
    refetch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["metrics", selectedStream, duration],
    queryFn: () =>
      MetricsService.getMetrics(
        selectedStream || undefined,
        undefined,
        duration,
      ),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: rates } = useQuery({
    queryKey: ["metricsRates", duration],
    queryFn: () => MetricsService.getMetricsRates(60),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ["metricsSystem"],
    queryFn: () => MetricsService.getMetricsSystem(),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Unable to load metrics";
  };

  const getLatestValue = (series?: MetricSeries) => {
    return series?.data?.[series.data.length - 1]?.value || 0;
  };

  const getTrend = (series?: MetricSeries) => {
    if (!series || !series.data || series.data.length < 2) return 0;
    const latest = series.data[series.data.length - 1].value || 0;
    const previous = series.data[0].value || 0;
    if (previous === 0) return 0;
    return ((latest - previous) / previous) * 100;
  };

  const getSeries = (
    metrics: MetricsResponse | undefined,
    name: string,
    type: string,
  ) => {
    return metrics?.streams?.find(
      (series) => series.name === name && series.labels?.type === type,
    );
  };

  const streamNames = [
    ...new Set<string>(
      metrics?.streams
        ?.filter((series) => series.labels?.type === "messages")
        .map((series) => series.name)
        .filter((name): name is string => Boolean(name)) || [],
    ),
  ];

  const totalMessages = streamNames.reduce<number>(
    (sum, name) => sum + getLatestValue(getSeries(metrics, name, "messages")),
    0,
  );
  const totalStorage = streamNames.reduce<number>(
    (sum, name) => sum + getLatestValue(getSeries(metrics, name, "bytes")),
    0,
  );
  const rateStreams = (rates?.streams as any[] | undefined) || [];
  const rateTotalMessages = rateStreams.reduce<number>(
    (sum, stream) => sum + (stream.messages || 0),
    0,
  );
  const rateTotalBytes = rateStreams.reduce<number>(
    (sum, stream) => sum + (stream.bytes || 0),
    0,
  );

  return {
    selectedStream,
    setSelectedStream,
    duration,
    setDuration,
    autoRefresh,
    setAutoRefresh,
    metrics,
    rates,
    systemMetrics,
    isLoading,
    error,
    refetch,
    getErrorMessage,
    getLatestValue,
    getTrend,
    getSeries,
    streamNames,
    totalMessages,
    totalStorage,
    rateStreams,
    rateTotalMessages,
    rateTotalBytes,
  };
}
