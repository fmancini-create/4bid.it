"use client"

import { useState } from "react"
import { Check, Clock3, ExternalLink, Loader2, Mic, PhoneOff, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEFAULT_OPENING_MESSAGE = "Buongiorno, sono la consulente digitale di 4BID. Ho già analizzato il suo preventivo e posso spiegarle in pochi secondi i punti più importanti. Vuole che inizi dai moduli consigliati?"

type LiveSession = {
  conversationId: string
  joinUrl: string
  openingMessage: string
}

type Status = "idle" | "starting" | "connecting" | "joined" | "ended" | "error"

function friendlyStartError(status: number, rawMessage: string) {
  const message = rawMessage.toLowerCase()
  if (status === 429 || /quota|credit|concurr|limit|busy|occupat/.test(message)) {
    return "La consulente è momentaneamente impegnata. Riprova tra qualche minuto."
  }
  if (status === 503) return "La consulente video non è disponibile in questo momento."
  return "Non riesco ad avviare la consulente in questo momento. Riprova tra poco."
}

export default function LiveSalesAvatar({ token }: { token: string; quotedProjects?: string[] }) {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setStatus("starting")
    setError(null)

    try {
      const response = await fetch(`/api/quotes/shared/${encodeURIComponent(token)}/live-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json().catch(() => ({}))
      const conversationId = String(data?.conversationId || "")
      const joinUrl = String(data?.joinUrl || data?.conversationUrl || "")

      if (!response.ok || !conversationId || !joinUrl) {
        throw new Error(friendlyStartError(response.status, String(data?.error || "")))
      }

      setSession({
        conversationId,
        joinUrl,
        openingMessage: String(data?.openingMessage || DEFAULT_OPENING_MESSAGE),
      })
      setStatus("connecting")
    } catch (startError) {
      setSession(null)
      setStatus("error")
      setError(startError instanceof Error ? startError.message : friendlyStartError(500, ""))
    }
  }

  const closeCall = () => {
    setSession(null)
    setStatus("ended")
  }

  const openDedicatedWindow = () => {
    if (!session?.joinUrl) return
    window.open(session.joinUrl, "_blank", "noopener,noreferrer")
  }

  if (session) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="relative h-[72svh] min-h-[520px] max-h-[820px] overflow-hidden bg-slate-950">
          <iframe
            key={session.conversationId}
            src={session.joinUrl}
            title="Consulente digitale 4BID"
            allow="microphone *; camera *; autoplay *; fullscreen *; display-capture *"
            allowFullScreen
            className="h-full w-full border-0 bg-slate-950"
            onLoad={() => setStatus("joined")}
          />

          <div className="pointer-events-none absolute left-4 top-4 z-30 sm:left-5 sm:top-5">
            <img src="/logo.png" alt="4BID" className="h-7 w-auto object-contain drop-shadow-lg sm:h-8" />
          </div>

          <div className="absolute right-4 top-4 z-40 flex gap-2 sm:right-5 sm:top-5">
            <button
              type="button"
              onClick={openDedicatedWindow}
              className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-slate-950/75 px-3 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-slate-900"
              title="Apri la consulente in una finestra dedicata"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Apri in finestra</span>
            </button>
            <button
              type="button"
              onClick={closeCall}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
              aria-label="Termina conversazione"
              title="Termina conversazione"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>

          {status === "connecting" ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-5 z-30 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-white shadow-xl backdrop-blur">
                <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                Collegamento audio e microfono…
              </div>
            </div>
          ) : null}

          {status === "joined" ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-5 z-30 flex justify-center">
              <div className="max-w-2xl rounded-2xl border border-white/10 bg-slate-950/78 px-4 py-3 text-center text-white shadow-xl backdrop-blur">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                  <Volume2 className="h-4 w-4 text-emerald-300" />
                  Conversazione live attiva
                </div>
                <p className="mt-1 text-xs text-slate-300">Se il browser lo chiede, consenti il microfono: la consulente gestisce direttamente audio, ascolto e risposte.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  if (status === "ended") {
    return (
      <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 text-center shadow-sm sm:p-8">
        <Sparkles className="mx-auto h-7 w-7 text-violet-600" />
        <h3 className="mt-3 text-xl font-bold">Grazie per la conversazione</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Puoi continuare a leggere il preventivo oppure riaprire la consulente quando vuoi.</p>
        <Button onClick={() => void start()} className="mt-5 bg-violet-600 text-white hover:bg-violet-700">Riapri la consulente</Button>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white shadow-xl">
      <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Consulente AI live
          </div>
          <h3 className="text-2xl font-black tracking-tight sm:text-3xl">Ti spiego questo preventivo in 60 secondi</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">La consulente digitale 4BID ha già letto la proposta. Puoi ascoltare il riepilogo, interromperla in qualsiasi momento e farle domande come in una normale conversazione.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" /> Personalizzata</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Clock3 className="h-3.5 w-3.5 text-violet-300" /> Circa 60 secondi</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Mic className="h-3.5 w-3.5 text-violet-300" /> Conversazione reale</span>
          </div>
          {error ? <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-200">Ha già analizzato la proposta</p>
            <p className="mt-2 text-sm leading-relaxed text-white">“Vuole che le mostri subito quali moduli le convengono davvero e perché?”</p>
          </div>
          <div className="mt-3 flex items-start gap-3 text-sm text-slate-300">
            <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <span>Audio e microfono vengono gestiti direttamente dalla piattaforma video, senza il vecchio ponte audio del browser.</span>
          </div>
          <Button onClick={() => void start()} disabled={status === "starting"} className="mt-4 h-12 w-full bg-violet-500 font-bold text-white hover:bg-violet-400">
            {status === "starting" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparazione consulente…</> : "Fatti spiegare il preventivo in 60 secondi"}
          </Button>
        </div>
      </div>
    </section>
  )
}
