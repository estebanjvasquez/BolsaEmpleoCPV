"use client";

import { localeNames, supportedLocales, type SupportedLocale } from "@/lib/i18n";
import { useLanguage } from "./language-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return <label className="sr-only">Idioma<select aria-label="Idioma" value={locale} onChange={(event) => setLocale(event.target.value as SupportedLocale)} className="not-sr-only rounded border border-[#aeb6bd] bg-white px-2 py-1.5 font-label text-[11px] text-[#344250] focus:border-[#8b5d17] focus:outline-none">{supportedLocales.map((value) => <option key={value} value={value}>{localeNames[value]}</option>)}</select></label>;
}
