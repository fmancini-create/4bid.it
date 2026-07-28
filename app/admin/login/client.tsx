"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

/**
 * Clears any Supabase auth cookie left over on this host, including the numbered
 * chunks (`...auth-token.0`, `.1`) written when a session was too big for one
 * cookie. A stale or truncated leftover is unreadable server-side, so the proxy
 * guarding /admin bounces back to this page while the browser SDK still holds a
 * valid session in memory and reports success.
 */
function clearStaleAuthCookies() {
  if (typeof document === "undefined") return
  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((n) => n.startsWith("sb-") && n.includes("auth-token"))

  for (const name of names) {
    for (const domain of [undefined, window.location.hostname, `.${window.location.hostname.replace(/^www\./, "")}`]) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? `; domain=${domain}` : ""}`
    }
  }
}

/** Asks the SERVER whether it can read the session the SDK just established. */
async function serverSeesSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/session", { cache: "no-store", credentials: "same-origin" })
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data?.authenticated && data?.isSuperAdmin)
  } catch {
    return false
  }
}

interface ClientLoginPageProps {
  SUPER_ADMIN_EMAIL: string
}

export default function ClientLoginPage({ SUPER_ADMIN_EMAIL }: ClientLoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Case-insensitive: the exact comparison used to reject "F.Mancini@4bid.it"
      // even though Supabase treats it as the very same account.
      if (email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        toast({
          title: "Accesso Negato",
          description: "Non hai i permessi per accedere a questa area.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const supabase = createClient()

      // A leftover cookie from an earlier session would otherwise survive the new
      // sign-in and keep the server from reading it.
      clearStaleAuthCookies()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Do not announce success on the SDK's word alone: confirm the server can
      // actually read the session, otherwise the guard on /admin sends the user
      // straight back here and the "Accesso effettuato" message is a lie.
      const confirmed = (await serverSeesSession()) || (await serverSeesSession())

      if (!confirmed) {
        await supabase.auth.signOut()
        clearStaleAuthCookies()
        toast({
          title: "Sessione non registrata dal browser",
          description:
            "Le credenziali sono corrette, ma il cookie di sessione non è stato accettato. Disattiva il blocco dei cookie per www.4bid.it (o esci dalla navigazione in incognito) e riprova.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nel pannello admin!",
      })

      // Full page load, not router.push: a client-side navigation can replay the
      // redirect-to-login that Next cached while the user was still signed out.
      const target = new URLSearchParams(window.location.search).get("redirect")
      window.location.replace(target?.startsWith("/admin") ? target : "/admin")
      return
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        toast({
          title: "Accesso Negato",
          description: "Non hai i permessi per accedere a questa area.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      // Must NOT point at /admin/*: the proxy guards those paths by session, so
      // the recovery link used to be bounced straight back to this login page.
      // /auth/callback exchanges the token server-side, then hands over to the
      // form under /auth which is reachable without a session.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })

      if (error) {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Email Inviata",
          description: "Controlla la tua casella email per il link di reset della password.",
        })
        setIsResetting(false)
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="4bid Logo" width={120} height={60} />
            </div>
            <CardTitle className="text-2xl">{isResetting ? "Recupera Password" : "Accesso Amministratore"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={isResetting ? handlePasswordReset : handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@dominio.it"
                  required
                  disabled={isLoading}
                />
              </div>
              {!isResetting && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading
                  ? isResetting
                    ? "Invio in corso..."
                    : "Accesso in corso..."
                  : isResetting
                    ? "Invia Link di Reset"
                    : "Accedi"}
              </Button>
              <button
                type="button"
                onClick={() => setIsResetting(!isResetting)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
                disabled={isLoading}
              >
                {isResetting ? "Torna al Login" : "Password Dimenticata?"}
              </button>
            </form>

          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
