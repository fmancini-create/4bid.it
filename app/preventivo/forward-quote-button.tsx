"use client"

import { useState } from "react"
import { Mail, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ForwardQuoteButton({ token }: { token: string }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)

  async function send() {
    const emails = value
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter(Boolean)

    if (!emails.length) {
      toast.error("Inserisci almeno un indirizzo email")
      return
    }

    setSending(true)
    try {
      const response = await fetch(`/api/quotes/shared/${token}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Invio non riuscito")

      if (data.sent > 0) {
        toast.success(`Preventivo inviato a ${data.sent} ${data.sent === 1 ? "destinatario" : "destinatari"}`)
      }
      if (data.failed?.length) {
        toast.error(`Non inviato a: ${data.failed.join(", ")}`)
      }
      if (data.skipped?.length) {
        toast.info(`Già destinatari del preventivo: ${data.skipped.join(", ")}`)
      }

      if (data.sent > 0) {
        setValue("")
        setOpen(false)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'invio")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        className="fixed bottom-5 left-5 z-[70] shadow-xl print:hidden"
        onClick={() => setOpen(true)}
        aria-label="Inoltra il preventivo via email"
      >
        <Mail className="mr-2 h-4 w-4" />
        Inoltra preventivo
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => !sending && setOpen(nextOpen)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inoltra questo preventivo</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="forward-quote-emails">Email destinatari</Label>
            <Textarea
              id="forward-quote-emails"
              rows={5}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={"mario@azienda.it\nlucia@azienda.it"}
              autoComplete="off"
              disabled={sending}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Inserisci uno o più indirizzi, separati da virgola, punto e virgola o una nuova riga. 4BID invierà direttamente una copia personale di sola consultazione: non verrà aperto alcun programma di posta. Aperture e visualizzazioni saranno registrate separatamente per ogni destinatario.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              <X className="mr-2 h-4 w-4" />
              Annulla
            </Button>
            <Button type="button" onClick={send} disabled={sending || !value.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Invio in corso..." : "Invia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
