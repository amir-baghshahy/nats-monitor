import {
  Clock, Database, Edit, FolderOpen, History, Key, Plus, RefreshCw, Search, Trash2, X, Eye,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import type { KVBucketInfo, KVKeyEntry, KVKeyHistoryEntry } from "../../types";
import { useKVStore } from "./hooks/useKVStore";
import { PageError, PageLoading } from "../../components/ui/PageState";
import { ModalWrapper, PageHeader, PanelCard, EmptyState } from "../../components/ui";
import { Button } from "../../components/ui";

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
  const { t } = useTranslation();
  const store = useKVStore();

  if (store.bucketsLoading || (store.selectedBucket && store.keysLoading)) {
    return <PageLoading text={t('kvStore.loading')} />;
  }

  if (store.bucketsError || store.keysError) {
    return <PageError message={(store.bucketsError || store.keysError) instanceof Error ? (store.bucketsError as Error).message : t('kvStore.unableToLoad')} onRetry={store.refetchBuckets} />;
  }

  if (store.selectedBucket && store.historyError) {
    return <PageError message={store.historyError instanceof Error ? (store.historyError as Error).message : t('kvStore.unableToLoadHistory')} onRetry={store.refetchBuckets} />;
  }

  return (
    <div className="p-2 md:p-3 lg:p-4">
      <PageHeader
        title={t('kvStore.title')}
        subtitle={t('kvStore.subtitle')}
        actions={
           <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => store.setShowCreateModal(true)}>
             {t('kvStore.newBucket')}
           </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
           <PanelCard
             header={
               <div className="flex items-center justify-between">
                 <h2 className="font-semibold flex items-center gap-2">
                   <Database className="w-5 h-5 text-primary-400" />
                   {t('kvStore.buckets', { count: store.buckets?.length || 0 })}
                 </h2>
                 <div className="flex items-center gap-2">
                   <button onClick={() => store.refetchBuckets()} className="p-2 hover:bg-dark-bg rounded-lg">
                     <RefreshCw className="w-4 h-4" />
                   </button>
                   <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} size="sm" onClick={() => store.handlePurgeBucket()}>
                     {t('streams.purge')}
                   </Button>
                   <Button variant="primary" icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => { store.setModalMode("create"); store.setShowKeyModal(true); }}>
                     {t('kvStore.addKey')}
                   </Button>
                 </div>
               </div>
             }
           >
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
                      <p className="text-xs text-dark-muted">{t('kvStore.keysCount', { keys: bucket.values?.toLocaleString() || 0, bytes: formatBytes(bucket.bytes || 0) })}</p>
                    </div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await store.handleDeleteBucket(bucket.name ?? bucket.bucket_name ?? ""); }}
                      className="p-2 hover:bg-red-500/20 rounded-lg"
                      title={t('kvStore.delete')}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {(!store.buckets || store.buckets.length === 0) && (
                <div className="text-center py-8 text-dark-muted">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('kvStore.noBucketsFound')}</p>
                  <button onClick={() => store.setShowCreateModal(true)} className="text-primary-400 hover:underline text-sm mt-2">{t('kvStore.createFirstBucket')}</button>
                </div>
              )}
            </div>
          </PanelCard>
        </div>

        {store.selectedBucket && (
          <div className="lg:col-span-2">
            <PanelCard
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary-400" />
                      {t('kvStore.keys', { count: store.filteredKeys.length })}
                    </h2>
                    <p className="text-sm text-dark-muted">
                      {store.buckets?.find((b: KVBucketInfo) => b.name === store.selectedBucket)?.bucket_name}
                    </p>
                  </div>
                   <div className="flex items-center gap-2">
                     <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} size="sm" onClick={() => store.handlePurgeBucket()}>
                       {t('streams.purge')}
                     </Button>
                     <Button variant="primary" icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => { store.setModalMode("create"); store.setShowKeyModal(true); }}>
                       {t('kvStore.addKey')}
                     </Button>
                  </div>
                </div>
              }
            >
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                <input type="text" placeholder={t('kvStore.searchKeys')} value={store.searchQuery} onChange={(e) => store.setSearchQuery(e.target.value)} className="input pl-10 w-full" />
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {store.filteredKeys.map((kv: KVKeyEntry) => (
                  <div key={kv.key ?? kv.revision} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-bg/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="w-4 h-4 text-primary-400" />
                          <span className="font-mono text-sm font-medium">{kv.key ?? "unknown-key"}</span>
                          <span className="text-xs text-dark-muted">{t('kvStore.version', { revision: kv.revision ?? 0 })}</span>
                        </div>
                        <div className="text-sm text-dark-muted truncate max-h-16 overflow-hidden">{kv.value ?? ""}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-dark-muted">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(kv.created)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => store.handleGetKey(kv.key ?? "")} className="p-2 hover:bg-dark-border rounded-lg" title={t('kvStore.getKey')}><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { store.setSelectedKey(kv.key ?? ""); store.setModalMode("edit"); store.setShowKeyModal(true); }} className="p-2 hover:bg-dark-border rounded-lg" title={t('kvStore.edit')}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { store.setSelectedKey(kv.key ?? ""); store.setShowHistoryModal(true); }} className="p-2 hover:bg-dark-border rounded-lg" title={t('kvStore.history')}><History className="w-4 h-4" /></button>
                        <button onClick={() => store.handleDeleteKey(kv.key ?? "")} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg" title={t('kvStore.delete')}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {store.filteredKeys.length === 0 && (
                  <div className="text-center py-8 text-dark-muted">
                    <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{store.searchQuery ? t('kvStore.noKeysMatch') : t('kvStore.noKeysInBucket')}</p>
                  </div>
                )}
              </div>
            </PanelCard>
          </div>
        )}

        {!store.selectedBucket && (
          <div className="lg:col-span-2">
            <EmptyState
              icon={FolderOpen}
              title={t('kvStore.selectBucket')}
              description={t('kvStore.selectBucketDescription')}
            />
          </div>
        )}
      </div>

      {store.showCreateModal && createPortal(
        <ModalWrapper isOpen={true}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">{t('kvStore.createBucket')}</h2>
              <button onClick={() => store.setShowCreateModal(false)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); store.handleCreateBucket({ name: formData.get("name"), history: parseInt(formData.get("history") as string) || 1, storage: "file", max_bytes: parseInt(formData.get("max_bytes") as string) || 0, compression: formData.get("compression") === "true" }); }} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">{t('kvStore.bucketName')}</label><input type="text" name="name" placeholder={t('kvStore.bucketNamePlaceholder')} className="input w-full" required /></div>
              <div><label className="block text-sm font-medium mb-2">{t('kvStore.historyRevisions')}</label><input type="number" name="history" defaultValue={1} min={1} max={10} className="input w-full" /></div>
              <div><label className="block text-sm font-medium mb-2">{t('kvStore.maxBytes')}</label><input type="number" name="max_bytes" placeholder={t('kvStore.maxBytesPlaceholder')} className="input w-full" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="compression" value="true" id="compression" /><label htmlFor="compression" className="text-sm">{t('kvStore.enableCompression')}</label></div>
               <div className="flex items-center gap-3 pt-4">
                 <Button type="button" variant="secondary" onClick={() => store.setShowCreateModal(false)}>{t('common.cancel')}</Button>
                 <Button type="submit" variant="primary">{t('kvStore.createBucket')}</Button>
               </div>
            </form>
          </div>
        </div>
        </ModalWrapper>,
        document.body
      )}

      {store.showKeyModal && createPortal(
        <ModalWrapper isOpen={true}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">{store.modalMode === "create" ? t('kvStore.addKey') : t('kvStore.editKey')}</h2>
              <button onClick={() => store.setShowKeyModal(false)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); store.handlePutKey({ key: formData.get("key") as string, value: formData.get("value") as string }); }} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">{t('kvStore.key')}</label><input type="text" name="key" defaultValue={store.selectedKey || ""} placeholder={t('kvStore.keyPlaceholder')} className="input w-full font-mono" disabled={store.modalMode === "edit"} required /></div>
              <div><label className="block text-sm font-medium mb-2">{t('kvStore.value')}</label><textarea name="value" placeholder={t('kvStore.valuePlaceholder')} rows={6} className="input w-full font-mono" required /></div>
               <div className="flex items-center gap-3 pt-4">
                 <Button type="button" variant="secondary" onClick={() => store.setShowKeyModal(false)}>{t('common.cancel')}</Button>
                 <Button type="submit" variant="primary">{store.modalMode === "create" ? t('kvStore.add') : t('kvStore.update')} {t('kvStore.key')}</Button>
               </div>
            </form>
          </div>
        </div>
        </ModalWrapper>,
        document.body
      )}

      {store.selectedKeyResult && createPortal(
        <ModalWrapper isOpen={true}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-sm font-bold">{t('kvStore.keyDetail')}</h2><p className="text-xs text-dark-muted font-mono">{store.selectedKeyResult.key || store.selectedKey || "unknown-key"}</p></div>
              <button onClick={() => store.setSelectedKeyResult(null)} className="p-2 hover:bg-dark-bg rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-dark-bg p-3"><p className="text-xs text-dark-muted">{t('kvStore.revision')}</p><p className="font-mono">{store.selectedKeyResult.revision ?? "N/A"}</p></div>
                <div className="rounded-lg bg-dark-bg p-3"><p className="text-xs text-dark-muted">{t('streams.created')}</p><p className="font-mono">{formatTimestamp(store.selectedKeyResult.created)}</p></div>
              </div>
              <div><p className="mb-2 text-sm font-medium">{t('kvStore.value')}</p><pre className="max-h-80 overflow-auto rounded-lg bg-dark-bg p-3 text-sm"><code className="text-green-400">{store.selectedKeyResult.value ?? ""}</code></pre></div>
            </div>
          </div>
        </div>
        </ModalWrapper>,
        document.body
      )}

      {store.showHistoryModal && store.selectedKey && createPortal(
        <ModalWrapper isOpen={true}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-sm font-bold">{t('kvStore.keyHistory')}</h2><p className="text-xs text-dark-muted font-mono">{store.selectedKey}</p></div>
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
                  <p>{t('kvStore.noHistory')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </ModalWrapper>,
        document.body
      )}
    </div>
  );
}
