import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import type { ConsumerEditForm } from "../hooks/useConsumerDetail";
import { ModalWrapper } from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

interface EditConsumerModalProps {
  name: string;
  editForm: ConsumerEditForm;
  updatePending: boolean;
  setEditForm: (form: ConsumerEditForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditConsumerModal({
  name,
  editForm,
  updatePending,
  setEditForm,
  onClose,
  onSave,
}: EditConsumerModalProps) {
  const { t } = useTranslation();

  return createPortal(
    <ModalWrapper isOpen={true}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t("consumers.editConsumer", { name })}</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-bg rounded-lg">
            <span className="text-dark-muted">✕</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">{t("consumers.ackPolicy")}</label>
            <Select
              value={editForm.ack_policy}
              onChange={(value) => setEditForm({ ...editForm, ack_policy: value })}
              options={[
                { value: "explicit", label: t("consumers.explicit") },
                { value: "all", label: t("common.all") },
                { value: "none", label: t("common.none") },
              ]}
              className="w-full"
              aria-label={t("consumers.ackPolicy")}
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">{t("consumers.deliveryPolicy")}</label>
            <Select
              value={editForm.deliver_policy}
              onChange={(value) => setEditForm({ ...editForm, deliver_policy: value })}
              options={[
                { value: "all", label: t("common.all") },
                { value: "last", label: t("consumers.last") },
                { value: "new", label: t("consumers.new") },
              ]}
              className="w-full"
              aria-label={t("consumers.deliveryPolicy")}
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">{t("consumers.replayPolicy")}</label>
            <Select
              value={editForm.replay_policy}
              onChange={(value) => setEditForm({ ...editForm, replay_policy: value })}
              options={[
                { value: "instant", label: t("consumers.instant") },
                { value: "original", label: t("consumers.original") },
              ]}
              className="w-full"
              aria-label={t("consumers.replayPolicy")}
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">{t("consumers.maxDeliverLabel")}</label>
            <input type="number" className="input w-full" min={-1} value={editForm.max_deliver} onChange={(e) => setEditForm({ ...editForm, max_deliver: parseInt(e.target.value) || -1 })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6">
          <Button onClick={onClose} variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={updatePending} variant="primary" loading={updatePending}>
            {t("common.save")}
          </Button>
        </div>
      </div>
      </div>
    </ModalWrapper>,
    document.body
  );
}
