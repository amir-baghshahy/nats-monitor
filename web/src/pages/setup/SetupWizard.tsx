import PanelCard from "../../components/ui/PanelCard";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Database, Mail, Globe, Check, AlertCircle } from "lucide-react";

interface SetupData {
  nats_url: string;
  server_port: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from: string;
}

const RESTART_KEY = "nats-setup-restarting";

export default function SetupWizard() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restarting, setRestarting] = useState(() => {
    // Check localStorage on mount to persist restart state across page reloads
    return localStorage.getItem(RESTART_KEY) === "true";
  });

  const [data, setData] = useState<SetupData>({
    nats_url: "nats://localhost:4222",
    server_port: 3000,
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    smtp_from: "",
  });

  const updateField = (field: keyof SetupData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const finishSetup = async () => {
    setLoading(true);
    setError("");

    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      await fetch("/api/config/setup/complete", { method: "POST" });

      setLoading(false);
      setRestarting(true);
      localStorage.setItem(RESTART_KEY, "true");
      await handleServerRestart();
    } catch (err: any) {
      setError(err.message || "setup.failed");
      setLoading(false);
    }
  };

  const handleServerRestart = async () => {
    try {
      await fetch("/api/config/restart", { method: "POST" });
    } catch {
      // Ignore - connection will drop during restart
    }

    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          localStorage.removeItem(RESTART_KEY);
          window.location.reload();
          return;
        }
      } catch {
        // Server not ready yet
      }
    }
    setRestarting(false);
    localStorage.removeItem(RESTART_KEY);
    setError("Server restart timed out. Please refresh the page.");
  };

  // Poll for server health when in restart mode (e.g., after page reload)
  useEffect(() => {
    if (restarting) {
      const pollHealth = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            const response = await fetch("/api/health");
            if (response.ok) {
              localStorage.removeItem(RESTART_KEY);
              window.location.reload();
              return;
            }
          } catch {
            // Server not ready yet
          }
        }
        setRestarting(false);
        localStorage.removeItem(RESTART_KEY);
        setError("Server restart timed out. Please refresh the page.");
      };
      pollHealth();
    }
  }, [restarting]);

  if (restarting) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark-text">Restarting...</h2>
          <p className="text-sm text-dark-muted">Please wait</p>
        </div>
      </div>
    );
  }

  const CurrentIcon = step === 0 ? Globe : step === 1 ? Database : step === 2 ? Mail : Check;

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                i < step ? "bg-green-500 text-white" :
                i === step ? "bg-primary-600 text-white" :
                "bg-dark-border text-dark-muted"
              }`}>
                {i < step ? <Check className="w-5 h-5" /> : <CurrentIcon className="w-5 h-5" />}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 mx-2 rounded-full ${
                  i < step ? "bg-green-500" : "bg-dark-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <PanelCard className="!p-5 sm:!p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
              <CurrentIcon className="w-6 h-6 text-primary-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-dark-text mb-1">
              {step === 0 && t("setup.welcome")}
              {step === 1 && t("setup.nats")}
              {step === 2 && t("setup.smtp")}
              {step === 3 && t("setup.complete")}
            </h2>
            <p className="text-xs sm:text-sm text-dark-muted">
              {step === 0 && t("setup.welcomeDesc")}
              {step === 1 && t("setup.natsDesc")}
              {step === 2 && t("setup.smtpDesc")}
              {step === 3 && t("setup.completeDesc")}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-4">
            {step === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-dark-muted mb-6">{t("setup.introText")}</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-xs text-dark-muted">{t("setup.feature1")}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                      <Mail className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-xs text-dark-muted">{t("setup.feature2")}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                      <Globe className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-xs text-dark-muted">{t("setup.feature3")}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-dark-text">NATS URL</label>
                  <input
                    type="text"
                    value={data.nats_url}
                    onChange={(e) => updateField("nats_url", e.target.value)}
                    placeholder="nats://localhost:4222"
                    className="w-full px-4 py-3 rounded-lg border border-dark-border bg-dark-bg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-dark-text">Server Port</label>
                  <input
                    type="number"
                    value={data.server_port}
                    onChange={(e) => updateField("server_port", parseInt(e.target.value) || 3000)}
                    className="w-full px-4 py-3 rounded-lg border border-dark-border bg-dark-bg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-1.5">
                <p className="text-xs text-dark-muted mb-1.5">{t("setup.smtpOptional")}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  <input
                    type="text"
                    value={data.smtp_host}
                    onChange={(e) => updateField("smtp_host", e.target.value)}
                    placeholder={t("setup.smtpHost")}
                    className="w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-dark-text text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    value={data.smtp_port}
                    onChange={(e) => updateField("smtp_port", parseInt(e.target.value) || 587)}
                    placeholder={t("setup.smtpPort")}
                    className="w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-dark-text text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={data.smtp_username}
                    onChange={(e) => updateField("smtp_username", e.target.value)}
                    placeholder={t("setup.smtpUsername")}
                    className="w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-dark-text text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="password"
                    value={data.smtp_password}
                    onChange={(e) => updateField("smtp_password", e.target.value)}
                    placeholder={t("setup.smtpPassword")}
                    className="w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-bg text-dark-text text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 py-2">
                <div className="bg-dark-bg rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-muted">NATS URL:</span>
                    <span className="font-mono text-dark-text">{data.nats_url}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-muted">Server Port:</span>
                    <span className="font-mono text-dark-text">{data.server_port}</span>
                  </div>
                  {data.smtp_host && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-muted">SMTP:</span>
                      <span className="font-mono text-dark-text">{data.smtp_host}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t(error)}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-lg border border-dark-border bg-dark-card text-dark-text hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {t("common.back")}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 text-sm font-medium transition-colors"
              >
                {t("common.next")}
              </button>
            ) : (
              <button
                onClick={finishSetup}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t("setup.finish")}
                  </>
                )}
              </button>
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
