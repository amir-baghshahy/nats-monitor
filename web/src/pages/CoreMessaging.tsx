import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CoreNatsService,
  github_com_amir_nats_monitor_internal_dto_PublishMessageRequest,
  github_com_amir_nats_monitor_internal_dto_RequestMessageRequest,
} from "../types";
import {
  MessageList,
  SubscriptionBar,
  PublishForm,
  RequestForm,
  MessagingTabs,
  MessagingHeader,
  SubjectExplorer,
  ServiceDiscoveryPanel,
  TrafficMonitorPanel,
} from "../components/messaging";
import { useToast } from "../components/Toast";
import { PageError, PageLoading } from "../components/ui/PageState";
import { useNATSSubscription, useMessageList } from "../hooks";
import { useSSE } from "../hooks/useSSE";
import type { MessagingTab } from "../components/messaging/MessagingTabs";
import type { ServiceInfo } from "../components/messaging/ServiceDiscoveryPanel";

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

export function CoreMessagingContent() {
  const [activeTab, setActiveTab] = useState<MessagingTab>("messages");
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
  const [monitorSubjects, setMonitorSubjects] = useState("");
  const [monitorEvents, setMonitorEvents] = useState<any[]>([]);
  const monitorSourceRef = useRef<EventSource | null>(null);

  const { connected: sseConnected } = useSSE("core-messaging");
  const { toast } = useToast();

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
      if (connected) {
        setSubscriptions(new Set(getSubscriptions()));
      }
    },
  });

  useEffect(() => {
    setSubscriptions(new Set(getSubscriptions()));
  }, [getSubscriptions]);

  const parseHeaders = (headersText: string) => {
    const headers = headersText ? JSON.parse(headersText) : {};

    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value : [String(value)],
      ]),
    );
  };

  const {
    data: serviceInfo,
    isLoading: serviceInfoLoading,
    error: serviceInfoError,
    refetch: refetchServiceInfo,
  } = useQuery({
    queryKey: ["serviceDiscovery"],
    queryFn: () => CoreNatsService.getCoreServices(),
    refetchInterval: 10000,
  });

  const handleSubscribe = (subject: string) => {
    if (isSubscribed(subject)) {
      unsubscribeFromSubject(subject);
    } else {
      subscribeToSubject(subject);
    }
  };

  const handlePublish = async () => {
    try {
      const request: github_com_amir_nats_monitor_internal_dto_PublishMessageRequest = {
        subject: publishForm.subject,
        payload: publishForm.payload,
        headers: parseHeaders(publishForm.headers),
        reply_to: publishForm.replyTo,
      };
      await CoreNatsService.postCorePublish(request);
      setPublishForm({ subject: "", payload: "", replyTo: "", headers: "{}" });
      toast("success", "Message published successfully!");
    } catch (err: any) {
      toast(
        "error",
        `Failed to publish: ${err.response?.data?.error || err.message}`,
      );
    }
  };

  const handleRequest = async () => {
    try {
      const request: github_com_amir_nats_monitor_internal_dto_RequestMessageRequest = {
        subject: requestForm.subject,
        payload: requestForm.payload,
        timeout: requestForm.timeout,
      };
      const response = await CoreNatsService.postCoreRequest(request);
      setRequestResponse(response);
    } catch (err: any) {
      console.error("Request failed:", err);
      setRequestResponse({
        error: err.response?.data?.error || err.message || "Request failed",
      });
    }
  };

  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.data);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const startMonitor = () => {
    const subjects = monitorSubjects
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    monitorSourceRef.current?.close();
    setMonitorEvents([]);

    if (subjects.length === 0) {
      toast("error", "Enter at least one subject to monitor");
      return;
    }

    const params = subjects
      .map((subject) => `subjects=${encodeURIComponent(subject)}`)
      .join("&");
    const source = new EventSource(`/api/core/monitor?${params}`);
    monitorSourceRef.current = source;

    source.addEventListener("message", (event) => {
      try {
        setMonitorEvents((current) =>
          [JSON.parse(event.data), ...current].slice(0, 50),
        );
      } catch (err) {
        console.error("Failed to parse monitor event:", err);
      }
    });

    source.addEventListener("stats", (event) => {
      try {
        setMonitorEvents((current) =>
          [JSON.parse(event.data), ...current].slice(0, 50),
        );
      } catch (err) {
        console.error("Failed to parse monitor stats:", err);
      }
    });

    source.onerror = () => {
      toast("error", "Traffic monitor disconnected");
      source.close();
      monitorSourceRef.current = null;
    };
  };

  const stopMonitor = () => {
    monitorSourceRef.current?.close();
    monitorSourceRef.current = null;
  };

  useEffect(() => {
    return () => stopMonitor();
  }, []);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Unable to load service discovery";
  };

  const knownSubjects = Array.from(
    new Set(
      [
        ...subscriptions,
        ...messages.map((message) => message.subject),
        publishForm.subject,
        requestForm.subject,
      ].filter((subject): subject is string => Boolean(subject)),
    ),
  );

  if (serviceInfoLoading) {
    return <PageLoading text="Loading core messaging..." />;
  }

  if (serviceInfoError) {
    return (
      <PageError
        message={getErrorMessage(serviceInfoError)}
        onRetry={refetchServiceInfo}
      />
    );
  }

  return (
    <div>
      <MessagingHeader
        sseConnected={sseConnected}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <MessagingTabs
        activeTab={activeTab}
        messagesCount={messages.length}
        onTabChange={setActiveTab}
      />

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

      {activeTab === "publish" && (
        <PublishForm
          form={publishForm}
          onChange={setPublishForm}
          onSubmit={handlePublish}
        />
      )}

      {activeTab === "request" && (
        <RequestForm
          form={requestForm}
          onChange={setRequestForm}
          onSubmit={handleRequest}
          response={requestResponse}
        />
      )}

      {activeTab === "subjects" && <SubjectExplorer subjects={knownSubjects} />}

      {activeTab === "services" && (
        <ServiceDiscoveryPanel
          serviceInfo={serviceInfo as ServiceInfo}
          subscriptions={subscriptions}
          onRefresh={refetchServiceInfo}
        />
      )}

      {activeTab === "monitor" && (
        <TrafficMonitorPanel
          subjects={monitorSubjects}
          onSubjectsChange={setMonitorSubjects}
          isMonitoring={Boolean(monitorSourceRef.current)}
          events={monitorEvents}
          onStart={startMonitor}
          onStop={stopMonitor}
        />
      )}
    </div>
  );
}

export default function CoreMessaging() {
  return (
    <div className="p-4 md:p-8">
      <CoreMessagingContent />
    </div>
  );
}
