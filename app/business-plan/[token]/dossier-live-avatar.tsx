"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Loader2, Mic, MicOff, PhoneOff, RotateCcw, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const DAILY_SDK_URL = "https://unpkg.com/@daily-co/daily-js@0.92.2"
const FINAL_FAREWELL = "Grazie, è stato un piacere. Se avrai altre domande sul dossier, sarò qui. Arrivederci e buona giornata."

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

type TavusConversationEvent = {
  message_type?: string
  event_type?: string
  conversation_id?: string
  properties?: {
    role?: "user" | "replica"
    speech?: string
    interrupted?: boolean
    duration?: number | null
  }
}

type DailyEvent = {
  errorMsg?: string
  data?: TavusConversationEvent
}

type DailyCall = {
  join(options: { url: string; token?: string }): Promise<unknown>
  leave(): Promise<unknown> | void
  destroy(): Promise<unknown> | void
  on(event: string, handler: (event: DailyEvent) => void): DailyCall
  participants(): Record<string, DailyParticipant>
  setLocalAudio(enabled: boolean): Promise<unknown> | void
  sendAppMessage(data: Record<string, unknown>, recipient?: string): Promise<unknown> | void
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

type LiveStatus = "idle" | "starting" | "connecting" | "joined" | "ended" | "error"

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

function normalizeSpeech(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[!?.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isFarewellSpeech(value: string) {
  const speech = normalizeSpeech(value)
  if (!speech) return false

  if (
    speech.includes("possiamo chiudere") ||
    speech.includes("chiudiamo qui") ||
    speech.includes("devo andare") ||
    speech.includes("ci sentiamo") ||
    speech.includes("ci vediamo")
  ) {
    return true
  }

  return /^(?:(?:ok|okay|grazie|perfetto|va bene|benissimo) )*(?:ciao|ciao anna|arrivederci|a presto|buona giornata|buona serata)(?: grazie)?$/.test(
    speech,
  )
}

function roleFromEvent(event: TavusConversationEvent) {
  if (event.properties?.role) return event.properties.role
  if (event.event_type?.includes(".replica.")) return "replica" as const
  if (event.event_type?.includes(".user.")) return "user" as const
  return undefined
}

export default function DossierLiveAvatar({ token }: { token: string }) {
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [status, setStatus] = useState<LiveStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(false)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [needsAudioActivation, setNeedsAudioActivation] = useState(false)

  const callRef = useRef<DailyCall | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const autoStartedRef = useRef(false)
  const awaitingUserRef = useRef(false)
  const farewellPendingRef = useRef(false)
  const farewellSpeechStartedRef = useRef(false)
  const endingRef = useRef(false)
  const farewellFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const farewellRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const clearFarewellTimers = () => {
    if (farewellFallbackTimerRef.current) {
      clearTimeout(farewellFallbackTimerRef.current)
      farewellFallbackTimerRef.current = null
    }
    if (farewellRetryTimerRef.current) {
      clearTimeout(farewellRetryTimerRef.current)
      farewellRetryTimerRef.current = null
    }
  }

  const clearRemoteMedia = () => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }
  }

  const teardownLocalCall = async () => {
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
    clearRemoteMedia()
  }

  const endConversation = async (reason = "manual") => {
    if (endingRef.current) return
    endingRef.current = true
    clearFarewellTimers()

    const conversationId = session?.conversationId
    try {
      if (conversationId) {
        await fetch(`/api/business-plan/shared/${encodeURIComponent(token)}/live-avatar`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, reason }),
          keepalive: true,
        })
      }
    } catch {
      // La chiusura locale deve avvenire comunque.
    } finally {
      await teardownLocalCall()
      farewellPendingRef.current = false
      farewellSpeechStartedRef.current = false
      awaitingUserRef.current = false
      setMicOn(false)
      setHasRemoteVideo(false)
      setNeedsAudioActivation(false)
      setSession(null)
      setStatus("ended")
      endingRef.current = false
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

    const interruptIdleEngagement = () => {
      const activeCall = callRef.current
      if (!activeCall || !session.conversationId) return
      void Promise.resolve(
        activeCall.sendAppMessage(
          {
            message_type: "conversation",
            event_type: "conversation.interrupt",
            conversation_id: session.conversationId,
          },
          "*",
        ),
      ).catch(() => undefined)
    }

    const speakFinalFarewell = () => {
      const activeCall = callRef.current
      if (!activeCall || !session.conversationId || endingRef.current) return

      void Promise.resolve(
        activeCall.sendAppMessage(
          {
            message_type: "conversation",
            event_type: "conversation.echo",
            conversation_id: session.conversationId,
            properties: {
              modality: "text",
              text: FINAL_FAREWELL,
              done: true,
            },
          },
          "*",
        ),
      ).catch(() => undefined)
    }

    const handleAppMessage = (dailyEvent: DailyEvent) => {
      const event = dailyEvent.data
      if (!event || event.message_type !== "conversation") return
      if (event.conversation_id && event.conversation_id !== session.conversationId) return

      const eventType = event.event_type || ""
      const role = roleFromEvent(event)

      if (eventType === "conversation.utterance" && role === "user") {
        awaitingUserRef.current = false
        const speech = event.properties?.speech || ""
        if (isFarewellSpeech(speech) && !farewellPendingRef.current) {
          farewellPendingRef.current = true
          farewellSpeechStartedRef.current = false
          clearFarewellTimers()
          speakFinalFarewell()

          // Se il primo echo non viene preso dal data channel, ritentiamo una volta.
          farewellRetryTimerRef.current = setTimeout(() => {
            if (farewellPendingRef.current && !farewellSpeechStartedRef.current) speakFinalFarewell()
          }, 2500)

          // Ultima rete di sicurezza: non lasciare una sessione Tavus appesa indefinitamente.
          farewellFallbackTimerRef.current = setTimeout(() => {
            void endConversation("farewell_timeout")
          }, 20_000)
        }
        return
      }

      const startedSpeaking =
        eventType === "conversation.started_speaking" ||
        eventType === "conversation.replica.started_speaking" ||
        eventType === "conversation.user.started_speaking"

      if (startedSpeaking) {
        if (role === "user") {
          awaitingUserRef.current = false
          return
        }

        if (role === "replica" && farewellPendingRef.current) {
          farewellSpeechStartedRef.current = true
          if (farewellRetryTimerRef.current) {
            clearTimeout(farewellRetryTimerRef.current)
            farewellRetryTimerRef.current = null
          }
          return
        }

        if (role === "replica" && awaitingUserRef.current) {
          // Tavus Idle Engagement: Anna non deve riaprire da sola il discorso mentre la banca legge o pensa.
          interruptIdleEngagement()
        }
        return
      }

      const stoppedSpeaking =
        eventType === "conversation.stopped_speaking" ||
        eventType === "conversation.replica.stopped_speaking" ||
        eventType === "conversation.user.stopped_speaking"

      if (stoppedSpeaking && role === "replica") {
        if (farewellPendingRef.current && farewellSpeechStartedRef.current) {
          // Chiudiamo SOLO dopo che Anna ha effettivamente pronunciato tutto il saluto.
          window.setTimeout(() => void endConversation("farewell"), 650)
        } else if (!farewellPendingRef.current) {
          awaitingUserRef.current = true
        }
      }
    }

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
            setMicOn(true)
            awaitingUserRef.current = false
            void Promise.resolve(call?.setLocalAudio(true)).catch(() => undefined)
            syncRemoteMedia()
            void track("avatar_connected", {
              conversation_id: session.conversationId,
              mode: "realtime_video",
              autoplay: true,
              microphone: "on",
            })
          })
          .on("app-message", handleAppMessage)
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
      clearRemoteMedia()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const start = async () => {
    if (status === "starting" || status === "connecting" || status === "joined") return

    setStatus("starting")
    setError(null)
    farewellPendingRef.current = false
    farewellSpeechStartedRef.current = false
    awaitingUserRef.current = false
    clearFarewellTimers()

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microfono non disponibile in questo browser.")

      // Il dossier bancario è bidirezionale per definizione: chiediamo il microfono prima
      // di creare una sessione Tavus, così non parte mai una conversazione muta.
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      permissionStream.getTracks().forEach((track) => track.stop())
      setMicOn(true)

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
      setMicOn(false)
      setError(
        /permission|notallowed|denied|microfono|microphone/i.test(message)
          ? "Per parlare con Anna serve il microfono. Consenti l'accesso dal browser e premi Riprova."
          : message,
      )
      setStatus("error")
      setSession(null)
    }
  }

  useEffect(() => {
    if (checking || !enabled || session || status !== "idle" || autoStartedRef.current) return
    autoStartedRef.current = true
    void start()
    // L'autoplay deve avvenire una sola volta appena il dossier autorizzato è pronto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, enabled, session, status])

  useEffect(() => {
    return () => clearFarewellTimers()
  }, [])

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
    clearFarewellTimers()
    await teardownLocalCall()
    setSession(null)
    setHasRemoteVideo(false)
    setNeedsAudioActivation(false)
    setStatus("idle")
    setError(null)
    endingRef.current = false
    farewellPendingRef.current = false
    farewellSpeechStartedRef.current = false
    awaitingUserRef.current = false
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
      <div className="relative mx-auto h-[300px] max-w-7xl overflow-hidden rounded-[28px] border border-amber-300/20 bg-black shadow-2xl sm:h-[340px] lg:h-[360px]">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover object-center"
          aria-label="Anna, consulente digitale 4BID"
        />
        <audio ref={remoteAudioRef} autoPlay className="hidden" aria-hidden="true" />

        {(!session || !hasRemoteVideo) && status !== "error" && status !== "ended" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-amber-300" />
          </div>
        ) : null}

        {needsAudioActivation && status === "joined" ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20">
            <Button
              onClick={() => void activateAudio()}
              className="h-12 rounded-full bg-black/75 px-5 text-white shadow-xl backdrop-blur hover:bg-black/85"
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
                onClick={() => void retry()}
                className="mt-4 rounded-full bg-amber-400 px-5 text-slate-950 hover:bg-amber-300"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Riprova
              </Button>
            </div>
          </div>
        ) : null}

        {status === "ended" ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/95 p-6 text-center text-white">
            <div>
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />
              <p className="mt-3 font-medium">Conversazione conclusa</p>
              <Button
                variant="outline"
                onClick={() => void retry()}
                className="mt-4 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Nuova conversazione
              </Button>
            </div>
          </div>
        ) : null}

        {status === "joined" ? (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
            <div
              className={`hidden h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold shadow-xl backdrop-blur sm:flex ${
                micOn ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-white" />
              {micOn ? "Microfono attivo" : "Microfono disattivato"}
            </div>

            <Button
              size="icon"
              onClick={() => void toggleMic()}
              className={`h-11 w-11 rounded-full border border-white/30 shadow-xl backdrop-blur ${
                micOn ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-red-500 text-white hover:bg-red-600"
              }`}
              aria-label={micOn ? "Disattiva microfono" : "Attiva microfono"}
              title={micOn ? "Microfono attivo" : "Microfono disattivato"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              size="icon"
              onClick={() => void endConversation("manual")}
              className="h-11 w-11 rounded-full border border-white/30 bg-red-600 text-white shadow-xl hover:bg-red-700"
              aria-label="Termina conversazione"
              title="Termina conversazione"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
