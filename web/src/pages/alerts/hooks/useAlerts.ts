import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Alert, AlertTrigger } from "../../../types";
import { AlertsService } from "../../../types";
import { useConfirm } from "../../../components/ConfirmDialog";
import { useToast } from "../../../components/Toast";

export function useAlerts() {
  const [activeTab, setActiveTab] = useState<"alerts" | "triggers">("alerts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const { data: alerts, isLoading: alertsLoading, error: alertsError, refetch: refetchAlerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => AlertsService.getAlerts() as Promise<Alert[]>,
    refetchInterval: 10000,
  });

  const { data: triggers, isLoading: triggersLoading, error: triggersError, refetch: refetchTriggers } = useQuery({
    queryKey: ["alertTriggers"],
    queryFn: () => AlertsService.getAlertsTriggers() as Promise<AlertTrigger[]>,
    refetchInterval: 5000,
    enabled: activeTab === "triggers",
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: Partial<Alert>) => AlertsService.postAlerts(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setShowCreateModal(false);
      toast("success", "Alert created");
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Alert> }) => AlertsService.putAlerts(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setSelectedAlert(null);
      setShowCreateModal(false);
      toast("success", "Alert updated");
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => AlertsService.deleteAlerts(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alerts"] }); },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: (alert: Alert) => AlertsService.putAlerts(alert.id || '', { ...alert, enabled: !alert.enabled } as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alerts"] }); },
  });

  const ackTriggerMutation = useMutation({
    mutationFn: (id: string) => AlertsService.postAlertsTriggersAck(id, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alertTriggers"] }); },
  });

  const checkAlertsMutation = useMutation({
    mutationFn: () => AlertsService.postAlertsCheck(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["alertTriggers"] });
      toast("success", `${data.triggered} alert${data.triggered === 1 ? "" : "s"} triggered from ${data.evaluated} checked`);
    },
    onError: (error: any) => { toast("error", error?.response?.data?.error || "Failed to check alerts"); },
  });

  return {
    activeTab, setActiveTab, showCreateModal, setShowCreateModal,
    selectedAlert, setSelectedAlert, filterSeverity, setFilterSeverity,
    alerts, alertsLoading, alertsError, refetchAlerts,
    triggers, triggersLoading, triggersError, refetchTriggers,
    createAlertMutation, updateAlertMutation, deleteAlertMutation,
    toggleAlertMutation, ackTriggerMutation, checkAlertsMutation, confirm, toast,
  };
}
