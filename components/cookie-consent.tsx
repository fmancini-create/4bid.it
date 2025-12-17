"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    } else if (consent === "accepted") {
      // If previously accepted, enable analytics
      enableAnalytics()
    }
  }, [])

  const enableAnalytics = () => {
    // Enable Google Analytics
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
    })

    if (typeof window.ym !== "undefined") {
      try {
        window.ym(105859080, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true,
          ecommerce: "dataLayer",
        })
        console.log("[v0] Yandex Metrika initialized successfully")
      } catch (error) {
        console.error("[v0] Yandex Metrika initialization error:", error)
      }
    } else {
      console.warn("[v0] Yandex Metrika function (ym) not available yet")
    }
  }

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    enableAnalytics()
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    // Deny analytics
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
    })

    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Questo sito utilizza i cookie</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per analizzare il traffico del
              sito. I cookie ci aiutano a personalizzare i contenuti e gli annunci, fornire funzionalità dei social
              media e analizzare il nostro traffico. Condividiamo anche informazioni sul tuo utilizzo del nostro sito
              con i nostri partner di social media, pubblicità e analisi.
            </p>
          </div>
          <div className="flex gap-3 items-center w-full sm:w-auto">
            <Button onClick={handleDecline} variant="outline" className="flex-1 sm:flex-none bg-transparent">
              Rifiuta
            </Button>
            <Button onClick={handleAccept} className="flex-1 sm:flex-none bg-[#6B9DBD] hover:bg-[#5a8aad]">
              Accetta
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
