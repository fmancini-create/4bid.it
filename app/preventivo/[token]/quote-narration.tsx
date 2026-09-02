"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Pause, Play, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  token: string
  lineId?: string | null
  compact?: boolean
  label?: string
  className?: string
}

export default function QuoteNarration({ token, lineId = null, compact = false, label, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  async function ensureAudio(): Promise<HTMLAudioElement | null> {
    if (audioRef.current) return audioRef.current
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/quotes/shared/${encodeURIComponent(token)}/narration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(payload.error || "Audio non disponibile")
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      const audio = new Audio(url)
      audio.preload = "auto"
      audio.addEventListener("ended", () => setPlaying(false))
      audio.addEventListener("pause", () => setPlaying(false))
      audio.addEventListener("play", () => setPlaying(true))
      audioRef.current = audio
      return audio
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio non disponibile")
      return null
    } finally {
      setLoading(false)
    }
  }

  async function toggle() {
    if (playing && audioRef.current) {
      audioRef.current.pause()
      return
    }
    const audio = await ensureAudio()
    if (!audio) return
    try {
      await audio.play()
    } catch {
      setError("Il browser ha bloccato la riproduzione. Premi di nuovo play.")
    }
  }

  if (compact) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/45 hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60"
          aria-label={playing ? "Metti in pausa la spiegazione" : "Ascolta la spiegazione del modulo"}
          title={error || undefined}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : playing ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {loading ? "Creo la spiegazione..." : playing ? "Pausa" : label || "Spiegami cos'è"}
        </button>
        {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background p-5 ${className || ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <div>
            <p className="font-bold">Vuoi che te lo racconti?</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Una breve presentazione vocale, creata su questo preventivo e sulle soluzioni che ti abbiamo proposto.</p>
          </div>
        </div>
        <Button type="button" onClick={toggle} disabled={loading} variant={playing ? "secondary" : "default"} className="shrink-0">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {loading ? "Creo il racconto..." : playing ? "Metti in pausa" : label || "Raccontami il preventivo"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
