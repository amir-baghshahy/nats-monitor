import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronUp } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supportedLanguages, type SupportedLanguage } from "../i18n";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  fa: "فارسی",
  fr: "Français",
  de: "Deutsch",
  tr: "Türkçe",
  ar: "العربية",
};

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = (
    supportedLanguages.includes(i18n.language as SupportedLanguage)
      ? i18n.language
      : "en"
  ) as SupportedLanguage;

  const handleChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    searchParams.set("lng", lang);
    setSearchParams(searchParams);
    setOpen(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-dark-border/60 bg-dark-bg/45 px-3 py-2 text-xs text-dark-muted hover:text-dark-text hover:border-dark-border transition-colors"
        aria-label={t("language.select")}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">{LANGUAGE_LABELS[currentLang]}</span>
        <ChevronUp
          className={`h-3 w-3 shrink-0 transition-transform duration-150 ${open ? "rotate-0" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-dark-border/70 bg-dark-card shadow-xl shadow-black/30 backdrop-blur-xl z-50 overflow-hidden">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleChange(lang)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                currentLang === lang
                  ? "bg-primary-600/20 text-primary-300"
                  : "text-dark-muted hover:bg-dark-bg/60 hover:text-dark-text"
              }`}
            >
              <span className="w-6 text-[10px] font-mono font-semibold text-dark-muted/60 shrink-0">
                {lang.toUpperCase()}
              </span>
              <span className="flex-1 text-left">{LANGUAGE_LABELS[lang]}</span>
              {currentLang === lang && <Check className="h-3 w-3 text-primary-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
