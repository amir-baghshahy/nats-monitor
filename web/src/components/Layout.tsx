import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HealthService } from "../types";

import {
  LayoutDashboard,
  Database,
  Users,
  Cable,
  Shield,
  MessageSquare,
  Globe,
  Activity,
  Bell,
  BarChart3,
  CloudOff,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Streams", href: "/streams", icon: Database },
  { name: "Consumers", href: "/consumers", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Core Messaging", href: "/core-messaging", icon: MessageSquare },
  { name: "KV Store", href: "/kv-store", icon: Database },
  { name: "Subjects", href: "/subjects", icon: Globe },
  { name: "Connections", href: "/connections", icon: Cable },
  { name: "Cluster", href: "/cluster", icon: Activity },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Security", href: "/security", icon: Shield },
  { name: "Tenancy", href: "/tenancy", icon: Globe },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => HealthService.getHealth(),
    refetchInterval: 30000,
  });

  const connected = health?.nats === "connected";

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-dark-border">
          <h1 className="text-xl font-bold text-dark-text">nats-ui</h1>
          <p className="text-sm text-dark-muted mt-1">
            NATS Monitoring Platform
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-dark-muted hover:bg-dark-bg hover:text-dark-text"
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-status-success animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-dark-muted">
              {connected ? "Connected to NATS" : "NATS Disconnected"}
            </span>
            {!connected && (
              <CloudOff className="w-4 h-4 text-red-400 ml-auto" />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
