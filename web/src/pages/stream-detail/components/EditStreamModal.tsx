import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import type { StreamEditForm } from "../hooks/useStreamDetail";
import { ModalWrapper } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui";

interface EditStreamModalProps {
  name: string;
  editForm: StreamEditForm;
  updatePending: boolean;
  setEditForm: (form: StreamEditForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditStreamModal({
  name,
  editForm,
  updatePending,
  setEditForm,
  onClose,
  onSave,
}: EditStreamModalProps) {
  const { t } = useTranslation();

  return createPortal(
    <ModalWrapper isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="card w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {t("streams.editStream")}: {name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-bg rounded-lg"
            >
              <span className="text-dark-muted">✕</span>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-muted mb-1">
                {t("streams.editSubjects")}
              </label>
              <input
                type="text"
                className="input w-full"
                value={editForm.subjects}
                onChange={(e) =>
                  setEditForm({ ...editForm, subjects: e.target.value })
                }
                placeholder={t("streams.subjectsPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">
                {t("streams.replicas")}
              </label>
              <input
                type="number"
                className="input w-full"
                min={1}
                max={5}
                value={editForm.replicas}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    replicas: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">
                {t("streams.maxAgeLabel")}
              </label>
              <input
                type="text"
                className="input w-full"
                value={editForm.max_age}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_age: e.target.value })
                }
                placeholder={t("streams.maxAgePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">
                {t("streams.maxBytesLabel")}
              </label>
              <input
                type="number"
                className="input w-full"
                min={0}
                value={editForm.max_bytes}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    max_bytes: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="secondary" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={onSave} loading={updatePending}>
              {t("streams.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </ModalWrapper>,
    document.body,
  );
}
