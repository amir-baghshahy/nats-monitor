import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { ModalWrapper } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui";

interface CloneConsumerModalProps {
  name: string;
  stream: string;
  cloneName: string;
  clonePending: boolean;
  setCloneName: (value: string) => void;
  onClose: () => void;
  onClone: () => void;
}

export default function CloneConsumerModal({
  stream,
  cloneName,
  clonePending,
  setCloneName,
  onClose,
  onClone,
}: CloneConsumerModalProps) {
  const { t } = useTranslation();

  return createPortal(
    <ModalWrapper isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="card w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t("consumers.cloneConsumerTitle")}</h2>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-dark-bg rounded-lg">
              <span className="text-dark-muted">✕</span>
            </button>
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">{t("consumers.newConsumerName")}</label>
            <input type="text" className="input w-full" value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder={t("consumers.newConsumerNamePlaceholder")} />
            <p className="text-xs text-dark-muted mt-2">
              {t("consumers.cloneConsumerHelp", { stream })}
            </p>
          </div>
           <div className="flex justify-end gap-3 pt-6">
             <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
             <Button variant="primary" onClick={onClone} disabled={clonePending || !cloneName.trim()} icon={clonePending ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
               {t("consumers.clone")}
             </Button>
           </div>
        </div>
      </div>
    </ModalWrapper>,
    document.body
  );
}
