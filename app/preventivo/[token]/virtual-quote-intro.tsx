"use client"

import { useEffect, useState } from "react"
import { Bot, Sparkles } from "lucide-react"
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
      <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-background to-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Bot className="h-5 w-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">Preventivo virtuale 4BID</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white"><Sparkles className="h-3 w-3" /> Interattivo</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Puoi entrare in videochiamata con la consulente AI 4BID, farti raccontare la proposta oppure farle domande specifiche. Il preventivo completo con opzioni, condizioni, accettazione e pagamento resta disponibile subito sotto.</p>
          </div>
        </div>
      </section>

      {liveEnabled !== false ? <LiveSalesAvatar token={token} /> : null}
      {liveEnabled === false ? <InteractiveVideoAssistant token={token} clientName={clientName} /> : null}
      {liveEnabled === false ? <QuoteNarration token={token} label="Ascolta il tuo preventivo" /> : null}
    </div>
  )
}
