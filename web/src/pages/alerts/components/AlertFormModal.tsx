import type { Alert } from "../../../types";
import { Duration } from "../../../types";
import { createPortal } from "react-dom";

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
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // Collect selected channels
    const channels: string[] = [];
    if ((formData.get("channel_email") as string) === "on") channels.push("email");
    if ((formData.get("channel_webhook") as string) === "on") channels.push("webhook");
    if ((formData.get("channel_slack") as string) === "on") channels.push("slack");

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
      cooldown: Duration.Minute * 5,
    };
    onSubmit(data);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {alert ? "Edit Alert" : "Create Alert"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg rounded-lg"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Alert Name</label>
            <input
              type="text"
              name="name"
              defaultValue={alert?.name}
              placeholder="High Consumer Lag"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={alert?.description}
              placeholder="Alert when consumer lag exceeds threshold"
              rows={2}
              className="input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Condition Type
              </label>
              <select
                name="condition_type"
                defaultValue={alert?.condition?.type || "lag"}
                className="input w-full"
              >
                <option value="lag">Consumer Lag</option>
                <option value="storage">Storage Usage</option>
                <option value="messages">Message Count</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Severity</label>
              <select
                name="severity"
                defaultValue={alert?.severity || "warning"}
                className="input w-full"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Operator</label>
              <select
                name="operator"
                defaultValue={alert?.condition?.operator || ">"}
                className="input w-full"
              >
                <option value=">">Greater than</option>
                <option value="<">Less than</option>
                <option value=">=">Greater or equal</option>
                <option value="<=">Less or equal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Threshold</label>
              <input
                type="number"
                name="threshold"
                defaultValue={alert?.condition?.threshold || 1000}
                className="input w-full"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Stream Name (optional)
            </label>
            <input
              type="text"
              name="stream"
              defaultValue={alert?.condition?.stream || ""}
              placeholder="my-stream"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Consumer Name (optional)
            </label>
            <input
              type="text"
              name="consumer"
              defaultValue={alert?.condition?.consumer || ""}
              placeholder="my-consumer"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Notification Channels
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="channel_email"
                  defaultChecked={alert?.channels?.includes("email")}
                  className="rounded"
                />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="channel_webhook"
                  defaultChecked={alert?.channels?.includes("webhook")}
                  className="rounded"
                />
                <span className="text-sm">Webhook</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="channel_slack"
                  defaultChecked={alert?.channels?.includes("slack")}
                  className="rounded"
                />
                <span className="text-sm">Slack</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="enabled"
              id="enabled"
              defaultChecked={alert?.enabled ?? true}
              value="true"
            />
            <label htmlFor="enabled" className="text-sm">
              Enable this alert
            </label>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {alert ? "Update" : "Create"} Alert
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
