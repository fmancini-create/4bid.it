"use client"

import { useState } from "react"
import { CheckCircle2, Copy, Loader2, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 8; i += 1) password += chars.charAt(Math.floor(Math.random() * chars.length))
  return password
}

type ShareResult = {
  link: string
  emailSent: boolean
}

export default function BankDossierShareButton({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState(generatePassword)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ShareResult | null>(null)

  const reset = () => {
    setRecipientName("")
    setEmail("")
    setPassword(generatePassword())
    setResult(null)
  }

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiato`)
  }

  const submit = async () => {
    if (!recipientName.trim()) {
      toast.error("Inserisci nome e cognome del destinatario")
      return
    }
    if (!email.trim()) {
      toast.error("Inserisci l'email del destinatario")
      return
    }

    setSending(true)
    try {
      const response = await fetch(`/api/business-plan/${encodeURIComponent(planId)}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          recipient_name: recipientName.trim(),
          can_download: true,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(String(data?.error || "Condivisione non riuscita"))

      const link = String(data?.link || data?.shareLink || "")
      if (!link) throw new Error("Link di condivisione non generato")

      const emailSent = Boolean(data?.emailSent)
      setResult({ link, emailSent })
      if (emailSent) toast.success(`Dossier inviato a ${email.trim()}`)
      else toast.warning("Link creato, ma l'invio email non è stato confermato")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Condivisione non riuscita")
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
        Condividi dossier
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Condividi Dossier Banca & Investitori</DialogTitle>
          </DialogHeader>

          {!result ? (
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
                <p className="text-xs text-muted-foreground">
                  Serve anche per personalizzare l'email; all'accesso il destinatario inserirà nuovamente il proprio nome.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-recipient-email">Email</Label>
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
                <Label>Password di accesso</Label>
                <div className="flex gap-2">
                  <Input value={password} readOnly className="font-mono text-base font-semibold" />
                  <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())} title="Genera nuova password">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className={`rounded-lg border p-4 ${result.emailSent ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 ${result.emailSent ? "text-emerald-600" : "text-amber-600"}`} />
                  <div>
                    <p className="font-medium">Condivisione creata</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.emailSent
                        ? `Email consegnata al server di posta per ${email}.`
                        : "Il link è stato creato, ma il server non ha confermato l'invio email. Puoi copiare link e password qui sotto."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link personale</Label>
                <div className="flex gap-2">
                  <Input value={result.link} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={() => void copy(result.link, "Link")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="flex gap-2">
                  <Input value={password} readOnly className="font-mono text-base font-semibold" />
                  <Button type="button" variant="outline" size="icon" onClick={() => void copy(password, "Password")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {result ? (
              <>
                <Button variant="outline" onClick={reset}>Nuovo invio</Button>
                <Button onClick={() => setOpen(false)}>Chiudi</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Annulla</Button>
                <Button onClick={() => void submit()} disabled={sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {sending ? "Invio..." : "Invia dossier"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
