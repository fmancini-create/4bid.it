"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import InteractiveVideoAssistant from "./voce/interactive-video-assistant"
import LiveSalesAvatar from "./voce/live-sales-avatar"
import QuoteNarration from "./quote-narration"

export default function VirtualQuoteIntro({ token, clientName }: { token: string; clientName?: string | null }) {
  const [liveEnabled, setLiveEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/quotes/shared/${encodeURIComponent(token)}/live-avatar`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setLiveEnabled(Boolean(data.enabled))
      })
      .catch(() => {
        if (!cancelled) setLiveEnabled(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6 sm:px-6">
      <section className="rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 via-background to-blue-50 px-4 py-3 shadow-sm sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-bold">Questo non è solo un PDF: è un preventivo virtuale.</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Puoi leggerlo normalmente oppure fartelo spiegare dalla consulente digitale che conosce già questa proposta.</p>
          </div>
        </div>
      </section>

      {liveEnabled !== false ? <LiveSalesAvatar token={token} /> : null}
      {liveEnabled === false ? <InteractiveVideoAssistant token={token} clientName={clientName} /> : null}
      {liveEnabled === false ? <QuoteNarration token={token} label="Ascolta il tuo preventivo" /> : null}
    </div>
  )
}
