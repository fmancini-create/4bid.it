"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react"
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
  const [micOn, setMicOn] = useState(false)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [needsAudioActivation, setNeedsAudioActivation] = useState(false)

  const callRef = useRef<DailyCall | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const autoStartedRef = useRef(false)
  const startWithMicRef = useRef(false)

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

  const syncRemoteMedia = () => {
    const call = callRef.current
    if (!call) return

    const participants = Object.values(call.participants())
    const remote =
      participants.find((participant) => !participant.local && participantTrack(participant, "video")) ||
      participants.find((participant) => !participant.local)
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
      void remoteAudioRef.current
        .play()
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
          startAudioOff: !startWithMicRef.current,
          subscribeToTracksAutomatically: true,
        })
        callRef.current = call

        call
          .on("joined-meeting", () => {
            if (cancelled) return
            setStatus("joined")
            if (startWithMicRef.current) {
              void Promise.resolve(call?.setLocalAudio(true)).catch(() => undefined)
            }
            syncRemoteMedia()
            void track("avatar_connected", {
              mode: "realtime_video",
              autoplay: !startWithMicRef.current,
            })
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

  const start = async (withMic = false) => {
    if (status === "starting" || status === "connecting" || status === "joined") return

    setStatus("starting")
    setError(null)
    setMicOn(withMic)
    startWithMicRef.current = withMic

    try {
      if (withMic) {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microfono non disponibile in questo browser.")
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        permissionStream.getTracks().forEach((track) => track.stop())
      }

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

  useEffect(() => {
    if (checking || !enabled || session || status !== "idle" || autoStartedRef.current) return
    autoStartedRef.current = true
    void start(false)
    // L'autoplay deve avvenire una sola volta appena il dossier autorizzato è pronto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, enabled, session, status])

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
      if (next) {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microfono non disponibile in questo browser.")
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        permissionStream.getTracks().forEach((track) => track.stop())
      }

      await Promise.resolve(call.setLocalAudio(next))
      setMicOn(next)
    } catch {
      setError("Non riesco ad attivare il microfono. Controlla i permessi del browser.")
    }
  }

  const retry = async () => {
    const call = callRef.current
    callRef.current = null
    if (call) {
      try {
        await Promise.resolve(call.leave())
      } catch {}
      try {
        await Promise.resolve(call.destroy())
      } catch {}
    }

    remoteAudioRef.current?.pause()
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null

    setSession(null)
    setHasRemoteVideo(false)
    setNeedsAudioActivation(false)
    setStatus("idle")
    setError(null)
    autoStartedRef.current = false
  }

  if (checking) {
    return (
      <section className="border-b border-amber-200/30 bg-slate-950 px-4 py-5">
        <div className="mx-auto flex h-[300px] max-w-7xl items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl sm:h-[340px] lg:h-[360px]">
          <Loader2 className="h-10 w-10 animate-spin text-amber-300" />
        </div>
      </section>
    )
  }

  if (!enabled) return null

  return (
    <section className="border-b border-amber-200/30 bg-slate-950 px-4 py-5">
      <div className="group relative mx-auto h-[300px] max-w-7xl overflow-hidden rounded-[28px] border border-amber-300/20 bg-black shadow-2xl sm:h-[340px] lg:h-[360px]">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover object-center"
          aria-label="Consulente digitale 4BID"
        />
        <audio ref={remoteAudioRef} autoPlay className="hidden" aria-hidden="true" />

        {(!session || !hasRemoteVideo) && status !== "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-amber-300" />
          </div>
        ) : null}

        {needsAudioActivation ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20">
            <Button
              onClick={() => void activateAudio()}
              className="h-12 rounded-full bg-black/70 px-5 text-white backdrop-blur hover:bg-black/80"
            >
              <Volume2 className="mr-2 h-5 w-5" />
              Attiva audio
            </Button>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/95 p-6 text-center text-white">
            <div className="max-w-md">
              <p className="text-sm text-slate-300">{error || "Collegamento non riuscito."}</p>
              <Button
                size="icon"
                onClick={() => void retry()}
                className="mt-4 h-11 w-11 rounded-full bg-amber-400 text-slate-950 hover:bg-amber-300"
                aria-label="Riprova avatar"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : null}

        {status === "joined" ? (
          <div className="absolute bottom-4 right-4 z-30 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              size="icon"
              onClick={() => void toggleMic()}
              className={`h-11 w-11 rounded-full shadow-xl backdrop-blur ${
                micOn ? "bg-white/20 text-white hover:bg-white/30" : "bg-black/55 text-white hover:bg-black/70"
              }`}
              aria-label={micOn ? "Disattiva microfono" : "Attiva microfono"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
