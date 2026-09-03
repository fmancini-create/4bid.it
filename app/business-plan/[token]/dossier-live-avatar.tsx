"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Mic, MicOff, PhoneOff, Sparkles, Volume2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const DAILY_SDK_URL = "https://unpkg.com/@daily-co/daily-js@0.92.2"

type DailyTrackInfo = {
  persistentTrack?: MediaStreamTrack | null
  track?: MediaStreamTrack | null
}

type DailyParticipant = {
  local?: boolean
  tracks?: {
    video?: DailyTrackInfo
    audio?: DailyTrackInfo
  }
}

type DailyEvent = { errorMsg?: string }

type DailyCall = {
  join(options: { url: string; token?: string }): Promise<unknown>
  leave(): Promise<unknown> | void
  destroy(): Promise<unknown> | void
  on(event: string, handler: (event: DailyEvent) => void): DailyCall
  participants(): Record<string, DailyParticipant>
  setLocalAudio(enabled: boolean): Promise<unknown> | void
}

type DailyGlobal = {
  createCallObject(options?: Record<string, unknown>): DailyCall
}

declare global {
  interface Window {
    Daily?: DailyGlobal
  }
}

type LiveSession = {
  conversationId: string
  conversationUrl: string
  meetingToken?: string | null
}

let dailySdkPromise: Promise<void> | null = null

function loadDailySdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser non disponibile"))
  if (window.Daily) return Promise.resolve()
  if (dailySdkPromise) return dailySdkPromise

  dailySdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-4bid-daily-sdk="true"]')
    const finish = () => (window.Daily ? resolve() : reject(new Error("SDK video non inizializzato")))

    if (existing) {
      if (window.Daily) return resolve()
      existing.addEventListener("load", finish, { once: true })
      existing.addEventListener("error", () => reject(new Error("SDK video non disponibile")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = DAILY_SDK_URL
    script.async = true
    script.crossOrigin = "anonymous"
    script.dataset.fourBidDailySdk = "true"
    script.addEventListener("load", finish, { once: true })
    script.addEventListener("error", () => reject(new Error("SDK video non disponibile")), { once: true })
    document.head.appendChild(script)
  }).catch((error) => {
    dailySdkPromise = null
    throw error
  })

  return dailySdkPromise
}

function participantTrack(participant: DailyParticipant | undefined, kind: "video" | "audio") {
  const info = participant?.tracks?.[kind]
  return info?.persistentTrack || info?.track || null
}

function friendlyStartError(status: number, message: string) {
  const normalized = message.toLowerCase()
  if (status === 401) return "Accedi prima al dossier per avviare la presentazione live."
  if (status === 429 || /quota|credit|concurr|limit|busy|occupat/.test(normalized)) {
    return "La consulente digitale è momentaneamente impegnata. Riprova tra qualche minuto."
  }
  if (status === 503) return "La consulente digitale non è disponibile in questo momento."
  return message || "Non riesco ad avviare la presentazione live in questo momento."
}

export default function DossierLiveAvatar({ token }: { token: string }) {
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [status, setStatus] = useState<"idle" | "starting" | "connecting" | "joined" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [needsAudioActivation, setNeedsAudioActivation] = useState(false)

  const callRef = useRef<DailyCall | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  const track = async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      await fetch(`/api/business-plan/shared/${encodeURIComponent(token)}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, metadata }),
      })
    } catch {
      // Il tracking non deve mai bloccare la call.
    }
  }

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0

    const probe = async () => {
      attempts += 1
      try {
        const response = await fetch(`/api/business-plan/shared/${encodeURIComponent(token)}/live-avatar`, { cache: "no-store" })
        const data = await response.json().catch(() => ({}))
        if (cancelled) return

        if (response.ok) {
          setEnabled(Boolean(data.enabled))
          setChecking(false)
          return
        }

        // Prima del login il cookie HttpOnly non esiste ancora. Continuiamo a
        // controllare senza mostrare nulla; appena il login riesce la CTA appare.
        if (response.status === 401 && attempts < 90) {
          timer = setTimeout(probe, 2000)
          return
        }

        setEnabled(false)
        setChecking(false)
      } catch {
        if (!cancelled && attempts < 30) timer = setTimeout(probe, 3000)
        else if (!cancelled) setChecking(false)
      }
    }

    void probe()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [token])

  const syncRemoteMedia = () => {
    const call = callRef.current
    if (!call) return
    const participants = Object.values(call.participants())
    const remote = participants.find((participant) => !participant.local && participantTrack(participant, "video"))
      || participants.find((participant) => !participant.local)
    const videoTrack = participantTrack(remote, "video")
    const audioTrack = participantTrack(remote, "audio")

    setHasRemoteVideo(Boolean(videoTrack))
    if (remoteVideoRef.current) {
      if (videoTrack) {
        const current = remoteVideoRef.current.srcObject
        if (!(current instanceof MediaStream) || !current.getTracks().some((track) => track.id === videoTrack.id)) {
          remoteVideoRef.current.srcObject = new MediaStream([videoTrack])
        }
        void remoteVideoRef.current.play().catch(() => undefined)
      } else {
        remoteVideoRef.current.srcObject = null
      }
    }

    if (remoteAudioRef.current && audioTrack) {
      const current = remoteAudioRef.current.srcObject
      if (!(current instanceof MediaStream) || !current.getTracks().some((track) => track.id === audioTrack.id)) {
        remoteAudioRef.current.srcObject = new MediaStream([audioTrack])
      }
      remoteAudioRef.current.muted = false
      remoteAudioRef.current.volume = 1
      void remoteAudioRef.current.play()
        .then(() => setNeedsAudioActivation(false))
        .catch(() => setNeedsAudioActivation(true))
    }
  }

  useEffect(() => {
    if (!session) return
    let cancelled = false
    let call: DailyCall | null = null

    const connect = async () => {
      setStatus("connecting")
      setError(null)
      setHasRemoteVideo(false)
      setNeedsAudioActivation(false)

      try {
        await loadDailySdk()
        if (cancelled || !window.Daily) return

        call = window.Daily.createCallObject({
          startVideoOff: true,
          startAudioOff: false,
          subscribeToTracksAutomatically: true,
        })
        callRef.current = call

        call
          .on("joined-meeting", () => {
            if (cancelled) return
            setStatus("joined")
            void Promise.resolve(call?.setLocalAudio(true)).catch(() => undefined)
            syncRemoteMedia()
            void track("avatar_connected", { mode: "realtime_video" })
          })
          .on("participant-joined", syncRemoteMedia)
          .on("participant-updated", syncRemoteMedia)
          .on("track-started", syncRemoteMedia)
          .on("track-stopped", syncRemoteMedia)
          .on("error", (event) => {
            if (cancelled) return
            setError(event?.errorMsg || "Il collegamento video non è riuscito.")
            setStatus("error")
          })

        await call.join({
          url: session.conversationUrl,
          ...(session.meetingToken ? { token: session.meetingToken } : {}),
        })
        syncRemoteMedia()
      } catch (connectionError) {
        if (!cancelled) {
          setError(connectionError instanceof Error ? connectionError.message : "Il collegamento video non è riuscito.")
          setStatus("error")
        }
      }
    }

    void connect()

    return () => {
      cancelled = true
      const activeCall = call || callRef.current
      if (activeCall) {
        if (callRef.current === activeCall) callRef.current = null
        void Promise.resolve(activeCall.leave()).catch(() => undefined)
        void Promise.resolve(activeCall.destroy()).catch(() => undefined)
      }
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause()
        remoteAudioRef.current.srcObject = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const start = async () => {
    if (status === "starting") return
    setStatus("starting")
    setError(null)
    setMicOn(true)

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microfono non disponibile in questo browser.")
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      permissionStream.getTracks().forEach((track) => track.stop())

      const response = await fetch(`/api/business-plan/shared/${encodeURIComponent(token)}/live-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json().catch(() => ({}))
      const conversationId = String(data?.conversationId || "")
      const conversationUrl = String(data?.conversationUrl || "")

      if (!response.ok || !conversationId || !conversationUrl) {
        throw new Error(friendlyStartError(response.status, String(data?.error || "")))
      }

      setSession({
        conversationId,
        conversationUrl,
        meetingToken: data?.meetingToken ? String(data.meetingToken) : null,
      })
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : "Non riesco ad avviare la consulente digitale."
      setError(
        /permission|notallowed|denied|microfono|microphone/i.test(message)
          ? "Per parlare con la consulente serve il microfono. Consenti l'accesso dal browser e riprova."
          : message,
      )
      setStatus("error")
      setSession(null)
    }
  }

  const activateAudio = async () => {
    syncRemoteMedia()
    const audio = remoteAudioRef.current
    if (!audio?.srcObject) return setNeedsAudioActivation(true)
    try {
      audio.muted = false
      audio.volume = 1
      await audio.play()
      setNeedsAudioActivation(false)
    } catch {
      setNeedsAudioActivation(true)
    }
  }

  const toggleMic = async () => {
    const call = callRef.current
    if (!call) return
    const next = !micOn
    try {
      await Promise.resolve(call.setLocalAudio(next))
      setMicOn(next)
    } catch {
      setError("Non riesco a modificare il microfono. Controlla i permessi del browser.")
    }
  }

  const leaveCall = async () => {
    const call = callRef.current
    callRef.current = null
    if (call) {
      try { await Promise.resolve(call.leave()) } catch {}
      try { await Promise.resolve(call.destroy()) } catch {}
    }
    remoteAudioRef.current?.pause()
    setSession(null)
    setStatus("idle")
    setError(null)
    setHasRemoteVideo(false)
    void track("avatar_ended", { mode: "realtime_video" })
  }

  if (checking || !enabled) return null

  if (status === "starting") {
    return (
      <div className="fixed bottom-5 left-5 z-[80] rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-amber-400" /><span className="text-sm">Avvio consulente digitale…</span></div>
      </div>
    )
  }

  if (status === "error" && !session) {
    return (
      <div className="fixed bottom-5 left-5 z-[80] max-w-sm rounded-2xl border border-red-500/20 bg-slate-950 p-4 text-white shadow-2xl">
        <p className="text-sm font-semibold">Presentazione live non avviata</p>
        <p className="mt-1 text-xs text-slate-300">{error || "Riprova tra poco."}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => void start()} className="bg-amber-400 text-slate-950 hover:bg-amber-300">Riprova</Button>
          <Button size="sm" variant="ghost" onClick={() => { setStatus("idle"); setError(null) }} className="text-white hover:bg-white/10 hover:text-white">Chiudi</Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="fixed bottom-5 left-5 z-[70] max-w-[calc(100vw-2.5rem)]">
        <Button
          onClick={() => void start()}
          className="h-auto rounded-full bg-slate-950 px-5 py-3 text-white shadow-2xl ring-1 ring-white/10 hover:bg-slate-800"
        >
          <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950"><Sparkles className="h-5 w-5" /></span>
          <span className="text-left">
            <span className="block text-sm font-semibold">Presentazione AI live</span>
            <span className="block text-[11px] font-normal text-slate-300">Avatar realtime · puoi fare domande</span>
          </span>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 p-0 backdrop-blur-sm sm:p-5">
      <div className="relative mx-auto h-full max-w-6xl overflow-hidden bg-slate-950 shadow-2xl sm:rounded-3xl sm:border sm:border-white/10">
        <video ref={remoteVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" aria-label="Consulente digitale 4BID" />
        <audio ref={remoteAudioRef} autoPlay className="hidden" aria-hidden="true" />

        {!hasRemoteVideo && status !== "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 text-center text-white">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15"><Loader2 className="h-10 w-10 animate-spin text-amber-300" /></div>
            <div><p className="text-lg font-semibold">Sto collegando la consulente…</p><p className="mt-1 text-sm text-slate-400">La presentazione parte appena l'avatar è pronto.</p></div>
          </div>
        ) : null}

        <div className="absolute left-4 top-4 z-30 rounded-full bg-black/45 px-4 py-2 text-white backdrop-blur">
          <p className="text-xs font-black tracking-[0.16em]">4BID</p>
          <p className="text-[10px] text-white/70">Dossier banca & investitori</p>
        </div>

        <Button variant="ghost" size="icon" onClick={() => void leaveCall()} className="absolute right-4 top-4 z-40 rounded-full bg-black/45 text-white hover:bg-black/70 hover:text-white" aria-label="Chiudi presentazione live"><X className="h-5 w-5" /></Button>

        {needsAudioActivation ? (
          <div className="absolute inset-x-4 top-1/2 z-50 flex -translate-y-1/2 justify-center">
            <div className="rounded-2xl border border-amber-300/30 bg-slate-950/95 p-5 text-center text-white shadow-2xl backdrop-blur">
              <Volume2 className="mx-auto h-6 w-6 text-amber-300" />
              <p className="mt-2 text-sm font-semibold">Il browser ha bloccato l'audio</p>
              <Button onClick={() => void activateAudio()} className="mt-3 bg-amber-400 text-slate-950 hover:bg-amber-300"><Volume2 className="mr-2 h-4 w-4" /> Attiva audio</Button>
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-center text-white">
            <div className="max-w-md"><p className="text-xl font-semibold">Collegamento non riuscito</p><p className="mt-2 text-sm text-slate-300">{error || "Riprova tra poco."}</p><Button onClick={() => void leaveCall()} className="mt-5 bg-amber-400 text-slate-950 hover:bg-amber-300">Chiudi</Button></div>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-5 pt-20 text-white sm:px-8 sm:pb-7">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
            <p className="text-center text-sm text-white/80">Interrompi pure l'avatar e fai domande in qualsiasi momento.</p>
            <div className="flex items-center gap-3">
              <Button size="icon" onClick={() => void toggleMic()} className={`h-12 w-12 rounded-full ${micOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-red-500 text-white hover:bg-red-400"}`} aria-label={micOn ? "Disattiva microfono" : "Attiva microfono"}>{micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</Button>
              <Button size="icon" onClick={() => void leaveCall()} className="h-12 w-12 rounded-full bg-red-600 text-white hover:bg-red-500" aria-label="Termina presentazione"><PhoneOff className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
