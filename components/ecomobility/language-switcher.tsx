"use client"

import { useEffect, useRef, useState } from "react"
import { Globe, Check, ChevronDown } from "lucide-react"
import { useLanguage } from "@/lib/ecomobility/i18n/provider"
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT } from "@/lib/ecomobility/i18n/config"
import { cn } from "@/lib/utils"

interface Props {
  className?: string
  // Visual variant: "light" for dark backgrounds, "default" otherwise
  variant?: "default" | "light"
}

export function LanguageSwitcher({ className, variant = "default" }: Props) {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.selectLanguage")}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors",
          variant === "light"
            ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
            : "border-border bg-background text-foreground hover:bg-muted",
        )}
      >
        <Globe className="h-4 w-4" />
        <span>{LOCALE_SHORT[locale]}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("common.selectLanguage")}
          className="absolute right-0 z-50 mt-1 min-w-[160px] overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  l === locale ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{LOCALE_SHORT[l]}</span>
                  {LOCALE_LABELS[l]}
                </span>
                {l === locale && <Check className="h-4 w-4 text-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
