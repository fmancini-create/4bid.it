"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { isPrivateArea } from "@/lib/is-private-area"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const pathname = usePathname()
  const privateArea = isPrivateArea(pathname)

  useEffect(() => {
    // Nell'area riservata non viene impostato alcun cookie non essenziale
    // (analytics e chat sono disattivati), quindi il banner non ha nulla da
    // chiedere: mostrarlo prometterebbe un trattamento che non avviene.
    if (privateArea) {
      setShowBanner(false)
      return
    }
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [privateArea])

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")

    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
    })

    // La Metrika NON dipende piu' dal consenso: parte dal root layout al
    // caricamento della pagina, come Google Analytics. Questa chiamata non e'
    // quindi il percorso normale ed e' idempotente (guardia `yandexMetrikaLoaded`).
    //
    // Resta per un caso reale: lo script inline del layout gira una volta sola,
    // al caricamento. Chi arriva su una pagina dell'area riservata (dove la
    // Metrika e' volutamente spenta, perche' il webvisor registrerebbe il DOM dei
    // documenti dei clienti) e poi passa a una pagina pubblica con la navigazione
    // interna, senza questo richiamo non verrebbe conteggiato mai.
    if (typeof window !== "undefined" && window.initYandexMetrika && !isPrivateArea(pathname)) {
      window.initYandexMetrika()
    }

    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")

    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
    })

    console.log("[v0] Cookie consent declined - Analytics disabled")

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

declare global {
  interface Window {
    initYandexMetrika?: () => void
    yandexMetrikaLoaded?: boolean
    gtag?: (...args: any[]) => void
  }
}
