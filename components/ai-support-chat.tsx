"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isPrivateArea } from "@/lib/is-private-area"

interface AISupportChatProps {
  userEmail: string
  accountType: "free" | "pro" | "business"
}

const ANNA_PUBLIC_KEY = "wk_6467516bed164ec58ff5d8d1e776e5d6cac1"

function setChatVisibility(visible: boolean) {
  const display = visible ? "" : "none"

  document.querySelectorAll<HTMLElement>("[data-chat-widget]").forEach((widget) => {
    widget.style.display = display
  })

  const legacyWidget = document.getElementById("anna-4bid-widget")
  if (legacyWidget) legacyWidget.style.display = display
}

/**
 * La chat pubblica di 4bid.it e' gestita da Anna nel tenant 4BID di
 * HotelAccelerator. La chiave pubblica identifica server-side tenant e sito di
 * provenienza: il browser non invia mai property_id.
 *
 * IMPORTANTE: il widget non viene piu' smontato al cambio pathname. La root del
 * widget e la conversazione devono sopravvivere alla navigazione SPA, altrimenti
 * il visitatore vede una chat nuova ogni volta che cambia pagina.
 */
export default function AISupportChat(_props: AISupportChatProps) {
  const pathname = usePathname()

  useEffect(() => {
    const hidden = pathname?.startsWith("/ecomobility") || isPrivateArea(pathname)

    if (hidden) {
      setChatVisibility(false)
      return
    }

    setChatVisibility(true)

    // Lo script resta montato per tutta la vita del root layout. Non rimuoverlo
    // nel cleanup del pathname: il renderer condiviso mantiene la stessa
    // conversation_id e la stessa cronologia mentre l'utente naviga.
    if (document.querySelector('script[data-anna-4bid="4bid"]')) return

    const script = document.createElement("script")
    script.src = "https://hotelaccelerator.com/anna-chat.js"
    script.defer = true
    script.dataset.anna4bid = "4bid"
    script.dataset.publicKey = ANNA_PUBLIC_KEY
    script.dataset.product = "4BID"
    document.body.appendChild(script)
  }, [pathname])

  return null
}
