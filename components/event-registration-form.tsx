"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Loader2 } from "lucide-react"

export function EventRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    role: "",
    num_guests: 1,
    brings_device: false,
    dietary_notes: "",
    notes: "",
  })

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event_slug: "santaddeo-launch-2026" }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Errore nella registrazione")
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-teal-700" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">Registrazione confermata</h3>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Grazie <span className="font-semibold text-foreground">{form.first_name}</span>, la tua presenza
          all&apos;evento Santaddeo presso Villa I Barronci e' stata confermata.
          Riceverai una email di conferma con tutti i dettagli.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Ti aspettiamo!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name" className="text-sm font-medium text-foreground">Nome *</Label>
          <Input
            id="first_name"
            required
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            placeholder="Il tuo nome"
            className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <Label htmlFor="last_name" className="text-sm font-medium text-foreground">Cognome *</Label>
          <Input
            id="last_name"
            required
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            placeholder="Il tuo cognome"
            className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email *</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="nome@struttura.com"
          className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-foreground">Telefono</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+39 ..."
            className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <Label htmlFor="company_name" className="text-sm font-medium text-foreground">Struttura / Azienda</Label>
          <Input
            id="company_name"
            value={form.company_name}
            onChange={(e) => updateField("company_name", e.target.value)}
            placeholder="Nome struttura"
            className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="role" className="text-sm font-medium text-foreground">Ruolo</Label>
        <Input
          id="role"
          value={form.role}
          onChange={(e) => updateField("role", e.target.value)}
          placeholder="es. Direttore, Revenue Manager, Proprietario"
          className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <Label htmlFor="num_guests" className="text-sm font-medium text-foreground">Numero partecipanti <span className="text-muted-foreground font-normal">(max 2 per azienda)</span></Label>
          <Input
            id="num_guests"
            type="number"
            min={1}
            max={2}
            value={form.num_guests}
            onChange={(e) => updateField("num_guests", Math.min(parseInt(e.target.value) || 1, 2))}
            className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
          />
        </div>
        <div className="flex items-center gap-3 pb-1">
          <Switch
            checked={form.brings_device}
            onCheckedChange={(v) => updateField("brings_device", v)}
            id="brings_device"
          />
          <Label htmlFor="brings_device" className="text-sm text-foreground cursor-pointer">
            Portero' PC o tablet per la sessione pratica
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="dietary_notes" className="text-sm font-medium text-foreground">
          Intolleranze / preferenze alimentari (per l&apos;aperitivo)
        </Label>
        <Input
          id="dietary_notes"
          value={form.dietary_notes}
          onChange={(e) => updateField("dietary_notes", e.target.value)}
          placeholder="es. vegetariano, celiaco, nessuna"
          className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-foreground">Note aggiuntive</Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Qualcosa che vuoi farci sapere..."
          className="mt-1.5 bg-background border-border/60 focus:border-teal-500 focus:ring-teal-500/20 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-base font-medium bg-teal-700 hover:bg-teal-800 text-white transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Registrazione in corso...
          </>
        ) : (
          "Conferma la mia presenza"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Posti limitati. Conferma richiesta.
      </p>
    </form>
  )
}
