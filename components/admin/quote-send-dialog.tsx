"use client"

import { useEffect, useState } from "react"
import { Loader2, Paperclip, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SalesChannelQuote } from "@/lib/quotes/types"

/**
 * Finestra di invio del preventivo, con i destinatari in copia.
 *
 * La nota sulla riservatezza NON e' decorativa: chi manda una copia deve sapere
 * che il collaboratore riceve il PDF ma NON il link di accettazione, perche'
 * quel link consente di accettare al posto del cliente.
 */
export default function QuoteSendDialog({
  quote,
  open,
  onOpenChange,
  onSent,
}: {
  quote: SalesChannelQuote | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: (message: string, gravita: "successo" | "errore") => void
}) {
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Alla riapertura si ripropongono le copie gia' salvate sul preventivo: chi
  // reinvia si aspetta gli stessi collaboratori della prima volta.
  useEffect(() => {
    if (open && quote) {
      setCc((quote.copy_cc || []).join(", "))
      setBcc((quote.copy_bcc || []).join(", "))
      setError(null)
    }
  }, [open, quote])

  if (!quote) return null

  async function invia() {
    if (!quote) return
    if (!quote.client_email?.trim()) {
      setError("Destinatario mancante: salva prima l'email del cliente.")
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/quotes/${quote.id}/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Il destinatario visualizzato viene inviato esplicitamente al server.
        // Il backend lo confronta con il valore realmente salvato nel DB e
        // blocca l'invio se nel frattempo e' cambiato o la schermata e' obsoleta.
        body: JSON.stringify({ client_email: quote.client_email.trim(), cc, bcc }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Invio fallito")
        return
      }
      const nonRecapitate: string[] = (data.copies?.failed || [])
        .map((f: { email?: string }) => f?.email)
        .filter(Boolean)
      const inviate = data.copies?.sent || 0
      if (nonRecapitate.length) {
        onSent(
          `Preventivo inviato a ${quote.client_email}, ma la copia NON è arrivata a: ${nonRecapitate.join(", ")} — avvisali tu, il cliente li crede informati.`,
          "errore",
        )
      } else {
        onSent(
          inviate
            ? `Preventivo inviato a ${quote.client_email}, con ${inviate === 1 ? "1 copia" : `${inviate} copie`}.`
            : `Preventivo inviato a ${quote.client_email}.`,
          "successo",
        )
      }
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.message || "Invio fallito")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invia il preventivo</DialogTitle>
          <DialogDescription>
            Destinatario principale: <strong className="text-foreground">{quote.client_email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <strong>Controllo destinatario attivo.</strong> Prima di spedire, il server verifica che questo indirizzo coincida con quello salvato nel preventivo. Se i dati non coincidono, l'invio viene bloccato.
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-cc">Copia visibile (CC)</Label>
            <Textarea
              id="quote-cc"
              rows={2}
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="collaboratore@esempio.it, venditore@santaddeo.it"
            />
            <p className="text-xs text-muted-foreground">
              Il cliente legge nella sua email che questi indirizzi hanno ricevuto una copia.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-bcc">Copia nascosta (CCN)</Label>
            <Textarea
              id="quote-bcc"
              rows={2}
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="direzione@4bid.it"
            />
            <p className="text-xs text-muted-foreground">
              Il cliente non viene informato. Ogni destinatario riceve un messaggio separato e non vede gli altri.
            </p>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Le copie non possono accettare il preventivo
            </p>
            <p className="mt-1 flex items-start gap-2 text-xs text-amber-800">
              <Paperclip className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              Chi è in copia riceve il PDF, ma non il link personale: solo il cliente può accettare e impegnare la sua azienda.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annulla
          </Button>
          <Button onClick={invia} disabled={sending || !quote.client_email?.trim()}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {sending ? "Invio in corso..." : "Invia preventivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
