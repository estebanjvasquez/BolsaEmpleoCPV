"use client";

import { localeNames, supportedLocales, type SupportedLocale } from "@/lib/i18n";
import { useLanguage } from "./language-provider";

const flags: Record<SupportedLocale, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  it: "🇮🇹",
  "pt-BR": "🇧🇷",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <nav aria-label="Seleccionar idioma" className="flex items-center gap-1" title="Seleccionar idioma">
      {supportedLocales.map((value) => (
        <button key={value} type="button" onClick={() => setLocale(value)} aria-label={localeNames[value]} aria-pressed={locale === value} title={localeNames[value]} className={`grid h-7 w-7 place-items-center rounded text-base leading-none transition focus:outline-none focus:ring-2 focus:ring-[#d39736] focus:ring-offset-2 ${locale === value ? "bg-[#17212c] shadow-sm" : "opacity-55 hover:bg-[#edf0f1] hover:opacity-100"}`}>
          <span aria-hidden="true">{flags[value]}</span>
        </button>
      ))}
    </nav>
  );
}
