import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  Filter,
  XCircle,
  Server,
  Users,
  Network,
  Activity,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useToast } from "../components/Toast";
import { HealthService } from "../types";
import type { nats_monitoring_internal_dto_ConnectionInfo as ConnectionInfo } from "../types";

export default function Connections() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterServer, setFilterServer] = useState<string>("all");
  const [expandedConnections, setExpandedConnections] = useState<Set<number>>(
    new Set(),
  );

  const {
    data: connectionsResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["connections"],
    queryFn: () => HealthService.getConnections(),
    refetchInterval: 5000,
  });

  const connections = connectionsResponse?.connections || [];

  const filteredConnections = connections.filter((conn: ConnectionInfo) => {
    const matchesSearch =
      (conn.user || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conn.ip || "").includes(searchQuery);

    const matchesServer =
      filterServer === "all" || conn.server === filterServer;

    return matchesSearch && matchesServer;
  });

  const stats = {
    total: filteredConnections.length,
    uniqueUsers: new Set(filteredConnections.map((c: ConnectionInfo) => c.user))
      .size,
    totalSubs: filteredConnections.reduce(
      (acc: number, c: ConnectionInfo) => acc + (c.subs_count || 0),
      0,
    ),
    avgSubs:
      filteredConnections.length > 0
        ? filteredConnections.reduce(
            (acc: number, c: ConnectionInfo) => acc + (c.subs_count || 0),
            0,
          ) / filteredConnections.length
        : 0,
  };

  const servers = [
    "all",
    ...new Set(
      connections.map((c: ConnectionInfo) => c.server).filter(Boolean),
    ),
  ];
  const serverData = servers
    .filter((s): s is string => s !== "all")
    .map((server) => ({
      server,
      connections: filteredConnections.filter(
        (c: ConnectionInfo) => c.server === server,
      ).length,
    }));

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedConnections(newExpanded);
  };

  const getConnectionDuration = (connectedAt: string) => {
    if (!connectedAt) return "Not available";
    try {
      const now = new Date();
      const connected = new Date(connectedAt);
      const diff = now.getTime() - connected.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch {
      return "Not available";
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Connections</h1>
          <p className="text-dark-muted mt-1">
            Active NATS connections and clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-dark-muted">Connections</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              <p className="text-xs text-dark-muted">Unique Users</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSubs}</p>
              <p className="text-xs text-dark-muted">Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.floor(stats.avgSubs)}</p>
              <p className="text-xs text-dark-muted">Avg Subs/Conn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Server Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="server" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="connections"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search by user or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterServer}
              onChange={(e) => setFilterServer(e.target.value)}
              className="input"
            >
              <option value="all">All Servers</option>
              {servers
                .filter((s): s is string => s !== "all")
                .map((server) => (
                  <option key={server} value={server}>
                    {server}
                  </option>
                ))}
            </select>
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-dark-muted">
            Loading connections...
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="p-8 text-center text-dark-muted">
            No connections found matching your filters
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredConnections.map((conn: ConnectionInfo, index: number) => {
              const isExpanded = expandedConnections.has(index);

              return (
                <div
                  key={index}
                  className="border-l-2 border-l-transparent hover:border-l-primary-500 transition-colors"
                >
                  <div className="p-4 hover:bg-dark-bg/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />

                      <button
                        onClick={() => toggleExpand(index)}
                        className="p-1 hover:bg-dark-bg rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-dark-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-dark-muted" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {conn.user || "Anonymous"}
                          </span>
                          <span className="text-xs text-dark-muted">•</span>
                          <span className="text-sm text-dark-muted">
                            {conn.ip}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-dark-muted">
                          <span className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            {conn.server}
                          </span>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{conn.subs_count || 0}</p>
                          <p className="text-xs text-dark-muted">Subs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">
                            {getConnectionDuration(conn.connected_at || "")}
                          </p>
                          <p className="text-xs text-dark-muted">Duration</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Terminate connection "${conn.cid}"? This action cannot be undone.`,
                              )
                            ) {
                              HealthService.deleteConnections(
                                String(conn.cid || ""),
                              )
                                .then(() => refetch())
                                .catch(() =>
                                  toast(
                                    "error",
                                    "Failed to terminate connection",
                                  ),
                                );
                            }
                          }}
                          className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-status-error"
                          title="Terminate connection"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pl-8 space-y-4">
                        <div className="bg-dark-bg/50 rounded-lg p-4">
                          <p className="text-xs text-dark-muted">
                            Connected Since
                          </p>
                          <p className="font-medium text-sm">
                            {conn.connected_at
                              ? new Date(conn.connected_at).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-dark-muted">
        Showing {filteredConnections.length} of {connections.length} connections
      </div>
    </div>
  );
}
