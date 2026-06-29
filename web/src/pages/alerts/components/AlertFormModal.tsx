import type { Alert } from "../../../types";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Mail, Webhook, Hash } from "lucide-react";

interface AlertFormModalProps {
  isOpen: boolean;
  alert: Alert | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Alert>) => void;
}

export default function AlertFormModal({
  isOpen,
  alert,
  isPending,
  onClose,
  onSubmit,
}: AlertFormModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const channels: string[] = [];
    if (formData.get("channel_email") === "on") channels.push("email");
    if (formData.get("channel_webhook") === "on") channels.push("webhook");
    if (formData.get("channel_slack") === "on") channels.push("slack");

    const data: Partial<Alert> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      severity: formData.get("severity") as Alert["severity"],
      enabled: formData.get("enabled") === "true",
      condition: {
        type: formData.get("condition_type") as string,
        stream: formData.get("stream") as string,
        consumer: formData.get("consumer") as string,
        threshold: parseInt(formData.get("threshold") as string),
        operator: formData.get("operator") as string,
      },
      channels,
      emailAddress: formData.get("email_address") as string,
      webhookUrl: formData.get("webhook_url") as string,
      slackWebhookUrl: formData.get("slack_webhook_url") as string,
      cooldown: 300000000000 as any,
    };
    onSubmit(data);
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border flex-shrink-0">
          <h2 className="text-xl font-bold">
            {alert ? t("alerts.editAlert") : t("alerts.createAlert")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5">
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  {t("alerts.alertName")}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={alert?.name}
                  placeholder={t("alerts.alertNamePlaceholder")}
                  className="input w-full"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  {t("alerts.description")}
                </label>
                <textarea
                  name="description"
                  defaultValue={alert?.description}
                  placeholder={t("alerts.descriptionPlaceholder")}
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
            </div>

            {/* Condition */}
            <div className="border border-dark-border rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wide">
                {t("alerts.conditionType")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Type</label>
                  <select
                    name="condition_type"
                    defaultValue={alert?.condition?.type || "lag"}
                    className="input w-full"
                  >
                    <option value="lag">{t("alerts.consumerLag")}</option>
                    <option value="storage">{t("alerts.storageUsage")}</option>
                    <option value="messages">{t("alerts.messageCount")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Operator</label>
                  <select
                    name="operator"
                    defaultValue={alert?.condition?.operator || ">"}
                    className="input w-full"
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&ge;</option>
                    <option value="<=">&le;</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Threshold</label>
                  <input
                    type="number"
                    name="threshold"
                    defaultValue={alert?.condition?.threshold || 1000}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-muted mb-1">Severity</label>
                  <select
                    name="severity"
                    defaultValue={alert?.severity || "warning"}
                    className="input w-full"
                  >
                    <option value="info">{t("alerts.info")}</option>
                    <option value="warning">{t("alerts.warning")}</option>
                    <option value="critical">{t("alerts.critical")}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-muted mb-1">
                    {t("alerts.streamNameOptional")}
                  </label>
                  <input
                    type="text"
                    name="stream"
                    defaultValue={alert?.condition?.stream || ""}
                    placeholder={t("alerts.streamNamePlaceholder")}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-muted mb-1">
                    {t("alerts.consumerNameOptional")}
                  </label>
                  <input
                    type="text"
                    name="consumer"
                    defaultValue={alert?.condition?.consumer || ""}
                    placeholder={t("alerts.consumerNamePlaceholder")}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="border border-dark-border rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wide">
                {t("alerts.notificationChannels")}
              </h3>
              
              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="channel_email"
                    defaultChecked={alert?.channels?.includes("email")}
                    className="rounded"
                  />
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">{t("alerts.email")}</span>
                </label>
                <input
                  type="email"
                  name="email_address"
                  defaultValue={alert?.emailAddress || ""}
                  placeholder={t("alerts.emailPlaceholder")}
                  className="input w-full"
                />
              </div>

              {/* Webhook */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="channel_webhook"
                    defaultChecked={alert?.channels?.includes("webhook")}
                    className="rounded"
                  />
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Webhook className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{t("alerts.webhook")}</span>
                </label>
                <input
                  type="url"
                  name="webhook_url"
                  defaultValue={alert?.webhookUrl || ""}
                  placeholder={t("alerts.webhookPlaceholder")}
                  className="input w-full"
                />
              </div>

              {/* Slack */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="channel_slack"
                    defaultChecked={alert?.channels?.includes("slack")}
                    className="rounded"
                  />
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Hash className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">{t("alerts.slack")}</span>
                </label>
                <input
                  type="url"
                  name="slack_webhook_url"
                  defaultValue={alert?.slackWebhookUrl || ""}
                  placeholder={t("alerts.slackPlaceholder")}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="enabled"
                id="enabled"
                defaultChecked={alert?.enabled ?? true}
                value="true"
              />
              <label htmlFor="enabled" className="text-sm">
                {t("alerts.enableAlert")}
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-border flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={isPending} className="btn-primary" onClick={(e) => {
            const form = (e.target as HTMLElement).closest('.card')?.querySelector('form');
            if (form) form.requestSubmit();
          }}>
            {alert ? t("alerts.update") : t("alerts.create")} Alert
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
