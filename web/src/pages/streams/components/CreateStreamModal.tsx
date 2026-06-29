import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type { CreateStreamRequest } from "../../../types";
import { ModalWrapper } from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

interface CreateStreamModalProps {
  onClose: () => void;
  onSubmit: (data: CreateStreamRequest) => void;
  isPending: boolean;
}

export default function CreateStreamModal({
  onClose,
  onSubmit,
  isPending,
}: CreateStreamModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [storage, setStorage] = useState<"file" | "memory">("file");
  const [replicas, setReplicas] = useState(1);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name,
      subjects: subjects
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean),
      storage: storage as CreateStreamRequest["storage"],
      replicas,
    });
  };

  return createPortal(
    <ModalWrapper isOpen={true}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="card max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold">{t("streams.createStream")}</h2>
            <button onClick={onClose} className="p-2 hover:bg-dark-bg rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-sm font-medium mb-2">
               {t("streams.streamName")}
             </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                 placeholder={t("streams.streamNamePlaceholder")}
                className="input w-full"
                required
              />
            </div>
            <div>
               <label className="block text-sm font-medium mb-2">{t("streams.subjects")}</label>
              <input
                type="text"
                value={subjects}
                onChange={(event) => setSubjects(event.target.value)}
                 placeholder={t("streams.subjectsPlaceholder")}
                className="input w-full"
                required
              />
               <p className="text-xs text-dark-muted mt-1">{t("streams.subjectsHelp")}</p>
            </div>
            <div>
               <label className="block text-sm font-medium mb-2">{t("streams.storage")}</label>
              <Select
                value={storage}
                onChange={(value) => setStorage(value as "file" | "memory")}
                options={[
                  { value: "file", label: t("streams.file") },
                  { value: "memory", label: t("streams.memory") },
                ]}
                className="w-full"
                aria-label={t("streams.storage")}
              />
            </div>
            <div>
               <label className="block text-sm font-medium mb-2">{t("streams.replicas")}</label>
              <input
                type="number"
                value={replicas}
                onChange={(event) => setReplicas(Number(event.target.value))}
                min={1}
                max={5}
                className="input w-full"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
               <Button type="button" onClick={onClose} variant="secondary">
                 {t("common.cancel")}
               </Button>
               <Button type="submit" disabled={isPending} variant="primary" loading={isPending}>
                 {isPending ? t("streams.creating") : t("streams.createStream")}
               </Button>
            </div>
          </form>
        </div>
      </div>
    </ModalWrapper>,
    document.body
  );
}
