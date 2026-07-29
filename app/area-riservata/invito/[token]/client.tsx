"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { formatDateIT } from "@/lib/date-utils"

const MIN_PASSWORD_LENGTH = 10

/**
 * Altezza dei campi su telefono.
 *
 * Il valore predefinito di shadcn e' `h-9`, cioe' 36px: misurato su uno schermo
 * da 390px, sotto i 44px che Apple e Google indicano come minimo comodo per il
 * pollice. Questa e' la prima schermata che un cliente invitato vede, e la sbaglia
 * una volta sola: se non riesce a compilarla, non entra.
 *
 * Da `sm` in su torna a 36px, perche' col mouse il bersaglio grande non serve.
 * Il carattere resta a 16px (verificato): sotto quella misura iOS ingrandisce la
 * pagina da solo al primo tocco su un campo.
 */
const CAMPO_MOBILE = "h-11 sm:h-9"

export default function InviteClient({
  token,
  email,
  projectName,
  roleLabel,
  expiresAt,
  signedInEmail,
}: {
  token: string
  email: string
  projectName: string
  roleLabel: string
  expiresAt: string | null
  /** Email della sessione presente in questo browser, se ce n'e' una. */
  signedInEmail: string | null
}) {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [company, setCompany] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [wrongAccount, setWrongAccount] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Conflitto noto GIA' al caricamento: in questo browser c'e' la sessione di
  // un altro indirizzo. Prima lo si scopriva solo dopo aver compilato nome,
  // cognome, azienda e password e premuto "Attiva accesso" — lavoro buttato.
  // Confronto case-insensitive: "F.Mancini@" e "f.mancini@" sono lo stesso
  // account e segnalarli come diversi sarebbe un falso allarme.
  const sessionConflict =
    !!signedInEmail && signedInEmail.trim().toLowerCase() !== email.trim().toLowerCase()

  async function signOutAndRetry() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setWrongAccount(false)
    setError(null)
    router.refresh()
  }

  // Fuso fissato a Europe/Rome dall'helper: senza, una scadenza a tarda sera
  // darebbe un giorno diverso sul server (UTC) e nel browser, con l'errore di
  // idratazione. Qui non si vedeva ancora, ma il difetto era latente.
  const expiry = expiresAt ? formatDateIT(expiresAt, { dateStyle: "long" }) : null

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
        // Another account is signed in in this browser. The server refuses to
        // bind the invitation to it, so offer to sign out and retry instead of
        // leaving the invitee stuck.
        if (data?.code === "wrong_account") setWrongAccount(true)
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
    // flex-1 + pt-24, not min-h-screen: the site header is fixed, so the form
    // would otherwise sit underneath it.
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 pb-16 pt-24">
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

        {sessionConflict ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="text-sm leading-relaxed text-foreground">
              In questo browser risulta collegato{" "}
              <span className="font-medium">{signedInEmail}</span>, mentre questo invito &egrave; per{" "}
              <span className="font-medium">{email}</span>.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Esci dall&apos;altro account per attivare il tuo accesso. L&apos;invito resta valido.
            </p>
            <Button type="button" onClick={signOutAndRetry} className={`mt-4 w-full ${CAMPO_MOBILE}`}>
              Esci e continua come {email}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            {/* Read-only: the address is fixed by the invitation, not chosen here. */}
            <Input id="invite-email" value={email} readOnly disabled className={`bg-muted ${CAMPO_MOBILE}`} />
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-first-name">Nome</Label>
              <Input
                id="invite-first-name"
                className={CAMPO_MOBILE}
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
                className={CAMPO_MOBILE}
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
              className={CAMPO_MOBILE}
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
              className={CAMPO_MOBILE}
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
              className={CAMPO_MOBILE}
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
              {wrongAccount ? (
                <button
                  type="button"
                  onClick={signOutAndRetry}
                  className="mt-1 block font-medium underline"
                >
                  Esci dall&apos;altro account e continua come {email}
                </button>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" className={`w-full ${CAMPO_MOBILE}`} disabled={submitting}>
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
              Questo link &egrave; personale e a uso singolo
              {expiry ? `, valido fino al ${expiry}` : ""}. Non condividerlo.
            </span>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
