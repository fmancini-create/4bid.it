"use client"

import { useEffect, useState } from "react"

interface ClientProvidersProps {
  isProduction: boolean
}

export function ClientProviders({ isProduction }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Non renderizzare nulla fino a quando il client non e' montato
  if (!mounted || !isProduction) return null

  // Lazy-load production-only components after mount
  return <ProductionComponents />
}

function ProductionComponents() {
  const [components, setComponents] = useState<{
    ScrollToTop?: React.ComponentType
    EventPopup?: React.ComponentType
    YandexMetrika?: React.ComponentType
    CookieConsent?: React.ComponentType
    LandingPagePopup?: React.ComponentType
    AISupportChat?: React.ComponentType<{ userEmail: string; accountType: string }>
  }>({})

  useEffect(() => {
    // Load all production components lazily after mount
    Promise.allSettled([
      import("@/components/scroll-to-top").then(m => ({ ScrollToTop: m.ScrollToTop })),
      import("@/components/event-popup").then(m => ({ EventPopup: m.default })),
      import("@/components/yandex-metrika").then(m => ({ YandexMetrika: m.YandexMetrika })),
      import("@/components/cookie-consent").then(m => ({ CookieConsent: m.CookieConsent })),
      import("@/components/landing-page-popup").then(m => ({ LandingPagePopup: m.LandingPagePopup })),
      import("@/components/ai-support-chat").then(m => ({ AISupportChat: m.default })),
    ]).then(results => {
      const loaded: Record<string, React.ComponentType<any>> = {}
      for (const r of results) {
        if (r.status === "fulfilled") Object.assign(loaded, r.value)
      }
      setComponents(loaded)
    })
  }, [])

  const { ScrollToTop, EventPopup, YandexMetrika, CookieConsent, LandingPagePopup, AISupportChat } = components

  return (
    <>
      {ScrollToTop && <ScrollToTop />}
      {EventPopup && <EventPopup />}
      {YandexMetrika && <YandexMetrika />}
      {CookieConsent && <CookieConsent />}
      {LandingPagePopup && <LandingPagePopup />}
      {AISupportChat && <AISupportChat userEmail="" accountType="pro" />}
    </>
  )
}
