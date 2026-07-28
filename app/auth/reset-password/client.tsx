"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MIN_LENGTH = 8

/** Messages for the failure reasons /auth/callback can hand back. */
const CALLBACK_ERRORS: Record<string, string> = {
  exchange:
    "Questo link è stato aperto in un browser diverso da quello che ha richiesto il reset. Richiedi un nuovo link e aprilo sullo stesso dispositivo.",
  expired: "Il link è scaduto o è già stato utilizzato. Richiedine uno nuovo.",
  missing: "Il link non contiene un codice valido. Richiedine uno nuovo.",
  type: "Questo tipo di link non è valido per il reset della password.",
}

type Status = "checking" | "ready" | "invalid" | "done"

export default function ResetPasswordClient({ adminEmail }: { adminEmail: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<Status>("checking")
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Browsers re-attach the fragment after a server redirect, so an implicit-flow
    // link can arrive here carrying usable tokens even though /auth/callback saw
    // no query params and reported "missing". Trust the tokens over that report.
    const hasFragmentTokens =
      typeof window !== "undefined" && /access_token=|refresh_token=/.test(window.location.hash)

    const callbackError = searchParams.get("error")
    if (callbackError && !hasFragmentTokens) {
      setError(CALLBACK_ERRORS[callbackError] ?? CALLBACK_ERRORS.missing)
      setStatus("invalid")
      return
    }

    const supabase = createClient()
    let cancelled = false

    async function resolveSession() {
      // The implicit flow puts the tokens in the URL fragment, which never
      // reaches the server. supabase-js parses it on load and emits the session,
      // so a plain getSession() covers both that case and the cookie set by
      // /auth/callback.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session?.user) {
        setError("Sessione di recupero non trovata. Apri di nuovo il link ricevuto per email o richiedine uno nuovo.")
        setStatus("invalid")
        return
      }

      setEmail(session.user.email ?? null)
      setStatus("ready")
    }

    resolveSession()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)

    if (password.length < MIN_LENGTH) {
      setError(`La password deve contenere almeno ${MIN_LENGTH} caratteri.`)
      return
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.")
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        // Supabase rejects a password identical to the current one, which is a
        // useful thing to say out loud instead of a generic failure.
        setError(
          updateError.message.toLowerCase().includes("different")
            ? "La nuova password deve essere diversa da quella attuale."
            : "Non è stato possibile salvare la password. Riprova.",
        )
        setIsSubmitting(false)
        return
      }

      setStatus("done")
      const destination = email === adminEmail ? "/admin" : "/area-riservata/progetti"
      setTimeout(() => {
        router.replace(destination)
        router.refresh()
      }, 1500)
    } catch {
      setError("Non è stato possibile salvare la password. Riprova.")
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="4BID" width={112} height={70} className="mx-auto h-14 w-auto object-contain" />
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-blue/10">
              <Lock className="h-5 w-5 text-primary-blue" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-brand-navy">Nuova password</h1>
              <p className="text-sm text-muted-foreground">
                {status === "ready" && email ? email : "Scegli una nuova password"}
              </p>
            </div>
          </div>

          {status === "checking" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Verifica del link in corso...
            </p>
          ) : null}

          {status === "invalid" ? (
            <div className="flex flex-col gap-4">
              <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
              <Link
                href="/area-riservata/recupera-password"
                className="text-center text-sm font-semibold text-primary-blue hover:underline"
              >
                Richiedi un nuovo link
              </Link>
            </div>
          ) : null}

          {status === "done" ? (
            <div className="flex flex-col gap-2" role="status">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" aria-hidden="true" />
                Password aggiornata
              </p>
              <p className="text-sm text-muted-foreground">Ti stiamo portando nella tua area riservata...</p>
            </div>
          ) : null}

          {status === "ready" ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Nuova password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Almeno ${MIN_LENGTH} caratteri`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Conferma password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ripeti la password"
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting || !password || !confirm}
                className="mt-2 w-full bg-primary-blue text-white hover:bg-primary-blue/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva password"
                )}
              </Button>
            </form>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/area-riservata/login" className="hover:underline">
            Torna alla login
          </Link>
        </p>
      </div>
    </main>
  )
}
