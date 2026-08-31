"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ReactivationRequest({ token }: { token: string }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function requestReactivation() {
    setSending(true)
    try {
      const response = await fetch(`/api/quotes/shared/${token}/reactivation`, {
        method: "POST",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Impossibile inviare la richiesta")
      setSent(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile inviare la richiesta")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto mt-6 max-w-4xl rounded-xl border bg-card p-5 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
        <h2 className="font-semibold">Richiesta ricevuta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          4BID verificherà il preventivo e, se possibile, ne estenderà la validità.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-6 max-w-4xl rounded-xl border bg-card p-5 text-center shadow-sm">
      <h2 className="font-semibold">Vuoi ancora approfittare di questa proposta?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Il preventivo non è più valido, ma puoi chiedere a 4BID di riattivarlo con una nuova data di scadenza.
      </p>
      <Button onClick={requestReactivation} disabled={sending} className="mt-4">
        {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Richiedi riattivazione
      </Button>
    </div>
  )
}
