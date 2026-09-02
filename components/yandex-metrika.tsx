"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { isPrivateArea } from "@/lib/is-private-area"

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: any[]) => void
    initYandexMetrika?: () => void
    yandexMetrikaLoaded?: boolean
    yandexMetrikaLoading?: boolean
  }
}

// Next.js App Router non ricarica la pagina durante la navigazione: l'hit
// iniziale lo invia Metrika con init(), mentre qui tracciamo solo i cambi rotta.
export function YandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevPathnameRef = useRef<string | null>(null)
  const prevSearchParamsRef = useRef<string | null>(null)

  useEffect(() => {
    const currentSearchParams = searchParams?.toString() || ""

    // Le aree riservate non vengono tracciate: i path conterrebbero slug di
    // progetto e nomi di documenti riservati.
    if (isPrivateArea(pathname)) {
      prevPathnameRef.current = pathname
      prevSearchParamsRef.current = currentSearchParams
      return
    }

    // Se si arriva sul sito pubblico tramite navigazione client-side da una
    // pagina privata, il loader nel <head> esiste ma non era stato avviato.
    if (!window.yandexMetrikaLoaded && typeof window.initYandexMetrika === "function") {
      window.initYandexMetrika()
    }

    // L'hit iniziale viene gia' inviato da ym(..., "init", ...). Evitiamo un
    // secondo pageview della stessa pagina e usiamo questo componente solo per
    // le navigazioni SPA successive.
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname
      prevSearchParamsRef.current = currentSearchParams
      return
    }

    const prevPathname = prevPathnameRef.current
    const prevSearchParams = prevSearchParamsRef.current

    if (pathname !== prevPathname || currentSearchParams !== prevSearchParams) {
      let url = window.origin + pathname
      if (currentSearchParams) {
        url += `?${currentSearchParams}`
      }

      // ym() e' una coda ufficiale: se tag.js non ha ancora finito di caricare,
      // l'hit resta in attesa e viene consegnato appena lo script e' disponibile.
      if (typeof window.ym === "function") {
        window.ym(105859080, "hit", url)
        console.info("[4BID] Yandex SPA pageview queued:", url)
      }

      prevPathnameRef.current = pathname
      prevSearchParamsRef.current = currentSearchParams
    }
  }, [pathname, searchParams])

  return null
}
