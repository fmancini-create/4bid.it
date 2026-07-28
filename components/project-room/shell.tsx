"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, User, FolderKanban, Loader2, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { displayName, initials, type Profile } from "@/lib/project-room/types"

/**
 * Header of the reserved area.
 *
 * Logout is always reachable, including on mobile: it lives inside the user
 * dropdown, which is rendered at every breakpoint rather than hidden behind a
 * `hidden md:flex` nav.
 */
export function ProjectRoomShell({
  profile,
  children,
  breadcrumb,
  isAdmin = false,
}: {
  profile: Profile | null
  children: React.ReactNode
  breadcrumb?: React.ReactNode
  /**
   * Shows the admin entry point. Cosmetic only: `/area-riservata/admin` and its
   * API re-check `requireOrgAdmin()` server-side, so passing `true` here does
   * not grant anything.
   */
  isAdmin?: boolean
}) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace("/area-riservata/login")
      router.refresh()
    } catch {
      setIsLoggingOut(false)
    }
  }

  // displayName() answers "Utente rimosso" for a null profile, which is right for
  // a comment author whose account is gone (the FKs are ON DELETE SET NULL) but
  // alarming here: this shell always renders for the signed-in viewer, so a
  // missing profile row would tell you your own account was deleted.
  const name = profile ? displayName(profile) : "Il mio account"

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/area-riservata/progetti" className="shrink-0">
              <Image src="/logo.png" alt="4BID" width={72} height={45} className="h-9 w-auto object-contain" />
            </Link>
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <span className="hidden shrink-0 text-sm font-semibold text-brand-navy sm:block">Project Room</span>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/area-riservata/progetti">
                <FolderKanban className="mr-2 h-4 w-4" aria-hidden="true" />
                Progetti
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Menu utente"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-blue text-xs font-bold text-white">
                    {initials(profile)}
                  </span>
                  <span className="hidden max-w-[10rem] truncate text-sm font-medium text-brand-navy sm:block">
                    {name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate font-semibold">{name}</span>
                  {profile?.email ? (
                    <span className="truncate text-xs font-normal text-muted-foreground">{profile.email}</span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/area-riservata/progetti">
                    <FolderKanban className="mr-2 h-4 w-4" aria-hidden="true" />
                    I miei progetti
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/area-riservata/profilo">
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Il mio profilo
                  </Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/area-riservata/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                      Amministrazione
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {breadcrumb ? (
          <div className="border-t border-border bg-card">
            <div className="mx-auto w-full max-w-7xl px-4 py-2">{breadcrumb}</div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-border bg-card py-4">
        <p className="mx-auto max-w-7xl px-4 text-xs text-muted-foreground">
          Area riservata 4BID SRL · I documenti condivisi sono riservati e non divulgabili.
        </p>
      </footer>
    </div>
  )
}
