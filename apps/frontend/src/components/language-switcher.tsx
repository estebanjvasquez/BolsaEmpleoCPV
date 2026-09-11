"use client";

import { localeNames, supportedLocales, type SupportedLocale } from "@/lib/i18n";
import { useLanguage } from "./language-provider";

const languageCodes: Record<SupportedLocale, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
  it: "IT",
  "pt-BR": "PT",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <nav aria-label="Seleccionar idioma" className="flex items-center gap-1" title="Seleccionar idioma">
      {supportedLocales.map((value) => (
        <button key={value} type="button" onClick={() => setLocale(value)} aria-label={localeNames[value]} aria-pressed={locale === value} title={localeNames[value]} className={`grid h-7 min-w-7 place-items-center rounded px-1 font-label text-[10px] font-bold tracking-[0.04em] leading-none transition focus:outline-none focus:ring-2 focus:ring-[#d39736] focus:ring-offset-2 ${locale === value ? "bg-[#d39736] text-[#17212c] shadow-sm" : "text-[#344250] opacity-70 hover:bg-[#edf0f1] hover:opacity-100"}`}>
          <span aria-hidden="true">{languageCodes[value]}</span>
        </button>
      ))}
    </nav>
  );
}
