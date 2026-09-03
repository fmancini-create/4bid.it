"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, CameraOff, Check, Clock3, Loader2, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const DAILY_SDK_URL = "https://unpkg.com/@daily-co/daily-js@0.92.2"
const INACTIVITY_TIMEOUT_MS = 15_000
const INACTIVITY_GOODBYE_FALLBACK_MS = 8_000
const GREETING_FALLBACK_MS = 3_500
const INACTIVITY_GOODBYE = "Non la trattengo oltre. La ringrazio per il tempo che ci ha dedicato e le auguro una buona giornata."
const DEFAULT_OPENING_MESSAGE = "Buongiorno, sono la consulente digitale di 4BID. Ho già analizzato il suo preventivo e posso spiegarle in pochi secondi i punti più importanti. Vuole che inizi dai moduli consigliati?"

type DailyTrackInfo = {
  persistentTrack?: MediaStreamTrack | null
  track?: MediaStreamTrack | null
  state?: string
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
  openingMessage: string
}

type TavusAppMessage = {
  message_type?: string
  event_type?: string
  properties?: {
    role?: "pal" | "replica" | "user" | string
    [key: string]: unknown
  }
}

let dailySdkPromise: Promise<void> | null = null

function loadDailySdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser non disponibile"))
  if (window.Daily) return Promise.resolve()
  if (dailySdkPromise) return dailySdkPromise

  dailySdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-4bid-daily-sdk="true"]')
    const finish = () => window.Daily ? resolve() : reject(new Error("SDK video non inizializzato"))
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
    element.srcObject = null
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
  const role = message.properties?.role
  if (eventType === "conversation.started_speaking") return { phase: "started" as const, role }
  if (eventType === "conversation.stopped_speaking") return { phase: "stopped" as const, role }
  if (eventType === "conversation.user.started_speaking") return { phase: "started" as const, role: "user" }
  if (eventType === "conversation.user.stopped_speaking") return { phase: "stopped" as const, role: "user" }
  if (eventType === "conversation.replica.started_speaking") return { phase: "started" as const, role: "replica" }
  if (eventType === "conversation.replica.stopped_speaking") return { phase: "stopped" as const, role: "replica" }
  return null
}

function friendlyStartError(status: number, rawMessage: string) {
  const message = rawMessage.toLowerCase()
  if (status === 429 || /quota|credit|concurr|limit|busy|occupat/.test(message)) {
    return "La consulente è momentaneamente impegnata. Riprova tra qualche minuto."
  }
  if (status === 503) return "La consulente video non è disponibile in questo momento."
  return "Non riesco ad avviare la videochiamata in questo momento. Riprova tra poco."
}

function friendlyConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  if (/permission|notallowed|denied|microphone|microfono/.test(message)) {
    return "Per conversare serve il microfono. Consenti l'accesso dal browser e riprova."
  }
  return "Il collegamento non è riuscito. Riprova senza ricaricare la pagina."
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
  const [assistantSpeaking, setAssistantSpeaking] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)

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
      audio.srcObject = null
      return
    }

    const current = audio.srcObject
    if (!(current instanceof MediaStream) || !current.getTracks().some((item) => item.id === track.id)) {
      audio.srcObject = new MediaStream([track])
    }
    audio.muted = false
    audio.volume = 1
    void audio.play().then(() => setNeedsAudioActivation(false)).catch(() => setNeedsAudioActivation(true))
  }

  const activateAudio = async () => {
    const call = callRef.current
    if (call) {
      const remote = Object.values(call.participants()).find((participant) => !participant.local && participantTrack(participant, "audio"))
      routeRemoteAudio(participantTrack(remote, "audio"))
    }
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

  useEffect(() => {
    if (!session) return
    let cancelled = false
    let call: DailyCall | null = null
    let greetingTimer: ReturnType<typeof setTimeout> | null = null
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null
    let goodbyeTimer: ReturnType<typeof setTimeout> | null = null
    let palHasSpoken = false
    let closing = false

    const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => timer && clearTimeout(timer)
    const sendEcho = (text: string) => {
      if (!call) return
      call.sendAppMessage({
        message_type: "conversation",
        event_type: "conversation.echo",
        conversation_id: session.conversationId,
        properties: { modality: "text", text, done: true },
      }, "*")
    }

    const finishCall = async () => {
      if (!call) return setStatus("ended")
      const activeCall = call
      callRef.current = null
      try { await Promise.resolve(activeCall.leave()) } catch {}
      try { await Promise.resolve(activeCall.destroy()) } catch {}
      remoteAudioRef.current?.pause()
      if (!cancelled) setStatus("ended")
    }

    const armInactivity = () => {
      clearTimer(inactivityTimer)
      if (closing || cancelled) return
      inactivityTimer = setTimeout(() => {
        if (!call || closing) return
        closing = true
        try { sendEcho(INACTIVITY_GOODBYE) } catch { void finishCall(); return }
        goodbyeTimer = setTimeout(() => void finishCall(), INACTIVITY_GOODBYE_FALLBACK_MS)
      }, INACTIVITY_TIMEOUT_MS)
    }

    const handleAppMessage = (event: DailyEvent) => {
      const message = parseTavusAppMessage(event.data)
      if (!message || message.message_type !== "conversation") return
      const speaking = speakingEvent(message)
      if (!speaking) return

      const isPal = speaking.role === "pal" || speaking.role === "replica"
      const isUser = speaking.role === "user"
      if (speaking.phase === "started") {
        clearTimer(inactivityTimer)
        if (isPal) {
          palHasSpoken = true
          clearTimer(greetingTimer)
          setAssistantSpeaking(true)
        }
        if (isUser) setUserSpeaking(true)
        return
      }

      if (isPal) {
        setAssistantSpeaking(false)
        if (closing) void finishCall()
        else armInactivity()
      }
      if (isUser) setUserSpeaking(false)
    }

    const syncTracks = () => {
      if (!call) return
      const participants = Object.values(call.participants())
      const remote = participants.find((participant) => !participant.local && participantTrack(participant, "video"))
        || participants.find((participant) => !participant.local)
      const local = participants.find((participant) => participant.local)
      const remoteVideo = participantTrack(remote, "video")
      const remoteAudio = participantTrack(remote, "audio")
      attachVideoTrack(remoteVideoRef.current, remoteVideo)
      routeRemoteAudio(remoteAudio)
      attachVideoTrack(localVideoRef.current, participantTrack(local, "video"))
      setHasRemoteVideo(Boolean(remoteVideo))
    }

    const ensureMicrophonePublished = async () => {
      if (!call) return
      await Promise.resolve(call.setLocalAudio(true))
      setMicOn(true)
      await new Promise((resolve) => setTimeout(resolve, 450))
      const local = Object.values(call.participants()).find((participant) => participant.local)
      if (!participantTrack(local, "audio")) {
        await Promise.resolve(call.setLocalAudio(false))
        await Promise.resolve(call.setLocalAudio(true))
      }
      setMicOn(true)
    }

    const connect = async () => {
      setStatus("connecting")
      setError(null)
      try {
        await loadDailySdk()
        if (cancelled || !window.Daily) return
        call = window.Daily.createCallObject({ startVideoOff: true, startAudioOff: false, subscribeToTracksAutomatically: true })
        callRef.current = call
        call
          .on("joined-meeting", () => { if (!cancelled) { setStatus("joined"); syncTracks() } })
          .on("participant-joined", syncTracks)
          .on("participant-updated", syncTracks)
          .on("track-started", syncTracks)
          .on("track-stopped", syncTracks)
          .on("app-message", handleAppMessage)
          .on("left-meeting", () => { if (!cancelled) setStatus("ended") })
          .on("error", (event) => { if (!cancelled) { setError(friendlyConnectionError(event)); setStatus("error") } })

        await call.join({ url: session.conversationUrl, ...(session.meetingToken ? { token: session.meetingToken } : {}) })
        await ensureMicrophonePublished()
        syncTracks()

        greetingTimer = setTimeout(() => {
          if (!cancelled && !closing && !palHasSpoken) {
            try { sendEcho(session.openingMessage) } catch {}
          }
        }, GREETING_FALLBACK_MS)
      } catch (connectionError) {
        if (!cancelled) {
          setError(friendlyConnectionError(connectionError))
          setStatus("error")
        }
      }
    }

    void connect()
    return () => {
      cancelled = true
      clearTimer(greetingTimer)
      clearTimer(inactivityTimer)
      clearTimer(goodbyeTimer)
      const activeCall = call || callRef.current
      if (activeCall) {
        callRef.current = null
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
    setNeedsAudioActivation(false)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("microphone unavailable")
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      permissionStream.getTracks().forEach((track) => track.stop())

      const response = await fetch(`/api/quotes/shared/${encodeURIComponent(token)}/live-avatar`, { method: "POST", headers: { "Content-Type": "application/json" } })
      const data = await response.json().catch(() => ({}))
      const conversationId = String(data?.conversationId || "")
      const conversationUrl = String(data?.conversationUrl || data?.joinUrl || "")
      if (!response.ok || !conversationId || !conversationUrl) throw new Error(friendlyStartError(response.status, String(data?.error || "")))
      setSession({
        conversationId,
        conversationUrl,
        meetingToken: data?.meetingToken ? String(data.meetingToken) : null,
        openingMessage: String(data?.openingMessage || DEFAULT_OPENING_MESSAGE),
      })
    } catch (startError) {
      setError(startError instanceof Error && startError.message.startsWith("La consulente") ? startError.message : friendlyConnectionError(startError))
      setStatus("error")
      setSession(null)
    }
  }

  const toggleMic = async () => {
    const call = callRef.current
    if (!call) return
    const next = !micOn
    try { await Promise.resolve(call.setLocalAudio(next)); setMicOn(next) }
    catch { setError("Non riesco a modificare il microfono. Controlla i permessi del browser.") }
  }

  const toggleCamera = async () => {
    const call = callRef.current
    if (!call) return
    const next = !cameraOn
    try { await Promise.resolve(call.setLocalVideo(next)); setCameraOn(next) }
    catch { setError("Non riesco ad attivare la videocamera. Controlla i permessi del browser.") }
  }

  const leaveCall = async () => {
    const call = callRef.current
    if (call) try { await Promise.resolve(call.leave()) } catch {}
    remoteAudioRef.current?.pause()
    setStatus("ended")
  }

  if (session && (status === "connecting" || status === "joined" || status === "error")) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="relative h-[68svh] min-h-[430px] max-h-[760px] overflow-hidden bg-slate-950 sm:h-[min(72vh,720px)] sm:min-h-[520px]">
          <video ref={remoteVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" aria-label="Consulente digitale 4BID" />
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" aria-hidden="true" />

          {!hasRemoteVideo && status !== "error" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950 text-center text-white">
              <Loader2 className="h-10 w-10 animate-spin text-violet-300" />
              <div><p className="text-lg font-semibold">Sto collegando la consulente…</p><p className="mt-1 text-sm text-slate-400">Microfono e conversazione vengono verificati automaticamente.</p></div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-4 top-4 z-30 opacity-75 drop-shadow-lg sm:left-5 sm:top-5">
            <img src="/logo.png" alt="4BID" className="h-7 w-auto object-contain sm:h-8" />
          </div>

          {cameraOn ? <div className="absolute right-4 top-4 z-30 h-32 w-24 overflow-hidden rounded-2xl border border-white/25 bg-slate-900 shadow-xl"><video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" /></div> : <video ref={localVideoRef} autoPlay playsInline muted className="hidden" aria-hidden="true" />}

          {needsAudioActivation ? (
            <div className="absolute inset-x-4 top-1/2 z-50 flex -translate-y-1/2 justify-center">
              <div className="max-w-sm rounded-2xl border border-violet-300/30 bg-slate-950/95 p-5 text-center text-white shadow-2xl backdrop-blur">
                <Volume2 className="mx-auto h-7 w-7 text-violet-300" />
                <p className="mt-2 font-semibold">La consulente sta parlando</p>
                <p className="mt-1 text-sm text-slate-300">Il browser ha bloccato la riproduzione automatica.</p>
                <Button onClick={() => void activateAudio()} className="mt-4 bg-violet-500 text-white hover:bg-violet-400"><Volume2 className="mr-2 h-4 w-4" /> Ascolta la consulente</Button>
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-4 bottom-24 z-30">
            <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-950/78 px-4 py-3 text-white shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium sm:text-sm">{assistantSpeaking ? "La consulente sta parlando…" : userSpeaking ? "Ti sto ascoltando…" : status === "joined" ? "Puoi parlare normalmente" : "Connessione in corso…"}</p>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${micOn ? "bg-emerald-400/15 text-emerald-200" : "bg-red-400/15 text-red-200"}`}>{micOn ? "Microfono attivo" : "Microfono spento"}</span>
              </div>
              {status === "joined" && !assistantSpeaking ? <p className="mt-2 text-xs leading-relaxed text-slate-300">{session.openingMessage}</p> : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent px-4 pb-5 pt-9">
            <button onClick={() => void toggleMic()} aria-label={micOn ? "Disattiva microfono" : "Attiva microfono"} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white">{micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
            <button onClick={() => void toggleCamera()} aria-label={cameraOn ? "Disattiva videocamera" : "Attiva videocamera"} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white">{cameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}</button>
            <button onClick={() => void activateAudio()} aria-label="Riattiva audio consulente" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white"><Volume2 className="h-5 w-5" /></button>
            <button onClick={() => void leaveCall()} aria-label="Termina conversazione" className="flex h-12 w-14 items-center justify-center rounded-full bg-red-600 text-white"><PhoneOff className="h-5 w-5" /></button>
          </div>

          {status === "error" ? <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-center text-white"><div className="max-w-md"><h3 className="text-xl font-semibold">Collegamento da completare</h3><p className="mt-2 text-sm text-slate-300">{error}</p><Button onClick={() => { setSession(null); setStatus("idle"); setError(null) }} className="mt-5 bg-violet-600 text-white hover:bg-violet-500">Riprova</Button></div></div> : null}
        </div>
      </section>
    )
  }

  if (status === "ended") {
    return <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-7 text-center shadow-sm"><Sparkles className="mx-auto h-7 w-7 text-violet-600" /><h3 className="mt-3 text-xl font-bold">Grazie per la conversazione</h3><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Puoi continuare a leggere la proposta oppure riaprire la consulenza.</p><Button onClick={() => void start()} className="mt-5 bg-violet-600 text-white hover:bg-violet-700">Riapri la consulente</Button></section>
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-300/30 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white shadow-2xl">
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Consulente AI disponibile ora</div>
          <h3 className="text-2xl font-black tracking-tight sm:text-4xl">Ti spiego questo preventivo in 60 secondi</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">La consulente digitale 4BID ha già analizzato la proposta. Può mostrarti subito i punti più importanti, confrontare le opzioni e rispondere alle tue domande.</p>
          <div className="mt-5 rounded-2xl border border-violet-300/20 bg-white/5 p-4 text-sm italic text-violet-100">“Vuole che le mostri in un minuto quali moduli le convengono davvero?”</div>
          {error ? <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="grid gap-3 text-sm text-slate-200">
            <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-violet-300" /> Circa 60 secondi per capire la proposta</div>
            <div className="flex items-center gap-3"><Check className="h-4 w-4 text-violet-300" /> Personalizzata sul tuo preventivo</div>
            <div className="flex items-center gap-3"><Mic className="h-4 w-4 text-violet-300" /> Puoi interrompere e fare domande a voce</div>
          </div>
          <Button onClick={() => void start()} disabled={status === "starting"} className="mt-5 h-14 w-full bg-violet-500 text-base font-black text-white shadow-lg shadow-violet-950/30 hover:bg-violet-400">
            {status === "starting" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sto preparando la consulente…</> : <><Sparkles className="mr-2 h-5 w-5" /> Fatti spiegare il preventivo in 60 secondi</>}
          </Button>
          <p className="mt-3 text-center text-xs text-slate-400">Nessun impegno · conversazione in tempo reale</p>
        </div>
      </div>
    </section>
  )
}
