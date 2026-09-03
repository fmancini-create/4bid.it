"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, Target } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import QuoteCommerceBuilder from "./quote-commerce-builder"

const MAX_AI_NOTES = 2000

function requestPath(input: RequestInfo | URL) {
  const raw = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

  try {
    return new URL(raw, window.location.origin).pathname
  } catch {
    return raw.split("?")[0]
  }
}

/**
 * Tiene le istruzioni AI separate dal preventivo visibile al cliente e le
 * aggiunge soltanto al payload di creazione. In questo modo il builder
 * commerciale resta la fonte unica per prezzi/voci, mentre questo campo
 * governa esclusivamente il comportamento degli assistenti AI.
 */
export default function QuoteCommerceAiWrapper() {
  const [aiNotes, setAiNotes] = useState("")
  const notesRef = useRef("")

  useEffect(() => {
    notesRef.current = aiNotes
  }, [aiNotes])

  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase()
      if (method !== "POST" || requestPath(input) !== "/api/quotes" || typeof init?.body !== "string") {
        return originalFetch(input, init)
      }

      try {
        const payload = JSON.parse(init.body) as Record<string, unknown>
        const note = notesRef.current.trim().slice(0, MAX_AI_NOTES)
        payload.ai_important_notes = note || null
        return originalFetch(input, { ...init, body: JSON.stringify(payload) })
      } catch {
        return originalFetch(input, init)
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return (
    <>
      <section className="mx-auto mb-6 max-w-7xl overflow-hidden rounded-2xl border-2 border-violet-300/70 bg-gradient-to-br from-violet-50 via-background to-amber-50 shadow-sm">
        <div className="border-b border-violet-200/70 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black">Note importanti per AI</h2>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-800">
                  Interno · non visibile al cliente
                </span>
              </div>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                Questo campo serve a istruire maggiormente la consulente AI e a portare il cliente dove desideri. Indica il tema da spingere, le obiezioni da presidiare, il messaggio da far emergere o la conclusione verso cui accompagnare la conversazione.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
            <Target className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Se valorizzato, diventa una <strong>priorità commerciale</strong> sia per l'assistente AI del preventivo tradizionale sia per l'avatar realtime. L'AI deve introdurre e riprendere il tema in modo naturale, senza rivelare al cliente l'esistenza di queste istruzioni e senza alterare prezzi, condizioni o fatti reali.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="quote-ai-important-notes" className="font-bold">Istruzioni e direzione commerciale</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{aiNotes.length}/{MAX_AI_NOTES}</span>
            </div>
            <Textarea
              id="quote-ai-important-notes"
              rows={5}
              maxLength={MAX_AI_NOTES}
              value={aiNotes}
              onChange={event => setAiNotes(event.target.value)}
              placeholder="Es. Spingi sul vantaggio della formula annuale e sul setup incluso. Se il cliente obietta sul prezzo, riporta la conversazione sul costo/beneficio e accompagnalo verso l'annuale. Evidenzia che questa condizione è stata costruita apposta per la sua struttura."
              className="bg-background"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Non è un testo da mostrare o leggere al cliente: è una regia interna per l'AI. Scrivilo come parleresti a un commerciale prima di una trattativa.
            </p>
          </div>
        </div>
      </section>

      <QuoteCommerceBuilder />
    </>
  )
}
