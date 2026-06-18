import type { KVBucketInfo, KVKeyEntry, KVKeyHistoryEntry } from "../types";
import { KvService } from "../types";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Plus,
  Trash2,
  Edit,
  Clock,
  Search,
  RefreshCw,
  FolderOpen,
  Key,
  History,
  X,
} from "lucide-react";
import { useToast } from "../components/Toast";

export default function KVStore() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: buckets, refetch: refetchBuckets } = useQuery({
    queryKey: ["kvBuckets"],
    queryFn: () => KvService.getKvBuckets(),
    refetchInterval: 10000,
  });

  const { data: keys } = useQuery<KVKeyEntry[]>({
    queryKey: ['kvKeys', selectedBucket ?? ''],
    queryFn: () =>
      selectedBucket ? KvService.getKvBucketsKeys(selectedBucket) : Promise.resolve([]),
    enabled: !!selectedBucket,
  })

  const { data: history } = useQuery<KVKeyHistoryEntry[]>({
    queryKey: ['kvHistory', selectedBucket ?? '', selectedKey ?? ''],
    queryFn: () =>
      selectedBucket && selectedKey
        ? KvService.getKvBucketsHistory(selectedBucket, selectedKey)
        : Promise.resolve([]),
    enabled: !!selectedBucket && !!selectedKey && showHistoryModal,
  })

  const createBucketMutation = useMutation({
    mutationFn: (data: Record<string, any>) => KvService.postKvBuckets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kvBuckets"] });
      setShowCreateModal(false);
      toast("success", "Bucket created successfully!");
    },
    onError: (error: {
      response?: { data?: { error?: string } };
      message?: string;
    }) => {
      toast(
        "error",
        `Failed to create bucket: ${error.response?.data?.error || error.message}`,
      );
    },
  });

  const putKeyMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      if (!selectedBucket) throw new Error("No bucket selected");
      return KvService.putKvBucketsKey(selectedBucket, { key, value });
    },
    onSuccess: () => {
      if (selectedBucket) {
        queryClient.invalidateQueries({ queryKey: ["kvKeys", selectedBucket] });
      }
      setShowKeyModal(false);
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedBucket) throw new Error("No bucket selected");
      return KvService.deleteKvBucketsKey(selectedBucket, key);
    },
    onSuccess: () => {
      if (selectedBucket) {
        queryClient.invalidateQueries({ queryKey: ["kvKeys", selectedBucket] });
      }
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
    return bytes + " B";
  };

  const formatTimestamp = (timestamp: string | number | undefined) => {
    return timestamp ? new Date(timestamp).toLocaleString() : "N/A";
  };

  const filteredKeys =
    keys?.filter((k: KVKeyEntry) => {
      const key = k.key ?? "";
      const value = k.value ?? "";
      return (
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }) || [];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Key-Value Store</h1>
          <p className="text-dark-muted mt-1">
            Manage NATS KV buckets and keys
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Bucket
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Buckets List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-400" />
                Buckets ({buckets?.length || 0})
              </h2>
              <button
                onClick={() => refetchBuckets()}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {buckets?.map((bucket: KVBucketInfo) => (
                <div
                  key={bucket.name}
                  onClick={() =>
                    setSelectedBucket(bucket.name ?? bucket.bucket_name ?? '')
                  }
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBucket === bucket.name
                      ? "bg-primary-500/20 border border-primary-500/50"
                      : "bg-dark-bg hover:bg-dark-bg/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {bucket.bucket_name}
                      </p>
                      <p className="text-xs text-dark-muted">
                        {bucket.values?.toLocaleString() || 0} keys •{" "}
                        {formatBytes(bucket.bytes || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {(!buckets || buckets.length === 0) && (
                <div className="text-center py-8 text-dark-muted">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No buckets found</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-primary-400 hover:underline text-sm mt-2"
                  >
                    Create your first bucket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keys Panel */}
        {selectedBucket && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary-400" />
                    Keys ({filteredKeys.length})
                  </h2>
                  <p className="text-sm text-dark-muted">
                    {
                      buckets?.find(
                        (b: KVBucketInfo) => b.name === selectedBucket,
                      )?.bucket_name
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setModalMode("create");
                      setShowKeyModal(true);
                    }}
                    className="btn-primary flex items-center gap-2 text-sm py-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Key
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                <input
                  type="text"
                  placeholder="Search keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>

              {/* Keys List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredKeys.map((kv: KVKeyEntry) => (
                  <div
                    key={kv.key ?? kv.revision}
                    className="p-4 bg-dark-bg rounded-lg hover:bg-dark-bg/80 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="w-4 h-4 text-primary-400" />
                          <span className="font-mono text-sm font-medium">{kv.key ?? 'unknown-key'}</span>
                          <span className="text-xs text-dark-muted">v{kv.revision ?? 0}</span>
                        </div>
                        <div className="text-sm text-dark-muted truncate max-h-16 overflow-hidden">
                          {kv.value ?? ''}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-dark-muted">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(kv.created)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedKey(kv.key ?? '')
                            setModalMode('edit')
                            setShowKeyModal(true)
                          }}
                          className="p-2 hover:bg-dark-border rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedKey(kv.key ?? '')
                            setShowHistoryModal(true)
                          }}
                          className="p-2 hover:bg-dark-border rounded-lg"
                          title="History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete key "${kv.key ?? 'unknown-key'}"?`)) {
                              deleteKeyMutation.mutate(kv.key ?? '')
                            }
                          }}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredKeys.length === 0 && (
                  <div className="text-center py-8 text-dark-muted">
                    <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {searchQuery
                        ? "No keys match your search"
                        : "No keys in this bucket"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedBucket && (
          <div className="lg:col-span-2">
            <div className="card text-center py-16">
              <FolderOpen className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Bucket</h3>
              <p className="text-dark-muted">
                Choose a bucket from the left to view its keys
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Bucket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Bucket</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                createBucketMutation.mutate({
                  name: formData.get("name"),
                  history: parseInt(formData.get("history") as string) || 1,
                  storage: "file",
                  max_bytes: parseInt(formData.get("max_bytes") as string) || 0,
                  compression: formData.get("compression") === "true",
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bucket Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="my-bucket"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  History (Revisions)
                </label>
                <input
                  type="number"
                  name="history"
                  defaultValue={1}
                  min={1}
                  max={10}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Bytes (0 = unlimited)
                </label>
                <input
                  type="number"
                  name="max_bytes"
                  placeholder="1048576"
                  className="input w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="compression"
                  value="true"
                  id="compression"
                />
                <label htmlFor="compression" className="text-sm">
                  Enable Compression
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Key Edit/Create Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {modalMode === "create" ? "Add Key" : "Edit Key"}
              </h2>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                putKeyMutation.mutate({
                  key: formData.get("key") as string,
                  value: formData.get("value") as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Key</label>
                <input
                  type="text"
                  name="key"
                  defaultValue={selectedKey || ""}
                  placeholder="my-key"
                  className="input w-full font-mono"
                  disabled={modalMode === "edit"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Value</label>
                <textarea
                  name="value"
                  placeholder='{"json": "data"}'
                  rows={6}
                  className="input w-full font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === "create" ? "Add" : "Update"} Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Key History Modal */}
      {showHistoryModal && selectedKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Key History</h2>
                <p className="text-sm text-dark-muted font-mono">
                  {selectedKey}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-dark-bg rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {history?.map((entry: KVKeyHistoryEntry) => (
                <div key={entry.key ?? entry.revision} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                        {entry.operation}
                      </span>
                      <span className="text-sm text-dark-muted">
                        v{entry.revision}
                      </span>
                      <Clock className="w-3 h-3 text-dark-muted" />
                      <span className="text-xs text-dark-muted">
                        {formatTimestamp(entry.created)}
                      </span>
                    </div>
                  </div>
                    <pre className="text-sm p-3 bg-dark-bg rounded overflow-x-auto">
                      <code className="text-green-400">{entry.value ?? ''}</code>
                    </pre>
                </div>
              ))}

              {(!history || history.length === 0) && (
                <div className="text-center py-8 text-dark-muted">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
