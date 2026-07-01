import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  CoreNatsService,
  PublishMessageRequest,
  RequestMessageRequest,
} from "../types";
import {
  MessageList,
  SubscriptionBar,
  MessagingTabs,
  MessagingHeader,
  SubjectExplorer,
  ServiceDiscoveryPanel,
  TrafficMonitorPanel,
} from "../components/messaging";
import { useToast } from "../components/Toast";
import { PageError, PageLoading } from "../components/ui/PageState";
import {
  useNATSSubscription,
  useMessageList,
  usePersistedState,
} from "../hooks";
import { useSSE } from "../hooks/useSSE";
import type { MessagingTab } from "../components/messaging/MessagingTabs";
import type { ServiceInfo } from "../components/messaging/ServiceDiscoveryPanel";
import type { Message } from "../hooks/useMessageList";
import type { PublishForm as PublishFormType } from "../components/messaging/PublishForm";
import type { RequestForm as RequestFormType } from "../components/messaging/RequestForm";
import {
  PublishForm,
  RequestForm,
} from "../components/messaging";

export function CoreMessagingContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = usePersistedState<MessagingTab>(
    "core:tab",
    "messages",
  );
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = usePersistedState<boolean>(
    "core:autoScroll",
    true,
  );
  const [publishForm, setPublishForm] = useState<PublishFormType>({
    subject: "",
    payload: "",
    replyTo: "",
    headers: "{}",
  });
  const [requestForm, setRequestForm] = useState<RequestFormType>({
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
      const request: PublishMessageRequest = {
        subject: publishForm.subject,
        payload: publishForm.payload,
        headers: parseHeaders(publishForm.headers),
        reply_to: publishForm.replyTo,
      };
      await CoreNatsService.postCorePublish(request);
      setPublishForm({ subject: "", payload: "", replyTo: "", headers: "{}" });
      toast("success", t("messages.messagePublished"));
    } catch (err: any) {
      toast(
        "error",
        t("messages.publishFailed", {
          error: err?.response?.data?.error || err?.message,
        }),
      );
    }
  };

  const handleRequest = async () => {
    try {
      const request: RequestMessageRequest = {
        subject: requestForm.subject,
        payload: requestForm.payload,
        timeout: requestForm.timeout,
      };
      const response = await CoreNatsService.postCoreRequest(request);
      setRequestResponse(response);
    } catch (err: any) {
      console.error("Request failed:", err);
      setRequestResponse({
        error:
          err?.response?.data?.error ||
          err?.message ||
          t("messages.requestFailed"),
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
      toast("error", t("messages.enterSubjectToMonitor"));
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
      toast("error", t("messages.trafficMonitorDisconnected"));
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
    return t("messages.serviceDiscoveryError");
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
    return <PageLoading text={t("messages.loadingCoreMessaging")} />;
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
    <div className="p-4 md:p-6">
      <CoreMessagingContent />
    </div>
  );
}
