"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  type Locale,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  isLocale,
  normalizeBrowserLocale,
} from "./config"
import { dictionaries } from "./dictionaries"

type TranslateVars = Record<string, string | number>

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, vars?: TranslateVars) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

// Resolve a dot-path (e.g. "booking.title") against a nested dictionary object.
function resolvePath(dict: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, dict)
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start from the default locale so server and first client render match (no hydration mismatch).
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // After mount, resolve the real locale from storage or the browser.
  useEffect(() => {
    let resolved: Locale = DEFAULT_LOCALE
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) {
        resolved = stored
      } else {
        resolved = normalizeBrowserLocale(navigator.language)
      }
    } catch {
      resolved = normalizeBrowserLocale(typeof navigator !== "undefined" ? navigator.language : null)
    }
    setLocaleState(resolved)
  }, [])

  // Keep <html lang> in sync for accessibility / SEO.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [])

  const t = useCallback(
    (path: string, vars?: TranslateVars): string => {
      const primary = resolvePath(dictionaries[locale], path)
      if (typeof primary === "string") return interpolate(primary, vars)
      // Fallback to Italian (source of truth), then to the raw path.
      const fallback = resolvePath(dictionaries[DEFAULT_LOCALE], path)
      if (typeof fallback === "string") return interpolate(fallback, vars)
      return path
    },
    [locale],
  )

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return ctx
}

// Convenience hook when only the translate function is needed.
export function useT() {
  return useLanguage().t
}
