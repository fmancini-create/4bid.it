"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { Loader2, MessageCircle, Mic, MicOff, Pause, Play, Send, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PRESENTER = "data:image/jpeg;base64,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[...truncated...]";

type Props = { token: string; clientName?: string | null }

type LeadState = Record<string, unknown> | null

function plainText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/---+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export default function InteractiveVideoAssistant({ token, clientName }: Props) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(clientName ? `Ciao ${clientName}, sono la tua consulente virtuale 4BID. Puoi chiedermi qualsiasi cosa su questa proposta.` : "Ciao, sono la tua consulente virtuale 4BID. Puoi chiedermi qualsiasi cosa su questa proposta.")
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [leadState, setLeadState] = useState<LeadState>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => () => {
    recognitionRef.current?.stop?.()
    audioRef.current?.pause()
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
  }, [])

  async function speak(text: string) {
    audioRef.current?.pause()
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    const response = await fetch(`/api/quotes/shared/${encodeURIComponent(token)}/narration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spokenText: plainText(text).slice(0, 1200) }),
    })
    if (!response.ok) return
    const url = URL.createObjectURL(await response.blob())
    audioUrlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio
    audio.addEventListener("play", () => setSpeaking(true))
    audio.addEventListener("pause", () => setSpeaking(false))
    audio.addEventListener("ended", () => setSpeaking(false))
    await audio.play().catch(() => setSpeaking(false))
  }

  async function ask(rawQuestion: string) {
    const message = rawQuestion.trim()
    if (!message || loading) return
    setQuestion("")
    setLoading(true)
    setAnswer("Sto leggendo la tua proposta e preparo una risposta...")
    try {
      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId,
          userEmail: "",
          accountType: "pro",
          leadState,
          pageContext: `/preventivo/${token}`,
        }),
      })
      const data = await response.json().catch(() => ({})) as { response?: string; error?: string; conversationId?: string; leadState?: LeadState }
      if (!response.ok) throw new Error(data.error || "Non riesco a rispondere in questo momento")
      const nextAnswer = data.response || "Non ho una risposta disponibile."
      setAnswer(nextAnswer)
      if (data.conversationId) setConversationId(data.conversationId)
      if (data.leadState !== undefined) setLeadState(data.leadState || null)
      await speak(nextAnswer)
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Errore nella risposta")
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void ask(question)
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop?.()
      setListening(false)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setAnswer("Il riconoscimento vocale non è disponibile in questo browser. Puoi scrivermi la domanda qui sotto.")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = "it-IT"
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ""
      setQuestion(transcript)
      if (transcript) void ask(transcript)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  function toggleAudio() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play(); else audio.pause()
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-4 w-4 text-primary" /></span>
          <div><p className="font-bold">La tua consulente virtuale 4BID</p><p className="text-xs text-muted-foreground">Conosce il preventivo che stai guardando</p></div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><span className={`h-2 w-2 rounded-full bg-emerald-500 ${speaking || listening ? "animate-pulse" : ""}`} /> LIVE</span>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative min-h-[300px] overflow-hidden bg-slate-950">
          <img src={PRESENTER} alt="Consulente virtuale 4BID" className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${speaking ? "scale-[1.025] brightness-105" : "scale-100"}`} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-5 pt-20 text-white">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm font-semibold">Consulente digitale 4BID</p><p className="mt-1 text-xs text-white/75">{listening ? "Ti sto ascoltando..." : speaking ? "Ti sto rispondendo..." : "Pronta a rispondere"}</p></div>
              <div className="flex h-8 items-end gap-1" aria-hidden="true">{[3,6,4,8,5,7,4].map((h,i)=><span key={i} className={`w-1 rounded-full bg-white/90 ${speaking ? "animate-pulse" : ""}`} style={{height:`${speaking ? h*3 : 4}px`, animationDelay:`${i*90}ms`}} />)}</div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-col p-5">
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-muted/45 p-3 text-sm leading-relaxed">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="whitespace-pre-wrap">{plainText(answer)}</p>
          </div>

          <div className="mt-auto space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void ask("Spiegami in modo semplice il valore complessivo di questo preventivo")}> <Play className="mr-2 h-4 w-4" /> Raccontami la proposta</Button>
              <Button type="button" variant="outline" size="sm" onClick={toggleAudio} disabled={!audioRef.current}>{speaking ? <Pause className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}{speaking ? "Pausa" : "Riprendi voce"}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Perché conviene?", "Cosa è incluso?", "Mensile o annuale?"].map((label)=><button key={label} type="button" onClick={() => void ask(label)} className="rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:bg-primary/5">{label}</button>)}
            </div>
            <form onSubmit={submit} className="flex gap-2">
              <Input value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Fai una domanda sul preventivo..." disabled={loading} />
              <Button type="button" size="icon" variant={listening ? "destructive" : "outline"} onClick={toggleListening} aria-label={listening ? "Ferma microfono" : "Parla con la consulente"}>{listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button>
              <Button type="submit" size="icon" disabled={loading || !question.trim()} aria-label="Invia domanda">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
