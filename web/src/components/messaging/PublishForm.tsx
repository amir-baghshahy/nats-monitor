import { Send } from "lucide-react";
import { validateSubject, validateJSON } from "../../utils/validators";

export interface PublishForm {
  subject: string;
  payload: string;
  replyTo: string;
  headers: string;
}

interface PublishFormProps {
  /**
   * Current form data
   */
  form: PublishForm;

  /**
   * Form update callback
   */
  onChange: (form: PublishForm) => void;

  /**
   * Submit callback
   */
  onSubmit: () => void;

  /**
   * Form errors
   */
  errors?: Record<string, string>;
}

/**
 * PublishForm for publishing NATS messages
 */
export default function PublishForm({
  form,
  onChange,
  onSubmit,
  errors = {},
}: PublishFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const subjectValidation = validateSubject(form.subject);
    if (!subjectValidation.valid) {
      return;
    }

    if (form.headers) {
      const headersValidation = validateJSON(form.headers);
      if (!headersValidation.valid) {
        return;
      }
    }

    onSubmit();
  };

  const updateField = (field: keyof PublishForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="card max-w-2xl">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Send className="w-5 h-5" />
        Publish Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <p className="text-xs text-dark-muted mb-2">
            The NATS address this message is sent to, e.g. orders.created.
          </p>
          <input
            type="text"
            placeholder="orders.created"
            value={form.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            className="input w-full font-mono"
            required
          />
          {errors.subject && (
            <p className="text-red-400 text-xs mt-1">{errors.subject}</p>
          )}
        </div>

        {/* Reply To */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reply To (Optional)
          </label>
          <input
            type="text"
            placeholder="_INBOX.reply"
            value={form.replyTo}
            onChange={(e) => updateField("replyTo", e.target.value)}
            className="input w-full font-mono"
          />
        </div>

        {/* Headers */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Headers (JSON, Optional)
          </label>
          <textarea
            placeholder='{"Content-Type": "application/json"}'
            value={form.headers}
            onChange={(e) => updateField("headers", e.target.value)}
            className="input w-full font-mono h-20"
          />
          {errors.headers && (
            <p className="text-red-400 text-xs mt-1">{errors.headers}</p>
          )}
        </div>

        {/* Payload */}
        <div>
          <label className="block text-sm font-medium mb-2">Payload</label>
          <textarea
            placeholder='{"order_id": "123", "amount": 99.99}'
            value={form.payload}
            onChange={(e) => updateField("payload", e.target.value)}
            className="input w-full font-mono h-40"
            required
          />
          {errors.payload && (
            <p className="text-red-400 text-xs mt-1">{errors.payload}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" />
            Publish
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                subject: "",
                payload: "",
                replyTo: "",
                headers: "{}",
              })
            }
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
