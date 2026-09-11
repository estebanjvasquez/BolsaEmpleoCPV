export const supportedLocales = ["es", "en", "fr", "it", "pt-BR"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const localeNames: Record<SupportedLocale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
};

export const LOCALE_STORAGE_KEY = "cpv_locale";

export function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value !== null && supportedLocales.includes(value as SupportedLocale);
}

export function readLocale(): SupportedLocale {
  if (typeof window === "undefined") return "es";
  const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(value) ? value : "es";
}
