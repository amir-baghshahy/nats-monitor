import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Send,
  MessageSquare,
  CheckCircle,
  Zap,
  Activity,
  Network,
  Server,
} from "lucide-react";
import { useSSE } from "../hooks/useSSE";
import { useNATSSubscription, useMessageList } from "../hooks";
import {
  MessageList,
  SubscriptionBar,
  PublishForm,
  RequestForm,
} from "../components/messaging";

export interface Message {
  subject: string;
  data: string;
  data_base64: string;
  reply?: string;
  headers?: Record<string, string[]>;
  timestamp: number;
  size: number;
}

export interface PublishForm {
  subject: string;
  payload: string;
  replyTo: string;
  headers: string;
}

export interface RequestForm {
  subject: string;
  payload: string;
  timeout: number;
}

type TabType = "messages" | "publish" | "request" | "services" | "monitor";

export default function CoreMessaging() {
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [publishForm, setPublishForm] = useState<PublishForm>({
    subject: "",
    payload: "",
    replyTo: "",
    headers: "{}",
  });
  const [requestForm, setRequestForm] = useState<RequestForm>({
    subject: "",
    payload: "",
    timeout: 5000,
  });
  const [requestResponse, setRequestResponse] = useState<any>(null);

  // SSE connection
  const { connected: sseConnected } = useSSE("core-messaging");

  // Message list management
  const {
    messages,
    messageFormats,
    expandedMessages,
    viewModes,
    addMessage,
    clearMessages,
    toggleExpand,
    cycleViewMode,
    messagesEndRef,
  } = useMessageList({ autoScroll, maxMessages: 1000 });

  // NATS subscription management
  const {
    subscribe: subscribeToSubject,
    unsubscribe: unsubscribeFromSubject,
    isSubscribed,
    getSubscriptions,
  } = useNATSSubscription({
    onMessage: (message) => {
      addMessage(message);
    },
    onStatusChange: (connected) => {
      // Update subscriptions list on status change
      if (connected) {
        setSubscriptions(new Set(getSubscriptions()));
      }
    },
  });

  // Sync subscriptions state with hook
  useEffect(() => {
    setSubscriptions(new Set(getSubscriptions()));
  }, [getSubscriptions]);

  // Fetch service discovery info
  const { data: serviceInfo } = useQuery({
    queryKey: ["serviceDiscovery"],
    queryFn: () => axios.get("/api/core/services").then((res) => res.data),
    refetchInterval: 10000,
  });

  // Subscribe handler
  const handleSubscribe = (subject: string) => {
    if (isSubscribed(subject)) {
      unsubscribeFromSubject(subject);
    } else {
      subscribeToSubject(subject);
    }
  };

  // Publish handler
  const handlePublish = async () => {
    try {
      const headers = publishForm.headers
        ? JSON.parse(publishForm.headers)
        : {};
      await axios.post("/api/core/publish", {
        subject: publishForm.subject,
        payload: publishForm.payload,
        headers: headers,
        reply_to: publishForm.replyTo,
      });
      setPublishForm({ subject: "", payload: "", replyTo: "", headers: "{}" });
      alert("Message published successfully!");
    } catch (err: any) {
      console.error("Failed to publish:", err);
      alert(`Failed to publish: ${err.response?.data?.error || err.message}`);
    }
  };

  // Request handler
  const handleRequest = async () => {
    try {
      const response = await axios.post("/api/core/request", {
        subject: requestForm.subject,
        payload: requestForm.payload,
        timeout: requestForm.timeout,
      });
      setRequestResponse(response.data);
    } catch (err: any) {
      console.error("Request failed:", err);
      setRequestResponse({
        error: err.response?.data?.error || err.message || "Request failed",
      });
    }
  };

  // Copy message handler
  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.data);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Core Messaging</h1>
          <p className="text-dark-muted mt-1">NATS Pub/Sub & Request/Reply</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-dark-bg rounded-lg border border-dark-border">
            {sseConnected ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">SSE Connected</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">Polling</span>
              </>
            )}
          </div>
          <button
            onClick={() => setActiveTab("publish")}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Publish
          </button>
          <button
            onClick={() => setActiveTab("request")}
            className="btn-secondary flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-dark-border pb-4 flex-wrap">
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "messages"
              ? "bg-primary-500/20 text-primary-400"
              : "hover:bg-dark-bg"
          }`}
        >
          Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab("publish")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "publish"
              ? "bg-primary-500/20 text-primary-400"
              : "hover:bg-dark-bg"
          }`}
        >
          Publish
        </button>
        <button
          onClick={() => setActiveTab("request")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "request"
              ? "bg-primary-500/20 text-primary-400"
              : "hover:bg-dark-bg"
          }`}
        >
          Request/Reply
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "services"
              ? "bg-primary-500/20 text-primary-400"
              : "hover:bg-dark-bg"
          }`}
        >
          Services
        </button>
        <button
          onClick={() => setActiveTab("monitor")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "monitor"
              ? "bg-primary-500/20 text-primary-400"
              : "hover:bg-dark-bg"
          }`}
        >
          Traffic Monitor
        </button>
      </div>

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <>
          <SubscriptionBar
            subscriptions={subscriptions}
            onSubscribe={handleSubscribe}
            onUnsubscribe={unsubscribeFromSubject}
          />

          <MessageList
            messages={messages}
            expandedMessages={expandedMessages}
            viewModes={viewModes}
            messageFormats={messageFormats}
            sseConnected={sseConnected}
            autoScroll={autoScroll}
            messagesEndRef={messagesEndRef}
            onToggleExpand={toggleExpand}
            onCycleViewMode={cycleViewMode}
            onCopyMessage={handleCopyMessage}
            onClearMessages={clearMessages}
            onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
          />
        </>
      )}

      {/* Publish Tab */}
      {activeTab === "publish" && (
        <PublishForm
          form={publishForm}
          onChange={setPublishForm}
          onSubmit={handlePublish}
        />
      )}

      {/* Request Tab */}
      {activeTab === "request" && (
        <RequestForm
          form={requestForm}
          onChange={setRequestForm}
          onSubmit={handleRequest}
          response={requestResponse}
        />
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Service Discovery
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Server Name</p>
                <p className="font-mono text-sm">
                  {serviceInfo?.server_name || "NATS Server"}
                </p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Version</p>
                <p className="text-sm">
                  {serviceInfo?.version || "Not available"}
                </p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-xs text-dark-muted">Max Payload</p>
                <p className="text-sm">
                  {serviceInfo?.max_payload
                    ? `${(serviceInfo.max_payload / 1024).toFixed(0)} KB`
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-primary-400" />
              Active Subscriptions
            </h3>
            <div className="p-8 text-center text-dark-muted border border-dashed border-dark-border rounded-lg">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">
                Core NATS subscriptions are ephemeral and not centrally tracked.
              </p>
              <p className="text-sm">
                To monitor service traffic, go to the{" "}
                <strong>Traffic Monitor</strong> tab
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Monitor Tab */}
      {activeTab === "monitor" && (
        <div className="card">
          <div className="p-8 text-center text-dark-muted">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Traffic Monitor</h3>
            <p>Use the Messages tab to monitor traffic in real-time.</p>
          </div>
        </div>
      )}
    </div>
  );
}
