"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function RequestAccessClient() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    job_role: "",
    message: "",
    website: "", // honeypot
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/project-room/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Non riusciamo a inviare la richiesta.")
        setIsSubmitting(false)
        return
      }

      setIsDone(true)
    } catch {
      setError("Non riusciamo a inviare la richiesta. Controlla la connessione e riprova.")
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-state-approved" aria-hidden="true" />
          <h1 className="mb-2 text-xl font-bold text-brand-navy">Richiesta inviata</h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Grazie. Il team 4BID valuterà la richiesta e ti invierà un invito via email se l&apos;accesso viene
            approvato.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full bg-transparent">
            <Link href="/">Torna al sito</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="4BID" width={112} height={70} className="mx-auto h-14 w-auto object-contain" />
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-lg font-bold text-brand-navy">Richiedi accesso alla Project Room</h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            L&apos;area riservata contiene i documenti dei progetti 4BID. L&apos;accesso è concesso su invito: compila
            il form e ti ricontatteremo.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  required
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_name">Cognome *</Label>
                <Input
                  id="last_name"
                  required
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email aziendale *</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="nome@azienda.it"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="company">Azienda</Label>
                <Input
                  id="company"
                  autoComplete="organization"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="job_role">Ruolo</Label>
                <Input
                  id="job_role"
                  autoComplete="organization-title"
                  value={form.job_role}
                  onChange={(e) => update("job_role", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="message">Progetto di riferimento</Label>
              <Textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Indica il progetto o il referente 4BID che ti ha invitato."
              />
            </div>

            {/* Honeypot: hidden from users, irresistible to bots. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-primary-blue text-white hover:bg-primary-blue/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Invio in corso...
                </>
              ) : (
                "Invia richiesta"
              )}
            </Button>
          </form>

          <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            Hai già un accesso?{" "}
            <Link href="/area-riservata/login" className="font-semibold text-primary-blue hover:underline">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
