"use client"

import { useEffect, useState } from "react"
import { Bot, FileText, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

type PresentationMode = "classic" | "virtual"

type QuoteModeResponse = {
  presentation_mode?: PresentationMode | null
}

export default function QuotePresentationModeEditor({ quoteId }: { quoteId: string }) {
  const [mode, setMode] = useState<PresentationMode>("classic")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/quotes/${quoteId}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({})) as QuoteModeResponse & { error?: string }
        if (!response.ok) throw new Error(data.error || "Preventivo non trovato")
        setMode(data.presentation_mode === "virtual" ? "virtual" : "classic")
      })
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [quoteId])

  async function choose(next: PresentationMode) {
    if (saving || next === mode) return
    const previous = mode
    setMode(next)
    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presentation_mode: next }),
      })
      const data = await response.json().catch(() => ({})) as QuoteModeResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || "Aggiornamento non riuscito")
      setMode(data.presentation_mode === "virtual" ? "virtual" : "classic")
      toast.success(next === "virtual" ? "Preventivo impostato come Virtuale" : "Preventivo impostato come Classico")
    } catch (error: any) {
      setMode(previous)
      toast.error(error.message || "Errore nell'aggiornamento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl rounded-2xl border-2 border-violet-200 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          {saving || loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="text-lg font-bold">Esperienza del preventivo</h2>
          <p className="text-sm text-muted-foreground">Puoi cambiare anche un preventivo già creato senza modificarne il link, i prezzi o le condizioni commerciali.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Esperienza del preventivo">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "classic"}
          disabled={loading || saving}
          onClick={() => choose("classic")}
          className={`rounded-xl border-2 p-4 text-left transition disabled:opacity-60 ${mode === "classic" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"><FileText className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="font-bold">Classico</p>{mode === "classic" ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Attivo</span> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">Il cliente vede il preventivo tradizionale con moduli, prezzi, optional, condizioni, accettazione e pagamento.</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "virtual"}
          disabled={loading || saving}
          onClick={() => choose("virtual")}
          className={`rounded-xl border-2 p-4 text-left transition disabled:opacity-60 ${mode === "virtual" ? "border-violet-500 bg-violet-50 shadow-sm" : "border-border hover:border-violet-300 hover:bg-violet-50/40"}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Bot className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="font-bold">Virtuale</p>{mode === "virtual" ? <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Attivo</span> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">Il cliente apre la versione con consulente AI interattiva e mantiene sotto l'intero flusso del preventivo.</p>
            </div>
          </div>
        </button>
      </div>
    </section>
  )
}
