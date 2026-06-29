import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Download, Trash2, Send } from "lucide-react";
import Button from "../../../components/ui/Button";

interface MessagesHeaderProps {
  title: string;
  description: string;
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
  onPublish: () => void;
  isDeletePending?: boolean;
  rightElement?: ReactNode;
}

export default function MessagesHeader({
  title,
  description,
  selectedCount,
  onExport,
  onDelete,
  onPublish,
  isDeletePending = false,
  rightElement,
}: MessagesHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-dark-muted mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {selectedCount > 0 && (
          <>
            <Button
              onClick={onExport}
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
            >
              {t('messages.exportCount', { count: selectedCount })}
            </Button>
            <Button
              onClick={onDelete}
              disabled={isDeletePending}
              variant="secondary"
              icon={<Trash2 className="w-4 h-4" />}
              className="text-status-error"
            >
              {t('messages.deleteCount', { count: selectedCount })}
            </Button>
          </>
        )}
        <Button
          onClick={onPublish}
          variant="primary"
          icon={<Send className="w-4 h-4" />}
        >
          {t('messages.publishMessage')}
        </Button>
        {rightElement}
      </div>
    </div>
  );
}
