export const LOCALES = ["it", "en", "de", "fr", "es"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "it"

export const LOCALE_LABELS: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
}

// Short codes shown in the compact switcher
export const LOCALE_SHORT: Record<Locale, string> = {
  it: "IT",
  en: "EN",
  de: "DE",
  fr: "FR",
  es: "ES",
}

export const STORAGE_KEY = "ecomobility_locale"

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

// Normalize a browser language tag (e.g. "en-US", "de-CH") to a supported locale
export function normalizeBrowserLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE
  const base = input.toLowerCase().split("-")[0]
  return isLocale(base) ? base : DEFAULT_LOCALE
}
