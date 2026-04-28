import en from "@/locales/en.json";
import az from "@/locales/az.json";
import ru from "@/locales/ru.json";

export type Locale = "en" | "az" | "ru";

const translations: Record<Locale, typeof en> = { en, az, ru };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  az: "AZ",
  ru: "RU",
};

export const DEFAULT_LOCALE: Locale = "en";

// Nested key access: t("site.name") → "Film Roulette"
export function getTranslations(locale: Locale) {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];

  function t(key: string, vars?: Record<string, string | number>): string {
    const keys = key.split(".");
    let value: any = dict;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback to English
        let fb: any = translations[DEFAULT_LOCALE];
        for (const fk of keys) fb = fb?.[fk];
        value = fb ?? key;
        break;
      }
    }
    if (typeof value !== "string") return key;
    if (vars) {
      return value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    }
    return value;
  }

  return t;
}
