import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Database, Mail, Globe, Check, ArrowRight, ArrowLeft,
  AlertCircle, Loader2
} from "lucide-react";

interface SetupData {
  nats_url: string;
  server_port: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from: string;
}

export default function SetupWizard() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [data, setData] = useState<SetupData>({
    nats_url: "nats://localhost:4222",
    server_port: 3000,
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    smtp_from: "",
  });

  const steps = [
    { title: "setup.welcome", subtitle: "setup.welcomeDesc", icon: Globe },
    { title: "setup.nats", subtitle: "setup.natsDesc", icon: Database },
    { title: "setup.smtp", subtitle: "setup.smtpDesc", icon: Mail },
    { title: "setup.complete", subtitle: "setup.completeDesc", icon: Check },
  ];

  const updateField = (field: keyof SetupData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1 && !data.nats_url) {
      setError("setup.natsRequired");
      return;
    }
    setError("");
    setStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setError("");
    setStep(prev => Math.max(prev - 1, 0));
  };

  const finishSetup = async () => {
    setLoading(true);
    setError("");

    try {
      // Save config
      const configRes = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nats_url: data.nats_url,
          server_port: data.server_port,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_username: data.smtp_username,
          smtp_password: data.smtp_password,
          smtp_from: data.smtp_from,
        }),
      });

      if (!configRes.ok) {
        const err = await configRes.json();
        throw new Error(err.error || "Failed to save config");
      }

      // Mark setup as completed
      const setupRes = await fetch("/api/config/setup/complete", {
        method: "POST",
      });

      if (!setupRes.ok) {
        throw new Error("Failed to complete setup");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "setup.failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("setup.successTitle")}</h2>
          <p className="text-dark-muted">{t("setup.successDesc")}</p>
        </div>
      </div>
    );
  }

  const CurrentIcon = steps[step].icon;

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="card max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  i === step
                    ? "bg-primary-600 text-white"
                    : i < step
                    ? "bg-green-500/20 text-green-400"
                    : "bg-dark-bg text-dark-muted"
                }`}
              >
                {i < step ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 rounded ${
                    i < step ? "bg-green-500" : "bg-dark-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <CurrentIcon className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t(steps[step].title)}</h2>
          <p className="text-dark-muted">{t(steps[step].subtitle)}</p>
        </div>

        {/* Step Content */}
        <div className="space-y-4 mb-8">
          {step === 0 && (
            <div className="text-center space-y-4">
              <p className="text-sm text-dark-muted">{t("setup.introText")}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-dark-bg rounded-xl">
                  <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs">{t("setup.feature1")}</p>
                </div>
                <div className="p-3 bg-dark-bg rounded-xl">
                  <Mail className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-xs">{t("setup.feature2")}</p>
                </div>
                <div className="p-3 bg-dark-bg rounded-xl">
                  <Globe className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs">{t("setup.feature3")}</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("setup.natsUrl")}
                </label>
                <input
                  type="text"
                  value={data.nats_url}
                  onChange={(e) => updateField("nats_url", e.target.value)}
                  placeholder="nats://localhost:4222"
                  className="input w-full"
                />
                <p className="text-xs text-dark-muted mt-1">{t("setup.natsHelp")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("setup.serverPort")}
                </label>
                <input
                  type="number"
                  value={data.server_port}
                  onChange={(e) => updateField("server_port", parseInt(e.target.value) || 3000)}
                  className="input w-full"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-dark-muted">{t("setup.smtpOptional")}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("setup.smtpHost")}
                  </label>
                  <input
                    type="text"
                    value={data.smtp_host}
                    onChange={(e) => updateField("smtp_host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("setup.smtpPort")}
                  </label>
                  <input
                    type="number"
                    value={data.smtp_port}
                    onChange={(e) => updateField("smtp_port", parseInt(e.target.value) || 587)}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("setup.smtpUsername")}
                </label>
                <input
                  type="text"
                  value={data.smtp_username}
                  onChange={(e) => updateField("smtp_username", e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("setup.smtpPassword")}
                </label>
                <input
                  type="password"
                  value={data.smtp_password}
                  onChange={(e) => updateField("smtp_password", e.target.value)}
                  placeholder="••••••••"
                  className="input w-full"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-dark-bg rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-muted">{t("setup.natsUrl")}</span>
                  <span className="font-mono text-sm">{data.nats_url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">{t("setup.serverPort")}</span>
                  <span className="font-mono text-sm">{data.server_port}</span>
                </div>
                {data.smtp_host && (
                  <div className="flex justify-between">
                    <span className="text-dark-muted">{t("setup.smtpHost")}</span>
                    <span className="font-mono text-sm">{data.smtp_host}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-dark-muted text-center">
                {t("setup.confirmText")}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t(error)}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </button>
          
          {step < steps.length - 1 ? (
            <button onClick={nextStep} className="btn-primary flex items-center gap-2">
              {t("common.next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finishSetup}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {t("setup.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
