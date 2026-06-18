import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSSE } from "../hooks/useSSE";
import { SystemMetrics } from "../components/MetricsGraph";
import {
  DashboardHeader,
  StatsGrid,
  SecondaryStatsGrid,
  ConnectionStatus,
  ConsumerHealth,
} from "../components/dashboard";
import EmptyState from "../components/ui/EmptyState";
import { ConsumersService, HealthService } from "../types";
import type { github_com_amir_nats_monitor_internal_dto_DashboardStatsResponse as DashboardStatsResponse } from "../types";
import { Database, AlertCircle, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { connected: sseConnected } = useSSE("dashboard");
  const isTabVisibleRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const {
    data: stats,
    refetch,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => HealthService.getDashboardStats(),
    refetchInterval: sseConnected ? false : 5000,
  });

  const {
    data: accountInfo,
    isLoading: accountLoading,
    isError: accountError,
  } = useQuery({
    queryKey: ["accountInfo"],
    queryFn: () => HealthService.getAccountInfo(),
    refetchInterval: sseConnected ? false : 5000,
  });

  const {
    data: connections,
    isLoading: connectionsLoading,
    isError: connectionsError,
  } = useQuery({
    queryKey: ["connections"],
    queryFn: () => HealthService.getConnections(),
    refetchInterval: sseConnected ? false : 10000,
  });

  const {
    data: consumers,
    isLoading: consumersLoading,
    isError: consumersError,
  } = useQuery({
    queryKey: ["consumers"],
    queryFn: () => ConsumersService.getConsumers(),
    refetchInterval: sseConnected ? false : 5000,
  });

  const isLoading =
    statsLoading || accountLoading || connectionsLoading || consumersLoading;
  const isError =
    statsError || accountError || connectionsError || consumersError;

  const dashboardStats: DashboardStatsResponse = stats || {
    streams: 0,
    consumers: 0,
    messages: 0,
    connections: 0,
    bytes: 0,
    server_status: "disconnected",
  };

  const account = accountInfo || {
    memory: 0,
    storage: 0,
    streams: 0,
    consumers: 0,
    api: { total: 0, errors: 0 },
  };

  const hasData = consumers && consumers.length > 0;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <DashboardHeader
          sseConnected={sseConnected}
          onRefresh={() => refetch()}
        />
        <div className="flex items-center justify-center min-h-64 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading dashboard data…</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <DashboardHeader
          sseConnected={sseConnected}
          onRefresh={() => refetch()}
        />
        <div className="flex items-center justify-center min-h-64 text-destructive">
          <AlertCircle className="mr-2 h-6 w-6" />
          <span>Failed to load dashboard data. Please try refreshing.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <DashboardHeader
        sseConnected={sseConnected}
        onRefresh={() => refetch()}
      />

      <StatsGrid stats={dashboardStats} />

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Real-time Metrics</h2>
        <SystemMetrics />
      </div>

      <SecondaryStatsGrid account={account} />

      <ConnectionStatus
        connected={dashboardStats.server_status === "connected"}
        connections={connections?.connections || []}
      />

      {hasData ? (
        <ConsumerHealth consumers={consumers} />
      ) : (
        <EmptyState
          icon={Database}
          title="No Data Available"
          description="Connect to a NATS server with JetStream enabled to see data."
        />
      )}
    </div>
  );
}
