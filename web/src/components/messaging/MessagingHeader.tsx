import { CheckCircle, MessageSquare, Send, Zap } from "lucide-react";
import type { MessagingTab } from "./MessagingTabs";

interface MessagingHeaderProps {
  sseConnected: boolean;
  activeTab: MessagingTab;
  onTabChange: (tab: MessagingTab) => void;
}

export default function MessagingHeader({
  sseConnected,
  activeTab,
  onTabChange,
}: MessagingHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Messages</h1>
        <p className="mt-1 text-dark-muted">NATS Pub/Sub, Request/Reply, Subjects and Services</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-dark-border bg-dark-bg px-4 py-2">
          {sseConnected ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">SSE Connected</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Polling</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onTabChange("publish")}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Publish
        </button>

        <button
          type="button"
          onClick={() => onTabChange(activeTab === "request" ? "publish" : "request")}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Request
        </button>
      </div>
    </div>
  );
}
