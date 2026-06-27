import {
  Clock, Database, Edit, FolderOpen, History, Key, Plus, RefreshCw, Search, Trash2, X, Eye,
} from "lucide-react";
import type { KVBucketInfo, KVKeyEntry, KVKeyHistoryEntry } from "../../types";
import { useKVStore } from "./hooks/useKVStore";
import { PageError, PageLoading } from "../../components/ui/PageState";

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function formatTimestamp(timestamp: string | number | undefined) {
  return timestamp ? new Date(timestamp).toLocaleString() : "N/A";
}

export default function KVStorePage() {
  const store = useKVStore();

  if (store.bucketsLoading || (store.selectedBucket && store.keysLoading)) {
    return <PageLoading text="Loading KV buckets..." />;
  }

  if (store.bucketsError || store.keysError) {
    return <PageError message={(store.bucketsError || store.keysError) instanceof Error ? (store.bucketsError as Error).message : "Unable to load KV data"} onRetry={store.refetchBuckets} />;
  }

  if (store.selectedBucket && store.historyError) {
    return <PageError message={store.historyError instanceof Error ? (store.historyError as Error).message : "Unable to load history"} onRetry={store.refetchBuckets} />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Key-Value Store</h1>
          <p className="text-dark-muted mt-1">Manage NATS KV buckets and keys</p>
        </div>
        <button onClick={() => store.setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Bucket
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-400" />
                Buckets ({store.buckets?.length || 0})
              </h2>
              <button onClick={() => store.refetchBuckets()} className="p-2 hover:bg-dark-bg rounded-lg">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {store.buckets?.map((bucket: KVBucketInfo) => (
                <div
                  key={bucket.name}
                  onClick={() => store.setSelectedBucket(bucket.name ?? bucket.bucket_name ?? "")}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    store.selectedBucket === (bucket.name ?? bucket.bucket_name)
                      ? "bg-primary-500/20 border border-primary-500/50"
                      : "bg-dark-bg hover:bg-dark-bg/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                    <div className="flex-1 min-w-0" onClick={() => store.setSelectedBucket(bucket.name ?? bucket.bucket_name ?? "")}>
                      <p className="font-medium truncate">{bucket.bucket_name}</p>
                      <p className="text-xs text-dark-muted">{bucket.values?.toLocaleString() || 0} keys • {formatBytes(bucket.bytes || 0)}</p>
                    </div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await store.handleDeleteBucket(bucket.name ?? bucket.bucket_name ?? ""); }}
                      className="p-2 hover:bg-red-500/20 rounded-lg"
                      title="Delete bucket"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {(!store.buckets || store.buckets.length === 0) && (
                <div className="text-center py-8 text-dark-muted">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No buckets found</p>
                  <button onClick={() => store.setShowCreateModal(true)} className="text-primary-400 hover:underline text-sm mt-2">Create your first bucket</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {store.selectedBucket && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary-400" />
                    Keys ({store.filteredKeys.length})
                  </h2>
                  <p className="text-sm text-dark-muted">
                    {store.buckets?.find((b: KVBucketInfo) => b.name === store.selectedBucket)?.bucket_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => store.handlePurgeBucket()} className="btn-secondary flex items-center gap-2 text-sm py-2">
                    <RefreshCw className="w-4 h-4" />
                    Purge
                  </button>
                  <button onClick={() => { store.setModalMode("create"); store.setShowKeyModal(true); }} className="btn-primary flex items-center gap-2 text-sm py-2">
                    <Plus className="w-4 h-4" />
                    Add Key
                  </button>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                <input type="text" placeholder="Search keys..." value={store.searchQuery} onChange={(e) => store.setSearchQuery(e.target.value)} className="input pl-10 w-full" />
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {store.filteredKeys.map((kv: KVKeyEntry) => (
                  <div key={kv.key ?? kv.revision} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-bg/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="w-4 h-4 text-primary-400" />
                          <span className="font-mono text-sm font-medium">{kv.key ?? "unknown-key"}</span>
                          <span className="text-xs text-dark-muted">v{kv.revision ?? 0}</span>
                        </div>
                        <div className="text-sm text-dark-muted truncate max-h-16 overflow-hidden">{kv.value ?? ""}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-dark-muted">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(kv.created)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => store.handleGetKey(kv.key ?? "")} className="p-2 hover:bg-dark-border rounded-lg" title="Get Key"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { store.setSelectedKey(kv.key ?? ""); store.setModalMode("edit"); store.setShowKeyModal(true); }} className="p-2 hover:bg-dark-border rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { store.setSelectedKey(kv.key ?? ""); store.setShowHistoryModal(true); }} className="p-2 hover:bg-dark-border rounded-lg" title="History"><History className="w-4 h-4" /></button>
                        <button onClick={() => store.handleDeleteKey(kv.key ?? "")} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {store.filteredKeys.length === 0 && (
                  <div className="text-center py-8 text-dark-muted">
                    <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{store.searchQuery ? "No keys match your search" : "No keys in this bucket"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!store.selectedBucket && (
          <div className="lg:col-span-2">
            <div className="card text-center py-16">
              <FolderOpen className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Bucket</h3>
              <p className="text-dark-muted">Choose a bucket from the left to view its keys</p>
            </div>
          </div>
        )}
      </div>

      {store.showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Bucket</h2>
              <button onClick={() => store.setShowCreateModal(false)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); store.handleCreateBucket({ name: formData.get("name"), history: parseInt(formData.get("history") as string) || 1, storage: "file", max_bytes: parseInt(formData.get("max_bytes") as string) || 0, compression: formData.get("compression") === "true" }); }} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Bucket Name</label><input type="text" name="name" placeholder="my-bucket" className="input w-full" required /></div>
              <div><label className="block text-sm font-medium mb-2">History (Revisions)</label><input type="number" name="history" defaultValue={1} min={1} max={10} className="input w-full" /></div>
              <div><label className="block text-sm font-medium mb-2">Max Bytes (0 = unlimited)</label><input type="number" name="max_bytes" placeholder="1048576" className="input w-full" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="compression" value="true" id="compression" /><label htmlFor="compression" className="text-sm">Enable Compression</label></div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => store.setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Bucket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {store.showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{store.modalMode === "create" ? "Add Key" : "Edit Key"}</h2>
              <button onClick={() => store.setShowKeyModal(false)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); store.handlePutKey({ key: formData.get("key") as string, value: formData.get("value") as string }); }} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Key</label><input type="text" name="key" defaultValue={store.selectedKey || ""} placeholder="my-key" className="input w-full font-mono" disabled={store.modalMode === "edit"} required /></div>
              <div><label className="block text-sm font-medium mb-2">Value</label><textarea name="value" placeholder='{"json": "data"}' rows={6} className="input w-full font-mono" required /></div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => store.setShowKeyModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{store.modalMode === "create" ? "Add" : "Update"} Key</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {store.selectedKeyResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-xl font-bold">Key Detail</h2><p className="text-sm text-dark-muted font-mono">{store.selectedKeyResult.key || store.selectedKey || "unknown-key"}</p></div>
              <button onClick={() => store.setSelectedKeyResult(null)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-dark-bg p-3"><p className="text-xs text-dark-muted">Revision</p><p className="font-mono">{store.selectedKeyResult.revision ?? "N/A"}</p></div>
                <div className="rounded-lg bg-dark-bg p-3"><p className="text-xs text-dark-muted">Created</p><p className="font-mono">{formatTimestamp(store.selectedKeyResult.created)}</p></div>
              </div>
              <div><p className="mb-2 text-sm font-medium">Value</p><pre className="max-h-80 overflow-auto rounded-lg bg-dark-bg p-3 text-sm"><code className="text-green-400">{store.selectedKeyResult.value ?? ""}</code></pre></div>
            </div>
          </div>
        </div>
      )}

      {store.showHistoryModal && store.selectedKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-xl font-bold">Key History</h2><p className="text-sm text-dark-muted font-mono">{store.selectedKey}</p></div>
              <button onClick={() => store.setShowHistoryModal(false)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {store.history?.map((entry: KVKeyHistoryEntry) => (
                <div key={entry.key ?? entry.revision} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-1 bg-primary-500/20 text-primary-400 rounded">{entry.operation}</span>
                      <span className="text-sm text-dark-muted">v{entry.revision}</span>
                      <Clock className="w-3 h-3 text-dark-muted" />
                      <span className="text-xs text-dark-muted">{formatTimestamp(entry.created)}</span>
                    </div>
                  </div>
                  <pre className="text-sm p-3 bg-dark-bg rounded overflow-x-auto"><code className="text-green-400">{entry.value ?? ""}</code></pre>
                </div>
              ))}
              {(!store.history || store.history.length === 0) && (
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
