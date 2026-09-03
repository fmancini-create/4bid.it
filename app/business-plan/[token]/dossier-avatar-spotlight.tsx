"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

function findLiveLauncher() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    button.textContent?.includes("Presentazione AI live"),
  ) || null
}

export default function DossierAvatarSpotlight({ token }: { token: string }) {
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0

    const probe = async () => {
      attempts += 1
      try {
        const response = await fetch(`/api/business-plan/shared/${encodeURIComponent(token)}/live-avatar`, {
          cache: "no-store",
        })
        const data = await response.json().catch(() => ({}))
        if (cancelled) return

        if (response.ok) {
          setEnabled(Boolean(data.enabled))
          setChecking(false)
          return
        }

        if (response.status === 401 && attempts < 90) {
          timer = setTimeout(probe, 1500)
          return
        }

        setEnabled(false)
        setChecking(false)
      } catch {
        if (!cancelled && attempts < 30) timer = setTimeout(probe, 2500)
        else if (!cancelled) setChecking(false)
      }
    }

    void probe()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [token])

  const start = () => {
    setStarting(true)
    let attempts = 0

    const clickLauncher = () => {
      attempts += 1
      const launcher = findLiveLauncher()
      if (launcher) {
        launcher.click()
        window.setTimeout(() => setStarting(false), 600)
        return
      }
      if (attempts < 12) {
        window.setTimeout(clickLauncher, 150)
        return
      }
      setStarting(false)
    }

    clickLauncher()
  }

  if (checking || !enabled) return null

  return (
    <section className="border-b border-amber-200/60 bg-slate-950 px-4 py-5 text-white shadow-xl">
      <div className="mx-auto grid max-w-7xl gap-5 rounded-[28px] border border-amber-300/20 bg-[radial-gradient(circle_at_15%_10%,rgba(245,158,11,.24),transparent_34%),linear-gradient(135deg,#0f172a,#171717_60%,#111827)] p-5 shadow-2xl sm:p-7 md:grid-cols-[1.2fr_.8fr] md:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Avatar realtime attivo
          </div>
          <h2 className="max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">Parla direttamente con la consulente AI del dossier</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Conosce business plan, scenari, finanziamento, benchmark e portafoglio 4BID. Puoi interromperla e fare domande in tempo reale, esattamente come nei preventivi virtuali.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Video realtime</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Voce bidirezionale</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Q&A sul dossier</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-300/25">
              <Sparkles className="h-6 w-6 text-amber-200" />
            </div>
            <div>
              <p className="font-black">Consulente 4BID Live</p>
              <p className="text-xs text-slate-300">Parte qui, senza schermata Join.</p>
            </div>
          </div>

          <Button
            onClick={start}
            disabled={starting}
            className="mt-5 h-14 w-full rounded-2xl bg-amber-400 text-base font-black text-slate-950 shadow-lg hover:bg-amber-300"
          >
            {starting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sto aprendo l'avatar…</>
            ) : (
              <>Avvia presentazione con avatar <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
          <p className="mt-2 text-center text-[11px] text-slate-400">Il browser può chiedere il permesso per il microfono.</p>
        </div>
      </div>
    </section>
  )
}
