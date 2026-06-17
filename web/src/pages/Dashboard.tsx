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
import type { nats_monitoring_internal_dto_DashboardStatsResponse as DashboardStatsResponse } from "../types";
import { Database } from "lucide-react";

export default function Dashboard() {
  const { connected: sseConnected } = useSSE("dashboard");

  const { data: stats, refetch } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => HealthService.getDashboardStats(),
    refetchInterval: sseConnected ? false : 5000,
  });

  const { data: accountInfo } = useQuery({
    queryKey: ["accountInfo"],
    queryFn: () => HealthService.getAccountInfo(),
    refetchInterval: sseConnected ? false : 5000,
  });

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: () => HealthService.getConnections(),
    refetchInterval: sseConnected ? false : 10000,
  });

  const { data: consumers } = useQuery({
    queryKey: ["consumers"],
    queryFn: () => ConsumersService.getConsumers(),
    refetchInterval: sseConnected ? false : 5000,
  });

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
