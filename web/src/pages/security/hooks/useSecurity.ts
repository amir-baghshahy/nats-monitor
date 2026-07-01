import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SecurityService } from "../../../types";
import { useConfirm } from "../../../components/ConfirmDialog";
import { formatBytes } from "../../../utils/formatters";

export interface User {
  name: string;
  account: string;
  permissions: {
    publish: Record<string, string>;
    subscribe: Record<string, string>;
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  timestamp: string;
  action: string;
  user: string;
  resource: string;
  details: string;
}

export interface UseSecurityReturn {
  activeTab: "overview" | "users" | "audit" | "connections";
  setActiveTab: React.Dispatch<
    React.SetStateAction<"overview" | "users" | "audit" | "connections">
  >;
  showUserModal: boolean;
  setShowUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  securityInfo: any;
  users: User[] | undefined;
  auditLogs: AuditLog[] | undefined;
  connectionStatus: any;
  infoLoading: boolean;
  usersLoading: boolean;
  auditLoading: boolean;
  connectionsLoading: boolean;
  infoError: unknown;
  usersError: unknown;
  auditError: unknown;
  connectionsError: unknown;
  getErrorMessage: (error: unknown) => string;
  refetchInfo: () => void;
  createUserMutation: any;
  updateUserMutation: any;
  deleteUserMutation: any;
  formatBytes: (bytes: number) => string;
  formatTimestamp: (timestamp: string) => string;
  confirm: any;
}

export function useSecurity(): UseSecurityReturn {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "audit" | "connections"
  >("overview");
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const getErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Unable to load security data";
  }, []);

  const {
    data: securityInfo,
    isLoading: infoLoading,
    error: infoError,
    refetch: refetchInfo,
  } = useQuery({
    queryKey: ["securityInfo"],
    queryFn: () => SecurityService.getSecurityInfo(),
    refetchInterval: 30000,
  });

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["securityUsers"],
    queryFn: () => SecurityService.getSecurityUsers() as Promise<User[]>,
    enabled: activeTab === "users",
  });

  const {
    data: auditLogs,
    isLoading: auditLoading,
    error: auditError,
  } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () =>
      SecurityService.getSecurityAudit() as unknown as Promise<AuditLog[]>,
    enabled: activeTab === "audit",
  });

  const {
    data: connectionStatus,
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useQuery({
    queryKey: ["connectionSecurity"],
    queryFn: () => SecurityService.getSecurityConnections(),
    refetchInterval: 10000,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: Partial<User>) => {
      const payload = {
        name: data.name,
        account: data.account || "default",
        permissions: data.permissions || {
          publish: { ">": "allow" },
          subscribe: { ">": "allow" },
        },
        enabled: data.enabled !== false,
      };
      return SecurityService.postSecurityUsers(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityUsers"] });
      setShowUserModal(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<User> }) =>
      SecurityService.putSecurityUsers(name, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityUsers"] });
      setShowUserModal(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (name: string) => SecurityService.deleteSecurityUsers(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityUsers"] });
    },
  });

  const formatTimestamp = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  return {
    activeTab,
    setActiveTab,
    showUserModal,
    setShowUserModal,
    selectedUser,
    setSelectedUser,
    securityInfo,
    users,
    auditLogs,
    connectionStatus,
    infoLoading,
    usersLoading,
    auditLoading,
    connectionsLoading,
    infoError,
    usersError,
    auditError,
    connectionsError,
    getErrorMessage,
    refetchInfo,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    formatBytes,
    formatTimestamp,
    confirm,
  };
}
