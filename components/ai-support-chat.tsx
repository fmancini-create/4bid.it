"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isPrivateArea } from "@/lib/is-private-area"

interface AISupportChatProps {
  userEmail: string
  accountType: "free" | "pro" | "business"
}

const ANNA_PUBLIC_KEY = "wk_6467516bed164ec58ff5d8d1e776e5d6cac1"

/**
 * La chat pubblica di 4bid.it e' gestita da Anna nel tenant 4BID di
 * HotelAccelerator. La chiave pubblica identifica server-side tenant e sito di
 * provenienza: il browser non invia mai property_id.
 */
export default function AISupportChat(_props: AISupportChatProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname?.startsWith("/ecomobility") || isPrivateArea(pathname)) return
    if (document.querySelector('script[data-anna-4bid="4bid"]')) return

    const script = document.createElement("script")
    script.src = "https://hotelaccelerator.com/anna-chat.js"
    script.defer = true
    script.dataset.anna4bid = "4bid"
    script.dataset.publicKey = ANNA_PUBLIC_KEY
    script.dataset.product = "4BID"
    document.body.appendChild(script)

    return () => {
      script.remove()
      document.getElementById("anna-4bid-widget")?.remove()
      delete (window as Window & { __anna4bidLoaded?: boolean }).__anna4bidLoaded
    }
  }, [pathname])

  return null
}
