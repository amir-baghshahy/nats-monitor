import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsumersService, StreamsService } from "../../../types";
import type {
  StreamResponse,
} from "../../../types";
import { useConfirm } from "../../../components/ConfirmDialog";
import { deleteStream, purgeStream } from "../../../utils/natsOperations";

export interface StreamEditForm {
  subjects: string;
  replicas: number;
  max_age: string;
  max_bytes: number;
}

export interface UseStreamDetailReturn {
  name: string;
  stream: StreamResponse;
  consumers: any[];
  activeTab: "overview" | "messages" | "consumers" | "config";
  isPaused: boolean;
  loadingAction: string | null;
  showEditModal: boolean;
  editForm: StreamEditForm;
  updatePending: boolean;
  setActiveTab: (tab: "overview" | "messages" | "consumers" | "config") => void;
  setIsPaused: (value: boolean) => void;
  setShowEditModal: (value: boolean) => void;
  setEditForm: (form: StreamEditForm) => void;
  refetch: () => void;
  handlePurgeStream: () => Promise<void>;
  handleDeleteStream: () => Promise<void>;
  handleEditConfig: () => void;
  handleUpdateStream: () => void;
  handleCloneStream: () => void;
  navigate: (path: string) => void;
}

export function useStreamDetail(): UseStreamDetailReturn {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<"overview" | "messages" | "consumers" | "config">("overview");
  const [isPaused, setIsPaused] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<StreamEditForm>({
    subjects: "",
    replicas: 1,
    max_age: "",
    max_bytes: 0,
  });

  const { data: stream, refetch } = useQuery({
    queryKey: ["stream", name],
    queryFn: () => StreamsService.getStreams1(name || ""),
    refetchInterval: isPaused ? false : 3000,
  });

  const { data: consumers } = useQuery({
    queryKey: ["consumers", name],
    queryFn: () =>
      ConsumersService.getConsumers().then((consumers) =>
        consumers.filter((consumer: any) => consumer.stream === name),
      ),
    refetchInterval: 5000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { subjects?: string[]; replicas?: number; max_age?: string; max_bytes?: number }) =>
      StreamsService.putStreams(name || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stream", name] });
      refetch();
      setShowEditModal(false);
    },
  });

  const streamData = stream || {
    config: {
      name: name || "",
      subjects: [],
      storage: "",
      retention: "",
      max_age: "",
      max_bytes: 0,
      max_msg_size: 0,
      replicas: 0,
    },
    state: {
      messages: 0,
      bytes: 0,
      consumers: 0,
      num_pending: 0,
      first_seq: 0,
      last_seq: 0,
      first_ts: "",
      last_ts: "",
    },
  };

  const handlePurgeStream = async () => {
    if (!name) return;
    const ok = await confirm({
      title: "Purge Stream",
      message: `Purge all messages from stream "${name}"?`,
      confirmLabel: "Purge",
      variant: "warning",
    });
    if (!ok) return;
    setLoadingAction("purge");
    const result = await purgeStream(name);
    if (result.success) {
      refetch();
    }
    setLoadingAction(null);
  };

  const handleDeleteStream = async () => {
    if (!name) return;
    const ok = await confirm({
      title: "Delete Stream",
      message: `Delete stream "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setLoadingAction("delete");
    const result = await deleteStream(name);
    if (result.success) {
      setTimeout(() => navigate("/streams"), 1000);
    }
    setLoadingAction(null);
  };

  const handleEditConfig = () => {
    setEditForm({
      subjects: (streamData.config?.subjects || []).join(", "),
      replicas: streamData.config?.replicas || 1,
      max_age: streamData.config?.max_age || "",
      max_bytes: streamData.config?.max_bytes || 0,
    });
    setShowEditModal(true);
  };

  const handleUpdateStream = () => {
    const subjectsArr = editForm.subjects
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    updateMutation.mutate({
      subjects: subjectsArr.length > 0 ? subjectsArr : undefined,
      replicas: editForm.replicas > 0 ? editForm.replicas : undefined,
      max_age: editForm.max_age || undefined,
      max_bytes: editForm.max_bytes > 0 ? editForm.max_bytes : undefined,
    });
  };

  const handleCloneStream = () => {
    if (!name) return;
    navigate(`/streams?clone=${encodeURIComponent(name)}`);
  };

  return {
    name: name || "",
    stream: streamData,
    consumers: consumers || [],
    activeTab,
    isPaused,
    loadingAction,
    showEditModal,
    editForm,
    updatePending: updateMutation.isPending,
    setActiveTab,
    setIsPaused,
    setShowEditModal,
    setEditForm,
    refetch,
    handlePurgeStream,
    handleDeleteStream,
    handleEditConfig,
    handleUpdateStream,
    handleCloneStream,
    navigate,
  };
}
