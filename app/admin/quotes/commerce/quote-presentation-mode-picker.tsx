"use client"

import { useState } from "react"
import { Bot, FileText, Sparkles } from "lucide-react"

type Mode = "classic" | "virtual"

function persistMode(mode: Mode) {
  document.cookie = `quote_presentation_mode=${mode}; Path=/; SameSite=Lax; Max-Age=3600`
}

export default function QuotePresentationModePicker({ initialMode = "classic" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)

  function choose(next: Mode) {
    setMode(next)
    persistMode(next)
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Esperienza del preventivo</h2>
          <p className="text-sm text-muted-foreground">Scegli cosa vedrà il cliente quando aprirà il link pubblico. La scelta viene salvata sul singolo preventivo.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Tipo di presentazione preventivo">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "classic"}
          onClick={() => choose("classic")}
          className={`rounded-xl border-2 p-4 text-left transition ${mode === "classic" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"><FileText className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="font-bold">Classico</p>{mode === "classic" ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Selezionato</span> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">Il preventivo tradizionale completo con moduli, prezzi, opzioni, condizioni, accettazione e pagamento.</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "virtual"}
          onClick={() => choose("virtual")}
          className={`rounded-xl border-2 p-4 text-left transition ${mode === "virtual" ? "border-violet-500 bg-violet-50 shadow-sm" : "border-border hover:border-violet-300 hover:bg-violet-50/40"}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Bot className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="font-bold">Virtuale</p>{mode === "virtual" ? <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Selezionato</span> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">Apre con la consulente virtuale interattiva: il cliente può ascoltare, parlare o fare domande sul proprio preventivo, mantenendo sotto il flusso completo di accettazione e pagamento.</p>
            </div>
          </div>
        </button>
      </div>
    </section>
  )
}
