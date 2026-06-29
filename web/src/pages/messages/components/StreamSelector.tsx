import { Search, Filter, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "../../../components/ui/Select";

interface StreamSelectorProps {
  streams: any[];
  selectedStream: string;
  searchQuery: string;
  showFilters: boolean;
  onStreamChange: (stream: string) => void;
  onSearchChange: (query: string) => void;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

export default function StreamSelector({
  streams,
  selectedStream,
  searchQuery,
  showFilters,
  onStreamChange,
  onSearchChange,
  onToggleFilters,
  onRefresh,
}: StreamSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="card mb-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-dark-muted mb-2">{t('messages.selectStream')}</label>
          <Select
            value={selectedStream}
            onChange={onStreamChange}
            options={streams?.map((stream: any) => ({
              value: stream.config?.name || stream.name,
              label: `${stream.config?.name || stream.name} (${stream.state?.messages?.toLocaleString()} messages)`
            })) || []}
            placeholder={t('messages.selectStream')}
            className="w-full"
          />
        </div>
        <div className="flex-1 relative">
          <label className="block text-sm text-dark-muted mb-2">{t('messages.searchMessages')}</label>
          <Search className="absolute left-3 top-9 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder={t('messages.searchMessagesPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-end gap-3">
          <button
            onClick={onToggleFilters}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? t('messages.lessFilters') : t('messages.filters')}
          </button>
          <button onClick={onRefresh} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
