"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const REASONS = [
  ["price", "Prezzo"],
  ["timing", "Tempistiche"],
  ["priority", "Priorità cambiata"],
  ["features", "La proposta non rispondeva alle esigenze"],
  ["competitor", "Ho scelto un'altra soluzione"],
  ["internal", "Decisione interna / budget non approvato"],
  ["other", "Altro"],
] as const

export default function FeedbackForm({ token }: { token: string }) {
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit() {
    if (!reason) return toast.error("Seleziona il motivo principale")
    setSending(true)
    try {
      const response = await fetch(`/api/quotes/shared/${token}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, note }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Impossibile inviare il feedback")
      setSent(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile inviare il feedback")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <h1 className="text-2xl font-bold">Grazie per il feedback</h1>
        <p className="mt-2 text-muted-foreground">La risposta è stata registrata e ci aiuterà a migliorare le prossime proposte.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl font-bold">Ci aiuti a capire cosa non ha funzionato?</h1>
      <p className="mt-2 text-sm text-muted-foreground">Basta indicare il motivo principale. La risposta richiede meno di un minuto.</p>

      <div className="mt-6 space-y-2">
        {REASONS.map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
            <input
              type="radio"
              name="reason"
              value={value}
              checked={reason === value}
              onChange={() => setReason(value)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="note">Vuoi aggiungere qualcosa? <span className="text-muted-foreground">(facoltativo)</span></Label>
        <Textarea
          id="note"
          rows={4}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Scrivi qui eventuali dettagli utili..."
        />
      </div>

      <Button onClick={submit} disabled={sending} className="mt-6 w-full sm:w-auto">
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Invia feedback
      </Button>
    </div>
  )
}
