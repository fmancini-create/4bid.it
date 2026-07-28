"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FolderOpen, LogOut, ShieldAlert } from "lucide-react"

/**
 * The back office and the client Project Room live on the same domain and so
 * share one Supabase session cookie. Signed in as a client, /admin used to
 * render a bare red "Accesso Negato" with no link, no logout and no way back:
 * a dead end reachable in one click from the header. Stating which account is
 * active explains the refusal, and offering to switch account makes it
 * recoverable without clearing cookies by hand.
 */
export default function AdminAccessDenied({ email }: { email?: string | null }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSwitchAccount = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("[v0] Switch account error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-foreground">Questo account non ha accesso all&apos;area admin</h1>

        <p className="mb-6 leading-relaxed text-muted-foreground">
          {email ? (
            <>
              Sei autenticato come <span className="font-semibold text-foreground">{email}</span>. Il Pannello Admin è
              riservato all&apos;amministratore 4BID.
            </>
          ) : (
            <>Il Pannello Admin è riservato all&apos;amministratore 4BID.</>
          )}
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={handleSwitchAccount} disabled={isLoading} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? "Uscita in corso..." : "Esci e accedi come amministratore"}
          </Button>

          <Link href="/area-riservata" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              <FolderOpen className="mr-2 h-4 w-4" />
              Vai alla Project Room
            </Button>
          </Link>

          <Link
            href="/"
            className="mt-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Torna al sito
          </Link>
        </div>
      </div>
    </div>
  )
}
