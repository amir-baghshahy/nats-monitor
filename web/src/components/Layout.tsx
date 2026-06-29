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
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "streams", href: "/streams", icon: Database },
  { key: "consumers", href: "/consumers", icon: Users },
  { key: "messages", href: "/messages", icon: MessageSquare },
  { key: "kvStore", href: "/kv-store", icon: Database },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-dark-card border border-dark-border text-dark-text hover:bg-dark-bg transition-colors"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-30 flex w-72 flex-shrink-0 flex-col border-r border-dark-border/70 bg-dark-card/75 shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-dark-border/70 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/20 text-primary-300 ring-1 ring-primary-400/30">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-dark-text">
                {t("app.title")}
              </h1>
              <p className="text-xs text-dark-muted">{t("app.subtitle")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.key}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "text-dark-muted hover:bg-dark-bg/70 hover:text-dark-text hover-lift"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-transform duration-200 ${isActive ? "text-white" : "text-dark-muted group-hover:text-dark-text group-hover:scale-110"}`}
                />
                <span>{t(`nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-dark-border/70 p-4 space-y-3">
          <LanguageSwitcher />
          <div className="rounded-2xl border border-dark-border/60 bg-dark-bg/45 p-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  connected
                    ? "bg-status-success animate-pulse"
                    : "bg-status-error"
                }`}
              />
              <span className="text-xs text-dark-muted">
                {connected ? t("common.connected") : t("common.disconnected")}
              </span>
              {!connected && (
                <CloudOff className="ms-auto h-4 w-4 text-status-error" />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - full height, inner scroll */}
      <main className="h-full flex-1 pt-16 lg:pt-0 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
