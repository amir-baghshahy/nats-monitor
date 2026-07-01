import { Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { ModalWrapper } from "../../../components/ui/Modal";
import { useState } from "react";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

interface PublishModalProps {
  streams: any[];
  defaultStream?: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: { stream: string; subject: string; data: string }) => void;
}

export default function PublishModal({
  streams,
  defaultStream = "",
  isPending,
  onClose,
  onSubmit,
}: PublishModalProps) {
  const { t } = useTranslation();
  const [selectedStream, setSelectedStream] = useState(defaultStream);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    onSubmit({
      stream: selectedStream || (formData.get("stream") as string) || defaultStream,
      subject: formData.get("subject") as string,
      data: formData.get("payload") as string,
    });
  };

  return createPortal(
    <ModalWrapper isOpen={true} onClose={onClose}>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
          <div className="flex items-center justify-between mb-4">
            <h2 id="publish-modal-title" className="text-sm font-bold">{t('messages.publishMessage')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-dark-bg rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('messages.stream')}</label>
              <Select
                value={selectedStream}
                onChange={setSelectedStream}
                options={streams?.map((stream: any) => ({
                  value: stream.config?.name || "",
                  label: stream.config?.name || ""
                })) || []}
                placeholder={t('messages.selectStream')}
                className="w-full"
                aria-label={t('messages.stream')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('messages.subject')}</label>
              <input
                type="text"
                name="subject"
                placeholder={t('messages.subjectPlaceholder')}
                className="input w-full font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('messages.payloadJson')}
              </label>
              <textarea
                name="payload"
                placeholder={t('messages.payloadPlaceholder')}
                className="input w-full font-mono h-40"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                variant="primary"
                loading={isPending}
                icon={<Send className="w-4 h-4" />}
              >
                {isPending ? t('messages.publishing') : t('messages.publish')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ModalWrapper>,
    document.body
  );
}
