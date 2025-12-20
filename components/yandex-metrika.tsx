"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

declare global {
  interface Window {
    ym: (id: number, method: string, ...args: any[]) => void
  }
}

// Necessario perché Next.js App Router non ricarica la pagina durante la navigazione
export function YandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevPathnameRef = useRef<string | null>(null)
  const prevSearchParamsRef = useRef<string | null>(null)

  useEffect(() => {
    // Build current URL
    let url = window.origin + pathname
    if (searchParams?.toString()) {
      url = url + `?${searchParams.toString()}`
    }

    const currentSearchParams = searchParams?.toString() || ""
    const prevPathname = prevPathnameRef.current
    const prevSearchParams = prevSearchParamsRef.current

    // Track only if route actually changed
    if (pathname !== prevPathname || currentSearchParams !== prevSearchParams) {
      const trackPageView = () => {
        if (typeof window !== "undefined" && window.ym) {
          window.ym(105859080, "hit", url)
          console.log("[v0] Yandex page view tracked:", url)
        }
      }

      // Se Yandex è già caricato, traccia immediatamente
      if (window.yandexMetrikaLoaded) {
        trackPageView()
      } else {
        // Altrimenti attendi un po' e riprova (per la prima visita dopo il consenso)
        setTimeout(trackPageView, 1000)
      }

      // Update previous values
      prevPathnameRef.current = pathname
      prevSearchParamsRef.current = currentSearchParams
    }
  }, [pathname, searchParams])

  return null
}
