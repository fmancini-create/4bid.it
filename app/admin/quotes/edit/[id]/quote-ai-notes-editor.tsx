"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Sparkles, Target } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SalesChannelQuote } from "@/lib/quotes/types"

const MAX_AI_NOTES = 2000

export default function QuoteAiNotesEditor({ quoteId }: { quoteId: string }) {
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/quotes/${quoteId}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({})) as Partial<SalesChannelQuote> & { error?: string }
        if (!response.ok) throw new Error(data.error || "Preventivo non trovato")
        if (!cancelled) setNotes(data.ai_important_notes || "")
      })
      .catch(error => {
        if (!cancelled) toast.error(error.message || "Impossibile caricare le istruzioni AI")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [quoteId])

  async function save() {
    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ai_important_notes: notes.trim() || null }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Salvataggio istruzioni AI fallito")
      setNotes(String(data.ai_important_notes || ""))
      toast.success("Istruzioni AI aggiornate")
    } catch (error: any) {
      toast.error(error.message || "Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl overflow-hidden rounded-2xl border-2 border-violet-300/70 bg-gradient-to-br from-violet-50 via-background to-amber-50 shadow-sm">
      <div className="border-b border-violet-200/70 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black">Note importanti per AI</h2>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-800">
                  Interno · non visibile al cliente
                </span>
              </div>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                Usa questo campo per istruire maggiormente l'AI e portare il cliente dove desideri: tema da enfatizzare, obiezioni da presidiare, messaggio da far emergere e direzione commerciale da seguire.
              </p>
            </div>
          </div>
          <Button onClick={save} disabled={loading || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Salvataggio…" : "Salva istruzioni AI"}
          </Button>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          <Target className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Se compilato, questo contenuto diventa una <strong>priorità commerciale</strong> per l'assistente AI tradizionale, la narrazione e l'avatar realtime. L'AI deve spingere il tema in modo naturale e riprenderlo nelle obiezioni e nella chiusura, senza mai dire al cliente che esiste questa nota interna.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="edit-quote-ai-important-notes" className="font-bold">Istruzioni e direzione commerciale</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{notes.length}/{MAX_AI_NOTES}</span>
          </div>
          <Textarea
            id="edit-quote-ai-important-notes"
            rows={5}
            maxLength={MAX_AI_NOTES}
            disabled={loading}
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Es. Spingi sul vantaggio della formula annuale e sul setup incluso. Se il cliente obietta sul prezzo, riporta la conversazione sul costo/beneficio e accompagnalo verso l'annuale."
            className="bg-background"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Scrivilo come una briefing note a un commerciale senior. Non modifica il contratto, i prezzi o le condizioni del preventivo.
          </p>
        </div>
      </div>
    </section>
  )
}
