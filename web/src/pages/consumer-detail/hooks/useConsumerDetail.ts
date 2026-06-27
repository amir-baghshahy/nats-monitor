import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsumersService } from "../../../types";
import type {
  AckMessageRequest,
  AckTermMessageRequest,
  NackMessageRequest,
} from "../../../types";
import { useConfirm } from "../../../components/ConfirmDialog";
import { deleteConsumer, resetConsumerLag, replayMessages, setConsumerState } from "../../../utils/natsOperations";

export interface ConsumerEditForm {
  ack_policy: string;
  deliver_policy: string;
  replay_policy: string;
  max_deliver: number;
}

export interface UseConsumerDetailReturn {
  name: string;
  consumerData: any;
  activeTab: "overview" | "messages" | "config";
  isPaused: boolean;
  isTabHidden: boolean;
  loadingAction: string | null;
  showEditModal: boolean;
  showCloneModal: boolean;
  cloneName: string;
  editForm: ConsumerEditForm;
  pendingMessages: any;
  ackPending: boolean;
  nackPending: boolean;
  termPending: boolean;
  updatePending: boolean;
  clonePending: boolean;
  setActiveTab: (tab: "overview" | "messages" | "config") => void;
    setShowEditModal: (value: boolean) => void;
  setShowCloneModal: (value: boolean) => void;
  setCloneName: (value: string) => void;
  setEditForm: (form: ConsumerEditForm) => void;
  refetch: () => void;
  refetchPending: () => void;
  handleResetLag: () => Promise<void>;
  handleReplayMessages: () => Promise<void>;
  handlePauseResume: () => Promise<void>;
  handleDeleteConsumer: () => Promise<void>;
  handleOpenEdit: () => void;
  handleOpenClone: () => void;
  handleUpdateConsumer: () => void;
  handleCloneConsumer: () => void;
  handleAck: (sequence: number) => void;
  handleNack: (sequence: number) => void;
  handleTerm: (sequence: number) => void;
}

export function useConsumerDetail(): UseConsumerDetailReturn {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<"overview" | "messages" | "config">("overview");
    const [isTabHidden, setIsTabHidden] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [editForm, setEditForm] = useState<ConsumerEditForm>({
    ack_policy: "explicit",
    deliver_policy: "all",
    replay_policy: "instant",
    max_deliver: -1,
  });

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const { data: consumer, refetch } = useQuery({
    queryKey: ["consumer", name],
    queryFn: () => ConsumersService.getConsumers1(name || ""),
    refetchOnWindowFocus: false,
    enabled: !!name,
  });

  const isPaused = consumer?.paused ?? false;

  useEffect(() => {
    if (!isPaused && !isTabHidden) {
      const id = setInterval(() => refetch(), 5000);
      return () => clearInterval(id);
    }
  }, [isPaused, isTabHidden, refetch]);

  const consumerData = consumer || {
    name,
    stream: "",
    status: "unknown",
    lag: 0,
    num_pending: 0,
    config: { durable: false, ack_policy: "explicit", deliver_policy: "all", replay_policy: "instant", max_deliver: -1 },
  };

  const { data: pendingMessages, refetch: refetchPending } = useQuery({
    queryKey: ["pendingMessages", consumerData.stream, name],
    queryFn: () => ConsumersService.getStreamsConsumersPending(consumerData.stream ?? "", name || ""),
    enabled: !!consumerData.stream && !!name && activeTab === "messages",
    refetchInterval: 5000,
  });

  const ackMutation = useMutation({
    mutationFn: (sequence: number) => {
      const payload: AckMessageRequest = { sequence };
      return ConsumersService.postStreamsConsumersAck(consumerData.stream ?? "", name || "", payload);
    },
    onSuccess: () => { refetchPending(); refetch(); },
  });

  const nackMutation = useMutation({
    mutationFn: ({ sequence }: { sequence: number }) => {
      const payload: NackMessageRequest = { sequence };
      return ConsumersService.postStreamsConsumersNack(consumerData.stream ?? "", name || "", payload);
    },
    onSuccess: () => { refetchPending(); refetch(); },
  });

  const termMutation = useMutation({
    mutationFn: (sequence: number) => {
      const payload: AckTermMessageRequest = { sequence };
      return ConsumersService.postStreamsConsumersTerm(consumerData.stream ?? "", name || "", payload);
    },
    onSuccess: () => { refetchPending(); refetch(); },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { ack_policy?: string; deliver_policy?: string; replay_policy?: string; max_deliver?: number }) =>
      ConsumersService.putStreamsConsumers(consumerData.stream ?? "", name || "", payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumer", name] });
      refetch();
      setShowEditModal(false);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (newName: string) =>
      ConsumersService.postStreamsConsumers(consumerData.stream ?? "", {
        name: newName,
        durable: newName,
        ack_policy: (consumerData.config?.ack_policy as any) || "explicit",
        deliver_policy: (consumerData.config?.deliver_policy as any) || "all",
        replay_policy: (consumerData.config?.replay_policy as any) || "instant",
        max_deliver: consumerData.config?.max_deliver ?? -1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      setShowCloneModal(false);
    },
  });

  const handleResetLag = async () => {
    if (!name || !consumerData.stream) return;
    setLoadingAction("reset-lag");
    const result = await resetConsumerLag(consumerData.stream, name);
    if (result.success) refetch();
    setLoadingAction(null);
  };

  const handleReplayMessages = async () => {
    if (!name || !consumerData.stream) return;
    setLoadingAction("replay");
    const result = await replayMessages(consumerData.stream, name);
    if (result.success) refetch();
    setLoadingAction(null);
  };

  const handlePauseResume = async () => {
    if (!name || !consumerData.stream) return;
    setLoadingAction("pause-resume");
    const newState = !isPaused;
    await setConsumerState(consumerData.stream, name, newState);
    setLoadingAction(null);
  };

  const handleDeleteConsumer = async () => {
    if (!name || !consumerData.stream) return;
    const ok = await confirm({
      title: "Delete Consumer",
      message: `Delete consumer "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setLoadingAction("delete");
    const result = await deleteConsumer(consumerData.stream, name);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["consumers"] });
      navigate(`/streams/${encodeURIComponent(consumerData.stream ?? "")}`);
    }
    setLoadingAction(null);
  };

  const handleOpenEdit = () => {
    setEditForm({
      ack_policy: consumerData.config?.ack_policy || "explicit",
      deliver_policy: consumerData.config?.deliver_policy || "all",
      replay_policy: consumerData.config?.replay_policy || "instant",
      max_deliver: consumerData.config?.max_deliver ?? -1,
    });
    setShowEditModal(true);
  };

  const handleOpenClone = () => {
    setCloneName(`${name}-copy`);
    setShowCloneModal(true);
  };

  const handleUpdateConsumer = () => {
    updateMutation.mutate({
      ack_policy: editForm.ack_policy,
      deliver_policy: editForm.deliver_policy,
      replay_policy: editForm.replay_policy,
      max_deliver: editForm.max_deliver,
    });
  };

  const handleCloneConsumer = () => {
    cloneMutation.mutate(cloneName);
  };

  const handleAck = (sequence: number) => ackMutation.mutate(sequence);
  const handleNack = (sequence: number) => nackMutation.mutate({ sequence });
  const handleTerm = (sequence: number) => termMutation.mutate(sequence);

  return {
    name: name || "",
    consumerData,
    activeTab,
    isPaused,
    isTabHidden,
    loadingAction,
    showEditModal,
    showCloneModal,
    cloneName,
    editForm,
    pendingMessages,
    ackPending: ackMutation.isPending,
    nackPending: nackMutation.isPending,
    termPending: termMutation.isPending,
    updatePending: updateMutation.isPending,
    clonePending: cloneMutation.isPending,
    setActiveTab,
    setShowEditModal,
    setShowCloneModal,
    setCloneName,
    setEditForm,
    refetch,
    refetchPending,
    handleResetLag,
    handleReplayMessages,
    handlePauseResume,
    handleDeleteConsumer,
    handleOpenEdit,
    handleOpenClone,
    handleUpdateConsumer,
    handleCloneConsumer,
    handleAck,
    handleNack,
    handleTerm,
  };
}
