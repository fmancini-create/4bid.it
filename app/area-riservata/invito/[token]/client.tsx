"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const MIN_PASSWORD_LENGTH = 10

export default function InviteClient({
  token,
  email,
  projectName,
  roleLabel,
  expiresAt,
}: {
  token: string
  email: string
  projectName: string
  roleLabel: string
  expiresAt: string | null
}) {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [company, setCompany] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : null

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.`)
      return
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/project-room/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          first_name: firstName,
          last_name: lastName,
          company,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (data?.code === "login_required") setNeedsLogin(true)
        setError(data?.error ?? "Impossibile completare l'invito.")
        return
      }

      // The account was just created; establish the session in this browser.
      if (data?.needs_sign_in) {
        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError("Account creato. Ora accedi con le tue credenziali.")
          router.push("/area-riservata/login")
          return
        }
      }

      router.push("/area-riservata/progetti")
      router.refresh()
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Invito riservato
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground text-balance">
            Attiva il tuo accesso
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sei stato invitato al progetto <span className="font-medium text-foreground">{projectName}</span> con il
            ruolo di <span className="font-medium text-foreground">{roleLabel}</span>.
          </p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            {/* Read-only: the address is fixed by the invitation, not chosen here. */}
            <Input id="invite-email" value={email} readOnly disabled className="bg-muted" />
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-first-name">Nome</Label>
              <Input
                id="invite-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-last-name">Cognome</Label>
              <Input
                id="invite-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="invite-company">Azienda</Label>
            <Input
              id="invite-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoComplete="organization"
              placeholder="Facoltativa"
            />
          </div>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="invite-password">Password</Label>
            <Input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
            <p className="text-xs text-muted-foreground">Almeno {MIN_PASSWORD_LENGTH} caratteri.</p>
          </div>

          <div className="mb-5 flex flex-col gap-1.5">
            <Label htmlFor="invite-confirm">Conferma password</Label>
            <Input
              id="invite-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
              {needsLogin ? (
                <Link href="/area-riservata/login" className="mt-1 block font-medium underline">
                  Vai al login
                </Link>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Attivazione…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                Attiva accesso
              </>
            )}
          </Button>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Questo link e personale e a uso singolo{expiry ? `, valido fino al ${expiry}` : ""}. Non condividerlo.
            </span>
          </p>
        </form>
      </div>
    </main>
  )
}
