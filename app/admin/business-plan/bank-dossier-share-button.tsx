"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const DEFAULT_MESSAGE = `Ciao,

ti invio il Dossier Banca & Investitori di 4BID con il piano industriale e gli scenari economico-finanziari 2027-2031.

Quando hai un momento dagli un'occhiata e poi ne parliamo.

Filippo`

export default function BankDossierShareButton({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [email, setEmail] = useState("")
  const [cc, setCc] = useState("")
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [sending, setSending] = useState(false)

  const reset = () => {
    setRecipientName("")
    setEmail("")
    setCc("")
    setMessage(DEFAULT_MESSAGE)
  }

  const submit = async () => {
    if (!recipientName.trim()) {
      toast.error("Inserisci nome e cognome del destinatario")
      return
    }
    if (!email.trim()) {
      toast.error("Inserisci l'indirizzo email")
      return
    }
    if (!message.trim()) {
      toast.error("Scrivi il messaggio")
      return
    }

    setSending(true)
    try {
      const response = await fetch(`/api/business-plan/${encodeURIComponent(planId)}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          cc: cc.trim(),
          recipient_name: recipientName.trim(),
          message: message.trim(),
          can_download: true,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(String(data?.error || "Invio non riuscito"))
      if (!data?.emailSent) throw new Error("Il server email non ha confermato l'invio")

      toast.success(`Dossier inviato a ${email.trim()}`)
      setOpen(false)
      reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invio non riuscito")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        <Send className="mr-2 h-4 w-4" />
        Condividi
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Condividi Dossier Banca & Investitori</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bank-recipient-name">Nome e cognome</Label>
              <Input
                id="bank-recipient-name"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Es. Giovanni Salvadori"
                autoComplete="name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank-recipient-email">A</Label>
                <Input
                  id="bank-recipient-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@banca.it"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-recipient-cc">CC</Label>
                <Input
                  id="bank-recipient-cc"
                  type="text"
                  value={cc}
                  onChange={(event) => setCc(event.target.value)}
                  placeholder="facoltativo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-share-message">Messaggio</Label>
              <Textarea
                id="bank-share-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={9}
                className="resize-y"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Annulla
            </Button>
            <Button onClick={() => void submit()} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sending ? "Invio..." : "Invia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
