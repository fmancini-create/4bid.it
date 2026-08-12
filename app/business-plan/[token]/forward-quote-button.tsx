"use client"

import { useState } from "react"
import { Mail, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function ForwardQuoteButton({ token }: { token: string }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)

  const send = async () => {
    const emails = value
      .split(/[\n,;]+/)
      .map((v) => v.trim())
      .filter(Boolean)

    if (!emails.length) {
      toast.error("Inserisci almeno un indirizzo email")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/business-plan/shared/${token}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Invio non riuscito")

      toast.success(`Preventivo inviato a ${data.sent} destinatari`)
      if (data.failed?.length) {
        toast.error(`Non inviato a: ${data.failed.join(", ")}`)
      }

      setValue("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'invio")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 shadow-lg bg-amber-500 hover:bg-amber-600"
        onClick={() => setOpen(true)}
      >
        <Mail className="h-4 w-4 mr-2" />
        Inoltra preventivo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inoltra questo preventivo</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="forwardEmails">Email destinatari</Label>
            <Input
              id="forwardEmails"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sending) send()
              }}
              placeholder="mario@azienda.it, luca@azienda.it"
            />
            <p className="text-xs text-muted-foreground">
              Inserisci uno o più indirizzi separati da virgola, punto e virgola o invio. Il preventivo viene spedito direttamente da 4BID: non verrà aperto alcun programma di posta. Ogni destinatario riceverà un link personale per il tracciamento di aperture e visualizzazioni.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button onClick={send} disabled={sending || !value.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Invio..." : "Invia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
