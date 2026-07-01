import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HealthService } from "../types";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

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
  History,
  Menu,
  X,
  Network,
  KeySquare,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "streams", href: "/streams", icon: Database },
  { key: "consumers", href: "/consumers", icon: Users },
  { key: "messages", href: "/messages", icon: MessageSquare },
  { key: "kvStore", href: "/kv-store", icon: KeySquare },
  { key: "subjects", href: "/subjects", icon: Globe },
  { key: "connections", href: "/connections", icon: Cable },
  { key: "cluster", href: "/cluster", icon: Activity },
  { key: "alerts", href: "/alerts", icon: Bell },
  { key: "metrics", href: "/metrics", icon: BarChart3 },
  { key: "visualStreamGraph", href: "/visual-stream-graph", icon: Network },
  { key: "history", href: "/history", icon: History },
  { key: "security", href: "/security", icon: Shield },
  { key: "tenancy", href: "/tenancy", icon: Globe },
] as const;

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => HealthService.getHealth(),
    refetchInterval: 30000,
  });

  const connected = health?.nats === "connected";

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-1.5 rounded-lg bg-dark-card border border-dark-border text-dark-text hover:bg-dark-bg transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-30 flex h-full w-64 flex-shrink-0 flex-col border-r border-dark-border/70 bg-dark-card/75 shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="border-b border-dark-border/70 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/20 text-primary-300 ring-1 ring-primary-400/30 shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-dark-text truncate">
                {t("app.title")}
              </h1>
              <p className="text-[10px] text-dark-muted truncate">{t("app.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.key}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-500/20"
                    : "text-dark-muted hover:bg-dark-bg/60 hover:text-dark-text"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-dark-muted group-hover:text-dark-text"}`}
                />
                <span className="truncate">{t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-dark-border/70 p-3 space-y-2">
          <LanguageSwitcher />
          <div className="rounded-lg border border-dark-border/60 bg-dark-bg/45 px-3 py-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full shrink-0 ${
                  connected ? "bg-status-success animate-pulse" : "bg-status-error"
                }`}
              />
              <span className="text-xs text-dark-muted truncate">
                {connected ? t("common.connected") : t("common.disconnected")}
              </span>
              {!connected && (
                <CloudOff className="ms-auto h-3.5 w-3.5 shrink-0 text-status-error" />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="h-full flex-1 pt-12 md:pt-0 overflow-hidden min-w-0">
        <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}
