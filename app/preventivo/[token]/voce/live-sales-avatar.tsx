"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Mic, Sparkles, Video, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LiveSalesAvatar({ token }: { token: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const frameRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/quotes/shared/${encodeURIComponent(token)}/live-avatar`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setEnabled(Boolean(data.enabled)) })
      .catch(() => { if (!cancelled) setEnabled(false) })
    return () => { cancelled = true }
  }, [token])

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/quotes/shared/${encodeURIComponent(token)}/live-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.joinUrl) throw new Error(data.error || "Impossibile avviare la consulente live")
      setJoinUrl(data.joinUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossibile avviare la consulente live")
    } finally {
      setLoading(false)
    }
  }

  if (enabled === false) return null

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-background shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-violet-50 via-background to-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black tracking-tight">Consulente 4BID Live</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Real time</span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Una videochiamata con la consulente AI 4BID: ascolta, risponde, può essere interrotta e ragiona sul tuo preventivo in tempo reale.</p>
        </div>
        {!joinUrl ? <Button type="button" onClick={() => void start()} disabled={loading || enabled === null} className="shrink-0 rounded-xl">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
          {loading ? "Avvio in corso..." : "Parla con la consulente"}
        </Button> : null}
      </div>

      {!joinUrl ? (
        <div className="grid gap-4 p-5 md:grid-cols-[1.35fr_.65fr]">
          <div className="relative min-h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 p-6 text-white">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_20%,rgba(255,255,255,.35),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(139,92,246,.6),transparent_30%)]" />
            <div className="relative flex h-full min-h-52 flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200"><Sparkles className="h-4 w-4" /> Video sales advisor</div>
              <div>
                <p className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">Non guardi un video. Entri in conversazione.</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200">La sessione viene creata solo quando scegli di parlare: niente autoplay invasivo, niente consumo inutile, niente effetto “demo finta”.</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
            <div className="flex gap-3"><Mic className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-bold">Conversazione naturale</p><p className="text-sm text-muted-foreground">Parli normalmente e puoi interromperla mentre sta rispondendo.</p></div></div>
            <div className="flex gap-3"><Volume2 className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-bold">Voce + labiale live</p><p className="text-sm text-muted-foreground">Il volto viene generato in streaming insieme alla risposta, non riproduce clip preregistrate.</p></div></div>
            <div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-bold">Conosce questa offerta</p><p className="text-sm text-muted-foreground">Destinatario, moduli, optional, prezzi e logica commerciale restano legati al preventivo aperto.</p></div></div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 p-2 sm:p-3">
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              ref={frameRef}
              src={joinUrl}
              title="Consulente AI 4BID in tempo reale"
              allow="microphone; camera; autoplay; fullscreen; speaker-selection"
              className="h-full w-full border-0"
            />
          </div>
          <p className="px-2 pb-1 pt-2 text-center text-xs text-slate-300">Stai parlando con una consulente AI 4BID. Puoi interromperla e farle domande liberamente.</p>
        </div>
      )}

      {error ? <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-3 text-sm text-destructive">{error}. Puoi comunque usare la consulente vocale e la chat qui sotto.</div> : null}
    </section>
  )
}
