"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { KeyRound, Loader2, AlertCircle, MailCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RecuperaPasswordClient() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      // Always route through /auth/callback: it exchanges the token server-side
      // so the session cookie exists before any guarded page is requested.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })

      // Only a transport/config failure is surfaced. An unknown address must
      // look exactly like a known one, otherwise this becomes a way to check
      // which clients we work with.
      if (resetError && !/user not found/i.test(resetError.message)) {
        console.log("[v0] resetPasswordForEmail failed:", resetError.message)
        setError("Non riusciamo a inviare l'email in questo momento. Riprova tra poco.")
        setIsSubmitting(false)
        return
      }

      setSent(true)
    } catch {
      setError("Non riusciamo a inviare l'email in questo momento. Riprova tra poco.")
    } finally {
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
              <KeyRound className="h-5 w-5 text-primary-blue" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-brand-navy">Password dimenticata</h1>
              <p className="text-sm text-muted-foreground">Ti inviamo un link per reimpostarla</p>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col gap-4" role="status">
              <p className="flex items-start gap-2 rounded-md bg-primary-blue/10 p-3 text-sm text-brand-navy">
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-blue" aria-hidden="true" />
                Se esiste un account associato a <strong>{email.trim()}</strong>, riceverai un&apos;email con il link per
                impostare una nuova password.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Apri il link dallo stesso browser da cui hai fatto la richiesta. Se non lo trovi, controlla la cartella
                spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
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
                disabled={isSubmitting || !email.trim()}
                className="mt-2 w-full bg-primary-blue text-white hover:bg-primary-blue/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Invio in corso...
                  </>
                ) : (
                  "Invia il link"
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <Link href="/area-riservata/login" className="font-semibold text-primary-blue hover:underline">
              Torna alla login
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
