"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Only relative paths are accepted as a redirect target, so a crafted
   * `?redirect=https://evil.example` cannot turn the login into an open
   * redirect.
   */
  function safeRedirect(): string {
    const raw = searchParams.get("redirect")
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/area-riservata/progetti"
    return raw
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        // Deliberately generic: distinguishing "wrong password" from "unknown
        // account" would let anyone enumerate which clients we work with.
        setError("Credenziali non valide. Verifica email e password.")
        setIsSubmitting(false)
        return
      }

      // Full navigation so the server components re-read the fresh session.
      router.replace(safeRedirect())
      router.refresh()
    } catch {
      setError("Non riusciamo a completare l'accesso. Riprova tra poco.")
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
              <h1 className="text-lg font-bold text-brand-navy">Area Riservata</h1>
              <p className="text-sm text-muted-foreground">Accedi alla tua Project Room</p>
            </div>
          </div>

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

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/area-riservata/recupera-password"
                  className="text-xs font-semibold text-primary-blue hover:underline"
                >
                  Password dimenticata?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={isSubmitting || !email.trim() || !password}
              className="mt-2 w-full bg-primary-blue text-white hover:bg-primary-blue/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>

          <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            Non hai ancora un accesso?{" "}
            <Link href="/area-riservata/richiedi-accesso" className="font-semibold text-primary-blue hover:underline">
              Richiedi l&apos;accesso
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Torna al sito 4BID
          </Link>
        </p>
      </div>
    </main>
  )
}
