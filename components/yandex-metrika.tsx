"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

declare global {
  interface Window {
    ym: (id: number, method: string, ...args: any[]) => void
  }
}

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
      console.log("[v0] Yandex tracking page view:", url)

      // Send hit to Yandex Metrika
      if (typeof window !== "undefined" && window.ym) {
        window.ym(105859080, "hit", url)
        console.log("[v0] Yandex hit sent successfully")
      } else {
        console.warn("[v0] Yandex Metrika not loaded yet")
      }

      // Update previous values
      prevPathnameRef.current = pathname
      prevSearchParamsRef.current = currentSearchParams
    }
  }, [pathname, searchParams])

  return null
}
