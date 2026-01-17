"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const DEV_CREDENTIALS = {
  email: "f.mancini@4bid.it",
  password: "Pippolo75@4bid",
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
  const [isDevOrPreview, setIsDevOrPreview] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      const isDev =
        hostname === "localhost" ||
        hostname.includes("vercel.app") ||
        hostname.includes("v0.dev") ||
        hostname.includes("vusercontent.net")
      setIsDevOrPreview(isDev)
    }
  }, [])

  const handleDevLogin = async () => {
    setEmail(DEV_CREDENTIALS.email)
    setPassword(DEV_CREDENTIALS.password)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: DEV_CREDENTIALS.email,
        password: DEV_CREDENTIALS.password,
      })

      if (error) {
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto nel pannello admin!",
        })
        router.push("/admin")
      }
    } catch (error) {
      console.error("Dev login error:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login form submitted")
    console.log("[v0] Email:", email)
    console.log("[v0] Password length:", password.length)
    setIsLoading(true)

    try {
      if (email !== SUPER_ADMIN_EMAIL) {
        console.log("[v0] Email doesn't match SUPER_ADMIN_EMAIL")
        toast({
          title: "Accesso Negato",
          description: "Non hai i permessi per accedere a questa area.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("[v0] Creating Supabase client...")
      const supabase = createClient()
      console.log("[v0] Attempting sign in...")
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Login error:", error)
        toast({
          title: "Errore di accesso",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("[v0] Login successful, redirecting...")
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto nel pannello admin!",
        })
        router.push("/admin")
      }
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Setting loading to false")
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (email !== SUPER_ADMIN_EMAIL) {
        toast({
          title: "Accesso Negato",
          description: "Non hai i permessi per accedere a questa area.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
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

            {isDevOrPreview && !isResetting && (
              <div className="mt-4 pt-4 border-t border-dashed border-orange-300">
                <Button
                  type="button"
                  onClick={handleDevLogin}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Accesso in corso..." : "🔧 Dev Login (solo dev/preview)"}
                </Button>
                <p className="text-xs text-center text-orange-600 mt-2">Questo pulsante non è visibile in produzione</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
