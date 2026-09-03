"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, CameraOff, Loader2, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const DAILY_SDK_URL = "https://unpkg.com/@daily-co/daily-js@0.92.2"
const INACTIVITY_TIMEOUT_MS = 15_000
const INACTIVITY_GOODBYE_FALLBACK_MS = 8_000
const INACTIVITY_GOODBYE = "Non la trattengo oltre. La ringrazio per il tempo che ci ha dedicato e le auguro una buona giornata."

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

type DailyEvent = {
  participant?: DailyParticipant
  data?: unknown
}

type DailyCall = {
  join(options: { url: string; token?: string }): Promise<unknown>
  leave(): Promise<unknown> | void
  destroy(): Promise<unknown> | void
  on(event: string, handler: (event: DailyEvent) => void): DailyCall
  participants(): Record<string, DailyParticipant>
  sendAppMessage(message: Record<string, unknown>, recipient?: string): void
  setLocalAudio(enabled: boolean): Promise<unknown> | void
  setLocalVideo(enabled: boolean): Promise<unknown> | void
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

type TavusAppMessage = {
  message_type?: string
  event_type?: string
  conversation_id?: string
  properties?: {
    role?: "pal" | "replica" | "user" | string
    interrupted?: boolean
    duration?: number | null
    [key: string]: unknown
  }
}

let dailySdkPromise: Promise<void> | null = null

function loadDailySdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser non disponibile"))
  if (window.Daily) return Promise.resolve()
  if (dailySdkPromise) return dailySdkPromise

  dailySdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-4bid-daily-sdk="true"]`)
    const finish = () => {
      if (window.Daily) resolve()
      else reject(new Error("SDK video non inizializzato"))
    }

    if (existing) {
      existing.addEventListener("load", finish, { once: true })
      existing.addEventListener("error", () => reject(new Error("SDK video non disponibile")), { once: true })
      if (window.Daily) resolve()
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

function attachVideoTrack(element: HTMLVideoElement | null, track: MediaStreamTrack | null) {
  if (!element) return
  if (!track) {
    if (element.srcObject) element.srcObject = null
    return
  }

  const current = element.srcObject
  if (current instanceof MediaStream && current.getTracks().some((item) => item.id === track.id)) return
  element.srcObject = new MediaStream([track])
  void element.play().catch(() => undefined)
}

function parseTavusAppMessage(data: unknown): TavusAppMessage | null {
  if (!data) return null
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data)
      return parsed && typeof parsed === "object" ? parsed as TavusAppMessage : null
    } catch {
      return null
    }
  }
  return typeof data === "object" ? data as TavusAppMessage : null
}

function speakingEvent(message: TavusAppMessage) {
  const eventType = message.event_type || ""
  const roleFromProperties = message.properties?.role
  if (eventType === "conversation.started_speaking") return { phase: "started" as const, role: roleFromProperties }
  if (eventType === "conversation.stopped_speaking") return { phase: "stopped" as const, role: roleFromProperties }
  if (eventType === "conversation.user.started_speaking") return { phase: "started" as const, role: "user" }
  if (eventType === "conversation.user.stopped_speaking") return { phase: "stopped" as const, role: "user" }
  if (eventType === "conversation.replica.started_speaking") return { phase: "started" as const, role: "replica" }
  if (eventType === "conversation.replica.stopped_speaking") return { phase: "stopped" as const, role: "replica" }
  return null
}

function friendlyStartError(status: number, rawMessage: string) {
  const message = rawMessage.toLowerCase()
  if (status === 429 || /quota|credit|concurr|limit|busy|occupat/.test(message)) {
    return "La consulente è momentaneamente impegnata. Riprova tra qualche minuto oppure continua con la chat del preventivo."
  }
  if (status === 503) return "La consulente video non è disponibile in questo momento. Puoi continuare subito con la chat del preventivo."
  return "Non riesco ad avviare la videochiamata in questo momento. Puoi riprovare oppure continuare con la chat del preventivo."
}

function friendlyConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  if (/permission|notallowed|denied|microphone|microfono/.test(message)) {
    return "Per parlare con la consulente serve l'accesso al microfono. Consenti il microfono dal browser e riprova il collegamento."
  }
  return "Il collegamento video non è riuscito. Puoi riprovare senza creare una nuova sessione."
}

export default function LiveSalesAvatar({ token }: { token: string; quotedProjects?: string[] }) {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [status, setStatus] = useState<"idle" | "starting" | "connecting" | "joined" | "ended" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(false)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [hasRemoteAudio, setHasRemoteAudio] = useState(false)
  const [needsAudioActivation, setNeedsAudioActivation] = useState(false)

  const callRef = useRef<DailyCall | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)

  const routeRemoteAudio = (track: MediaStreamTrack | null) => {
    setHasRemoteAudio(Boolean(track))
    const audio = remoteAudioRef.current
    if (!audio) return

    if (!track) {
      audio.pause()
      if (audio.srcObject) audio.srcObject = null
      setNeedsAudioActivation(false)
      return
    }

    const current = audio.srcObject
    if (!(current instanceof MediaStream) || !current.getTracks().some((item) => item.id === track.id)) {
      audio.srcObject = new MediaStream([track])
    }

    audio.muted = false
    audio.volume = 1
    void audio.play()
      .then(() => setNeedsAudioActivation(false))
      .catch(() => setNeedsAudioActivation(true))
  }

  const activateAudio = async () => {
    const call = callRef.current
    if (call) {
      const participants = Object.values(call.participants())
      const remote = participants.find((participant) => !participant.local && participantTrack(participant, "audio"))
        || participants.find((participant) => !participant.local)
      routeRemoteAudio(participantTrack(remote, "audio"))
    }

    const audio = remoteAudioRef.current
    if (!audio?.srcObject) {
      setNeedsAudioActivation(true)
      return
    }

    try {
      audio.muted = false
      audio.volume = 1
      await audio.play()
      setNeedsAudioActivation(false)
    } catch {
      setNeedsAudioActivation(true)
    }
  }

  useEffect(() => {
    if (!session) return

    let cancelled = false
    let call: DailyCall | null = null
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null
    let goodbyeFallbackTimer: ReturnType<typeof setTimeout> | null = null
    let closingForInactivity = false

    const clearInactivityTimer = () => {
      if (!inactivityTimer) return
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }

    const clearGoodbyeFallback = () => {
      if (!goodbyeFallbackTimer) return
      clearTimeout(goodbyeFallbackTimer)
      goodbyeFallbackTimer = null
    }

    const finishInactiveCall = async () => {
      clearInactivityTimer()
      clearGoodbyeFallback()
      if (!call) {
        if (!cancelled) setStatus("ended")
        return
      }
      const activeCall = call
      if (callRef.current === activeCall) callRef.current = null
      try {
        await Promise.resolve(activeCall.leave())
      } catch {
        // La room può essersi già chiusa mentre la consulente terminava il saluto.
      }
      try {
        await Promise.resolve(activeCall.destroy())
      } catch {
        // La UI deve comunque risultare chiusa anche se Daily ha già distrutto la call.
      }
      remoteAudioRef.current?.pause()
      if (!cancelled) setStatus("ended")
    }

    const sayGoodbyeAndClose = () => {
      if (!call || closingForInactivity || cancelled) return
      closingForInactivity = true
      clearInactivityTimer()

      try {
        call.sendAppMessage({
          message_type: "conversation",
          event_type: "conversation.echo",
          conversation_id: session.conversationId,
          properties: {
            modality: "text",
            text: INACTIVITY_GOODBYE,
            done: true,
          },
        }, "*")
      } catch {
        void finishInactiveCall()
        return
      }

      // Se per qualunque motivo non arriva l'evento di fine parlato, non lasciamo la sessione aperta.
      goodbyeFallbackTimer = setTimeout(() => {
        void finishInactiveCall()
      }, INACTIVITY_GOODBYE_FALLBACK_MS)
    }

    const armInactivityTimer = () => {
      if (closingForInactivity || cancelled) return
      clearInactivityTimer()
      inactivityTimer = setTimeout(sayGoodbyeAndClose, INACTIVITY_TIMEOUT_MS)
    }

    const handleAppMessage = (event: DailyEvent) => {
      const message = parseTavusAppMessage(event.data)
      if (!message || message.message_type !== "conversation") return
      const speaking = speakingEvent(message)
      if (!speaking) return

      if (speaking.phase === "started") {
        if (!closingForInactivity) clearInactivityTimer()
        return
      }

      if (speaking.role === "pal" || speaking.role === "replica") {
        if (closingForInactivity) {
          void finishInactiveCall()
        } else {
          // I 15 secondi iniziano solo quando la consulente ha finito di parlare.
          armInactivityTimer()
        }
      }
    }

    const syncTracks = () => {
      if (!call) return
      const participants = Object.values(call.participants())
      const remote = participants.find((participant) => !participant.local && participantTrack(participant, "video"))
        || participants.find((participant) => !participant.local)
      const local = participants.find((participant) => participant.local)
      const remoteVideoTrack = participantTrack(remote, "video")
      const remoteAudioTrack = participantTrack(remote, "audio")

      attachVideoTrack(remoteVideoRef.current, remoteVideoTrack)
      routeRemoteAudio(remoteAudioTrack)
      attachVideoTrack(localVideoRef.current, participantTrack(local, "video"))
      setHasRemoteVideo(Boolean(remoteVideoTrack))
    }

    const connect = async () => {
      setStatus("connecting")
      setError(null)
      setHasRemoteVideo(false)
      setHasRemoteAudio(false)
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
            syncTracks()
          })
          .on("participant-joined", syncTracks)
          .on("participant-updated", syncTracks)
          .on("track-started", syncTracks)
          .on("track-stopped", syncTracks)
          .on("app-message", handleAppMessage)
          .on("left-meeting", () => {
            clearInactivityTimer()
            clearGoodbyeFallback()
            if (!cancelled) setStatus("ended")
          })
          .on("error", (event) => {
            clearInactivityTimer()
            clearGoodbyeFallback()
            if (!cancelled) {
              setError(friendlyConnectionError(event))
              setStatus("error")
            }
          })

        await call.join({
          url: session.conversationUrl,
          ...(session.meetingToken ? { token: session.meetingToken } : {}),
        })
        syncTracks()
      } catch (connectionError) {
        clearInactivityTimer()
        clearGoodbyeFallback()
        if (!cancelled) {
          setError(friendlyConnectionError(connectionError))
          setStatus("error")
        }
      }
    }

    void connect()

    return () => {
      cancelled = true
      clearInactivityTimer()
      clearGoodbyeFallback()
      const activeCall = call || callRef.current
      if (activeCall) {
        if (callRef.current === activeCall) callRef.current = null
        void Promise.resolve(activeCall.leave()).catch(() => undefined)
        void Promise.resolve(activeCall.destroy()).catch(() => undefined)
      }
      attachVideoTrack(remoteVideoRef.current, null)
      routeRemoteAudio(null)
      attachVideoTrack(localVideoRef.current, null)
    }
  }, [session])

  const start = async () => {
    setStatus("starting")
    setError(null)
    setMicOn(true)
    setCameraOn(false)
    setHasRemoteAudio(false)
    setNeedsAudioActivation(false)

    try {
      const response = await fetch(`/api/quotes/shared/${encodeURIComponent(token)}/live-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json().catch(() => ({}))
      const conversationId = String(data?.conversationId || "")
      const conversationUrl = String(data?.conversationUrl || data?.joinUrl || "")
      if (!response.ok || !conversationId || !conversationUrl) {
        throw new Error(friendlyStartError(response.status, String(data?.error || "")))
      }

      setSession({
        conversationId,
        conversationUrl,
        meetingToken: data?.conversationUrl && data?.meetingToken ? String(data.meetingToken) : null,
      })
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : friendlyStartError(500, ""))
      setStatus("error")
      setSession(null)
    }
  }

  const retryConnection = () => {
    if (!session) {
      void start()
      return
    }
    setError(null)
    setStatus("connecting")
    setNeedsAudioActivation(false)
    setSession({ ...session })
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

  const toggleCamera = async () => {
    const call = callRef.current
    if (!call) return
    const next = !cameraOn
    try {
      await Promise.resolve(call.setLocalVideo(next))
      setCameraOn(next)
    } catch {
      setError("Non riesco ad attivare la videocamera. Controlla i permessi del browser.")
    }
  }

  const leaveCall = async () => {
    const call = callRef.current
    if (call) {
      try {
        await Promise.resolve(call.leave())
      } catch {
        // La room può essere già in chiusura; l'interfaccia deve comunque terminare pulita.
      }
    }
    remoteAudioRef.current?.pause()
    setStatus("ended")
  }

  if (session && (status === "connecting" || status === "joined" || status === "error")) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="relative h-[68svh] min-h-[430px] max-h-[760px] overflow-hidden bg-slate-950 sm:h-[min(72vh,720px)] sm:min-h-[520px]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label="Consulente digitale 4BID"
          />
          <audio ref={remoteAudioRef} autoPlay className="hidden" aria-hidden="true" />

          {!hasRemoteVideo && status !== "error" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950 text-center text-white">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                <Loader2 className="h-10 w-10 animate-spin text-violet-300" />
                <span className="absolute inset-0 animate-ping rounded-full border border-violet-400/30" />
              </div>
              <div>
                <p className="text-lg font-semibold">Sto collegando la consulente…</p>
                <p className="mt-1 text-sm text-slate-400">La conversazione parte automaticamente appena è pronta.</p>
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-lg bg-white/90 px-2 py-1.5 shadow-md backdrop-blur sm:left-5 sm:top-5">
            <img src="/logo.png" alt="4BID" className="h-6 w-auto object-contain sm:h-7" />
          </div>

          {cameraOn ? (
            <div className="absolute right-3 top-3 z-30 h-32 w-24 overflow-hidden rounded-2xl border border-white/25 bg-slate-900 shadow-xl sm:right-5 sm:top-5 sm:h-40 sm:w-28">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" aria-label="La tua videocamera" />
            </div>
          ) : <video ref={localVideoRef} autoPlay playsInline muted className="hidden" aria-hidden="true" />}

          {needsAudioActivation ? (
            <div className="absolute inset-x-4 top-1/2 z-50 flex -translate-y-1/2 justify-center">
              <div className="rounded-2xl border border-violet-300/30 bg-slate-950/92 p-4 text-center text-white shadow-2xl backdrop-blur">
                <Volume2 className="mx-auto h-6 w-6 text-violet-300" />
                <p className="mt-2 text-sm font-semibold">Il browser ha bloccato l'audio della consulente</p>
                <Button onClick={() => void activateAudio()} className="mt-3 bg-violet-500 text-white hover:bg-violet-400">
                  <Volume2 className="mr-2 h-4 w-4" /> Attiva audio
                </Button>
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-3 bottom-24 z-30 sm:inset-x-5">
            <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/72 px-4 py-3 text-white shadow-xl backdrop-blur-md">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
              <p className="min-w-0 flex-1 truncate text-xs text-slate-100 sm:text-sm">Consulente digitale 4BID · conversazione in tempo reale</p>
              {status === "joined" ? (
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${hasRemoteAudio ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
                  {hasRemoteAudio ? "Audio collegato" : "Audio in arrivo"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent px-4 pb-5 pt-9">
            <button
              type="button"
              onClick={() => void toggleMic()}
              aria-label={micOn ? "Disattiva microfono" : "Attiva microfono"}
              title={micOn ? "Disattiva microfono" : "Attiva microfono"}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20"
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => void toggleCamera()}
              aria-label={cameraOn ? "Disattiva videocamera" : "Attiva videocamera"}
              title={cameraOn ? "Disattiva videocamera" : "Attiva videocamera"}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20"
            >
              {cameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => void activateAudio()}
              aria-label="Riattiva audio consulente"
              title="Riattiva audio consulente"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void leaveCall()}
              aria-label="Termina conversazione"
              title="Termina conversazione"
              className="flex h-12 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>

          {status === "error" ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-6 text-center text-white backdrop-blur-sm">
              <div className="max-w-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/20">
                  <Volume2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Collegamento da completare</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{error}</p>
                <Button onClick={retryConnection} className="mt-5 bg-violet-600 text-white hover:bg-violet-500">Riprova collegamento</Button>
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
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Puoi aprire il preventivo completo qui sotto oppure riaprire la consulente se hai ancora una domanda importante.</p>
        <Button onClick={() => void start()} className="mt-5 bg-violet-600 text-white hover:bg-violet-700">Parla di nuovo con la consulente</Button>
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
          <h3 className="text-2xl font-black tracking-tight sm:text-3xl">Parla adesso con la consulente 4BID</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">Una conversazione vera, in tempo reale: chiedi chiarimenti, confronta le opzioni e approfondisci i moduli del tuo preventivo. Dopo il click il collegamento parte direttamente.</p>
          {error ? <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
        </div>
        <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center gap-3 text-sm text-slate-200"><Mic className="h-4 w-4 text-violet-300" /> Il browser chiederà solo i permessi necessari</div>
          <div className="flex items-center gap-3 text-sm text-slate-200"><Sparkles className="h-4 w-4 text-violet-300" /> Risposte costruite sul contenuto della proposta</div>
          <div className="flex items-center gap-3 text-sm text-slate-200"><Volume2 className="h-4 w-4 text-violet-300" /> La consulente si presenta appena si collega</div>
          <Button onClick={() => void start()} disabled={status === "starting"} className="mt-1 h-12 bg-violet-500 font-bold text-white hover:bg-violet-400">
            {status === "starting" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparazione consulente…</> : "Parla con la consulente"}
          </Button>
        </div>
      </div>
    </section>
  )
}
