"use client";

import { useEffect, useState } from "react";

type Locale = "vi" | "en";

const LOCALE_KEY = "woo_locale";

export default function LanguageToggle() {
  const [locale, setLocale] = useState<Locale>("vi");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "vi" || stored === "en") {
      setLocale(stored);
    }
  }, []);

  function handleChange(nextLocale: Locale) {
    setLocale(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_KEY, nextLocale);
      window.dispatchEvent(
        new CustomEvent("woo-locale-change", {
          detail: { locale: nextLocale },
        }),
      );
    }
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[rgba(20,30,70,0.45)] p-1 backdrop-blur-md shadow-[0_8px_24px_rgba(4,10,30,0.35)]">
      <button
        type="button"
        onClick={() => handleChange("vi")}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
          locale === "vi"
            ? "bg-[#F4C542] text-[#1B1B1B] shadow-[0_0_16px_rgba(244,197,66,0.22)]"
            : "bg-white/5 text-white/85 hover:bg-white/10 hover:text-white"
        }`}
        aria-label="Chuyển sang tiếng Việt"
        aria-pressed={locale === "vi"}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleChange("en")}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
          locale === "en"
            ? "bg-[#F4C542] text-[#1B1B1B] shadow-[0_0_16px_rgba(244,197,66,0.22)]"
            : "bg-white/5 text-white/85 hover:bg-white/10 hover:text-white"
        }`}
        aria-label="Switch to English"
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
