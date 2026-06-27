import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagesService, StreamsService } from "../../../types";
import type { StreamResponse as Stream } from "../../../types";
import { useConfirm } from "../../../components/ConfirmDialog";
import { useToast } from "../../../components/Toast";
import { useSSE } from "../../../hooks/useSSE";
import { deleteMessage } from "../../../utils/natsOperations";

export interface UseMessagesReturn {
  streams: Stream[];
  selectedStream: string;
  searchQuery: string;
  selectedMessages: Set<number>;
  expandedMessages: Set<number>;
  showPublishModal: boolean;
  activeMessageTab: "stream" | "core";
  messagesPerPage: number;
  currentPage: number;
  showFilters: boolean;
  viewMode: "list" | "grid";
  copiedMessage: number | null;
  isLoading: boolean;
  sseConnected: boolean;
  publishPending: boolean;
  deletePending: boolean;
  messagesData: any;
  messages: any[];
  totalMessages: number;
  totalPages: number;
  setSelectedStream: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setShowPublishModal: (value: boolean) => void;
  setActiveMessageTab: (value: "stream" | "core") => void;
  setMessagesPerPage: (value: number) => void;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
  setShowFilters: (value: boolean) => void;
  setViewMode: (value: "list" | "grid") => void;
  toggleMessageSelection: (sequence: number) => void;
  toggleMessageExpansion: (sequence: number) => void;
  selectAllMessages: () => void;
  clearMessageSelection: () => void;
  handlePublish: (data: { stream: string; subject: string; data: string }) => void;
  handleDeleteMessage: (sequence: number) => void;
  handleBulkDelete: () => Promise<void>;
  handleExportSelected: () => Promise<void>;
  copyMessageData: (data: string, sequence: number) => Promise<void>;
  refetch: () => void;
}

export const MAX_DISPLAY_PAYLOAD_SIZE = 50 * 1024;
const decoder = new TextDecoder();

export const parseMessageData = (data: any): string => {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return decoder.decode(new Uint8Array(data));
  return JSON.stringify(data, null, 2);
};

export function useMessages(): UseMessagesReturn {
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeMessageTab, setActiveMessageTab] = useState<"stream" | "core">("stream");
  const [messagesPerPage, setMessagesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { connected: sseConnected } = useSSE("messages");

  const { data: streams = [] } = useQuery({
    queryKey: ["streams"],
    queryFn: () => StreamsService.getStreams(),
  });

  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ["messages", selectedStream, currentPage, messagesPerPage],
    queryFn: () =>
      MessagesService.getMessagesPage(selectedStream, currentPage, messagesPerPage),
    enabled: !!selectedStream,
  });

  const publishMutation = useMutation({
    mutationFn: (data: { stream: string; subject: string; data: string }) =>
      MessagesService.postStreamsMessagesPublish(data.stream, {
        subject: data.subject,
        payload: data.data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedStream] });
      setShowPublishModal(false);
      toast("success", "Message published");
    },
    onError: (err: any) => toast("error", err.response?.data?.error || "Failed to publish"),
  });

  const deleteMutation = useMutation({
    mutationFn: (sequence: number) => deleteMessage(selectedStream, sequence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedStream] });
    },
  });

  const messages = messagesData?.messages || [];
  const totalMessages = messagesData?.total || 0;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);

  const toggleMessageSelection = (sequence: number) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(sequence)) next.delete(sequence);
      else next.add(sequence);
      return next;
    });
  };

  const toggleMessageExpansion = (sequence: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(sequence)) next.delete(sequence);
      else next.add(sequence);
      return next;
    });
  };

  const selectAllMessages = () => {
    setSelectedMessages(new Set(messages.map((m: any) => m.sequence)));
  };

  const clearMessageSelection = () => {
    setSelectedMessages(new Set());
  };

  const handlePublish = (data: { stream: string; subject: string; data: string }) => {
    publishMutation.mutate(data);
  };

  const handleDeleteMessage = (sequence: number) => {
    deleteMutation.mutate(sequence);
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: "Delete Messages",
      message: `Delete ${selectedMessages.size} selected messages?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      selectedMessages.forEach((seq) => deleteMutation.mutate(seq));
      clearMessageSelection();
    }
  };

  const handleExportSelected = async () => {
    if (!selectedStream) {
      toast("error", "Select a stream first");
      return;
    }
    const selectedMsgs = messages.filter((m: any) => selectedMessages.has(m.sequence));
    const blob = new Blob([JSON.stringify(selectedMsgs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedStream}-messages-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("success", "Messages exported");
  };

  const copyMessageData = async (data: string, sequence: number) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopiedMessage(sequence);
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return {
    streams,
    selectedStream,
    searchQuery,
    selectedMessages,
    expandedMessages,
    showPublishModal,
    activeMessageTab,
    messagesPerPage,
    currentPage,
    showFilters,
    viewMode,
    copiedMessage,
    isLoading,
    sseConnected,
    publishPending: publishMutation.isPending,
    deletePending: deleteMutation.isPending,
    messagesData,
    messages,
    totalMessages,
    totalPages,
    setSelectedStream,
    setSearchQuery,
    setShowPublishModal,
    setActiveMessageTab,
    setMessagesPerPage,
    setCurrentPage,
    setShowFilters,
    setViewMode,
    toggleMessageSelection,
    toggleMessageExpansion,
    selectAllMessages,
    clearMessageSelection,
    handlePublish,
    handleDeleteMessage,
    handleBulkDelete,
    handleExportSelected,
    copyMessageData,
    refetch,
  };
}
