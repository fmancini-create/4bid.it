"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Download, FolderKanban, KeyRound, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const MIN_PASSWORD_LENGTH = 10

type Membership = {
  id: string
  name: string
  slug: string
  roleLabel: string
  canDownload: boolean
}

export default function ProfileClient({
  email,
  firstName: initialFirst,
  lastName: initialLast,
  company: initialCompany,
  jobRole: initialJobRole,
  memberships,
}: {
  email: string
  firstName: string
  lastName: string
  company: string
  jobRole: string
  memberships: Membership[]
}) {
  const router = useRouter()

  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [company, setCompany] = useState(initialCompany)
  const [jobRole, setJobRole] = useState(initialJobRole)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    setSavingProfile(true)
    try {
      const res = await fetch("/api/project-room/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, company, job_role: jobRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setProfileError(data?.error ?? "Salvataggio non riuscito.")
        return
      }
      setProfileMessage("Dati aggiornati.")
      router.refresh()
    } catch {
      setProfileError("Errore di rete. Riprova.")
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.`)
      return
    }
    if (password !== confirm) {
      setPasswordError("Le due password non coincidono.")
      return
    }

    setSavingPassword(true)
    try {
      // Handled by Supabase on the client, against the user's own live session:
      // the server never sees the new password.
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setPasswordError(error.message)
        return
      }
      setPassword("")
      setConfirm("")
      setPasswordMessage("Password aggiornata.")
    } catch {
      setPasswordError("Errore di rete. Riprova.")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Il mio profilo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestisci i tuoi dati, la password e i tuoi accessi.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-brand-navy">Dati personali</h2>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="profile-email">Email</Label>
            {/* The address identifies the account and the invitations sent to it,
                so it is not editable from here. */}
            <Input id="profile-email" value={email} readOnly disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Per cambiare indirizzo contatta il tuo referente 4BID.
            </p>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-first-name">Nome</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-last-name">Cognome</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-company">Azienda</Label>
              <Input
                id="profile-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-job-role">Ruolo</Label>
              <Input id="profile-job-role" value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
            </div>
          </div>

          {profileError ? (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {profileError}
            </p>
          ) : null}
          {profileMessage ? (
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <Check className="size-4" aria-hidden="true" />
              {profileMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 size-4" aria-hidden="true" />
            )}
            Salva modifiche
          </Button>
        </form>

        <div className="flex flex-col gap-6">
          <form onSubmit={changePassword} className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-brand-navy">Password</h2>

            <div className="mb-4 flex flex-col gap-1.5">
              <Label htmlFor="profile-password">Nuova password</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
              />
              <p className="text-xs text-muted-foreground">Almeno {MIN_PASSWORD_LENGTH} caratteri.</p>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              <Label htmlFor="profile-password-confirm">Conferma password</Label>
              <Input
                id="profile-password-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {passwordError ? (
              <p role="alert" className="mb-3 text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}
            {passwordMessage ? (
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check className="size-4" aria-hidden="true" />
                {passwordMessage}
              </p>
            ) : null}

            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="mr-2 size-4" aria-hidden="true" />
              )}
              Aggiorna password
            </Button>
          </form>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-brand-navy">I miei accessi</h2>
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Il tuo account non è associato a nessun progetto.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {memberships.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        href={`/area-riservata/progetti/${m.slug}`}
                        className="font-medium text-brand-navy hover:underline"
                      >
                        {m.name}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                          {m.roleLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Download className="size-3" aria-hidden="true" />
                          {m.canDownload ? "Download consentito" : "Solo visualizzazione"}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-4">
              <Link href="/area-riservata/progetti">
                <FolderKanban className="mr-2 size-4" aria-hidden="true" />
                Vai ai progetti
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
