"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    yandexMetrikaLoaded?: boolean
  }
}

/**
 * Chiude il gap delle navigazioni client-side verso aree private.
 *
 * Il root layout evita di caricare analytics quando il documento nasce gia' su
 * una route privata. Se pero' il browser arriva da una pagina pubblica tramite
 * Next.js navigation, GA/GTM/Yandex/Vercel possono essere gia' caricati nel
 * documento corrente. Non esiste un modo affidabile per "disattivare" tutti i
 * tracker gia' inizializzati, soprattutto Yandex Webvisor: in quel caso la
 * soluzione sicura e' ricaricare la route privata come documento nuovo.
 */
const RELOAD_MARKER = "private-analytics-reload"

function hasPublicAnalyticsLoaded(): boolean {
  if (window.yandexMetrikaLoaded) return true

  return Array.from(document.scripts).some((script) => {
    const src = script.src || ""
    return (
      src.includes("googletagmanager.com/gtm.js") ||
      src.includes("googletagmanager.com/gtag/js") ||
      src.includes("mc.yandex.ru/metrika/tag.js") ||
      src.includes("/_vercel/insights/script") ||
      src.includes("vercel-scripts.com")
    )
  })
}

export function StopSessionReplay() {
  useEffect(() => {
    const analyticsActive = hasPublicAnalyticsLoaded()

    // Dopo il reload pulito della route privata i tracker non esistono piu'.
    // Rimuoviamo il marker cosi' una futura navigazione public -> private nella
    // stessa tab potra' essere nuovamente protetta.
    if (!analyticsActive) {
      sessionStorage.removeItem(RELOAD_MARKER)
      return
    }

    if (sessionStorage.getItem(RELOAD_MARKER)) return

    sessionStorage.setItem(RELOAD_MARKER, "1")
    window.location.reload()
  }, [])

  return null
}
