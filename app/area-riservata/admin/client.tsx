"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Inbox, Loader2, ScrollText, Send, ShieldOff, Trash2, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { INVITABLE_ROLES } from "@/lib/project-room/invitations"
import { ROLE_LABELS } from "@/lib/project-room/types"

type AccessRequest = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  company: string | null
  phone: string | null
  job_role: string | null
  message: string | null
  status: string
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

type Invitation = {
  id: string
  email: string
  role: string
  can_download: boolean
  expires_at: string | null
  accepted_at: string | null
  revoked_at: string | null
  created_at: string
  project_name: string
}

type ProjectMember = {
  user_id: string
  role: string
  can_download: boolean
  name: string
  email: string | null
}

type ProjectWithMembers = {
  id: string
  name: string
  status: string
  members: ProjectMember[]
}

type AuditEntry = {
  id: string
  action: string
  entity_type: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  actor: string
}

/** Written for durability, already surfaced in their own columns. */
const INTERNAL_METADATA_KEYS = new Set(["actor_email", "project_name"])

/**
 * Renders audit metadata as readable pairs. Raw `JSON.stringify` output is
 * unreadable in a table and hides the values that matter during a review.
 */
function describeMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—"
  const parts = Object.entries(metadata)
    .filter(([key]) => !INTERNAL_METADATA_KEYS.has(key))
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
  return parts.length > 0 ? parts.join(" · ") : "—"
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fullName(r: AccessRequest) {
  return [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email
}

function invitationState(i: Invitation) {
  if (i.revoked_at) return { label: "Revocato", tone: "text-muted-foreground" }
  if (i.accepted_at) return { label: "Accettato", tone: "text-emerald-700" }
  if (i.expires_at && new Date(i.expires_at).getTime() <= Date.now())
    return { label: "Scaduto", tone: "text-amber-700" }
  return { label: "In attesa", tone: "text-primary-blue" }
}

export default function AdminClient({
  requests,
  projects,
  projectsWithMembers,
  invitations,
  auditEntries,
  auditTotal,
}: {
  requests: AccessRequest[]
  projects: { id: string; name: string; status: string }[]
  projectsWithMembers: ProjectWithMembers[]
  invitations: Invitation[]
  auditEntries: AuditEntry[]
  auditTotal: number
  auditPageSize?: number
}) {
  const router = useRouter()
  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests])
  const handled = useMemo(() => requests.filter((r) => r.status !== "pending"), [requests])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Amministrazione</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Richieste di accesso, inviti e registro attività della Project Room.
        </p>
      </div>

      <Tabs defaultValue="requests">
        {/* Labels stay short so they are not clipped on narrow screens. */}
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="requests">
            Richieste
            {pending.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-primary-blue px-1.5 text-[11px] font-bold text-white">
                {pending.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="projects">Accessi</TabsTrigger>
          <TabsTrigger value="invitations">Inviti</TabsTrigger>
          <TabsTrigger value="audit">Registro</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Inbox className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold text-brand-navy">Nessuna richiesta da valutare</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Le nuove richieste inviate dal sito compaiono qui.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {pending.map((request) => (
                <RequestCard key={request.id} request={request} projects={projects} onDone={() => router.refresh()} />
              ))}
            </ul>
          )}

          {handled.length > 0 ? (
            <div className="mt-10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Già gestite
              </h2>
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-border bg-secondary/50 text-left">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Richiedente</th>
                      <th className="px-4 py-2 font-semibold">Email</th>
                      <th className="px-4 py-2 font-semibold">Esito</th>
                      <th className="px-4 py-2 font-semibold">Data</th>
                      <th className="px-4 py-2 font-semibold">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handled.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-medium text-brand-navy">{fullName(r)}</td>
                        <td className="px-4 py-2 text-muted-foreground">{r.email}</td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              r.status === "approved"
                                ? "font-semibold text-emerald-700"
                                : "font-semibold text-muted-foreground"
                            }
                          >
                            {r.status === "approved" ? "Approvata" : "Rifiutata"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(r.reviewed_at)}</td>
                        <td className="max-w-[18rem] truncate px-4 py-2 text-muted-foreground">
                          {r.review_note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="projects">
          <p className="mb-4 text-sm text-muted-foreground">
            Accessi già attivi. Il ruolo e il permesso di download si possono cambiare in qualsiasi momento e la revoca
            è immediata: senza questa schermata l&apos;accesso deciso in fase di approvazione resterebbe per sempre.
          </p>
          {projectsWithMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Users className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold text-brand-navy">Nessun progetto</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {projectsWithMembers.map((project) => (
                <section key={project.id} className="rounded-xl border border-border bg-card">
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <h2 className="font-semibold text-brand-navy">{project.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {project.members.length === 1 ? "1 persona" : `${project.members.length} persone`}
                    </span>
                  </header>
                  {project.members.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Nessun accesso attivo su questo progetto.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="border-b border-border bg-secondary/50 text-left">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Persona</th>
                            <th className="px-4 py-2 font-semibold">Ruolo</th>
                            <th className="px-4 py-2 font-semibold">Download</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {project.members.map((member) => (
                            <MemberRow
                              key={member.user_id}
                              projectId={project.id}
                              member={member}
                              onDone={() => router.refresh()}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations">
          <InviteForm projects={projects} onDone={() => router.refresh()} />

          <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Inviti emessi
          </h2>
          {invitations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Send className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold text-brand-navy">Nessun invito emesso</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-border bg-secondary/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Email</th>
                    <th className="px-4 py-2 font-semibold">Progetto</th>
                    <th className="px-4 py-2 font-semibold">Ruolo</th>
                    <th className="px-4 py-2 font-semibold">Download</th>
                    <th className="px-4 py-2 font-semibold">Stato</th>
                    <th className="px-4 py-2 font-semibold">Scadenza</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <InvitationRow key={invitation.id} invitation={invitation} onDone={() => router.refresh()} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit">
          {auditEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <ScrollText className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold text-brand-navy">Registro vuoto</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border bg-secondary/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Quando</th>
                    <th className="px-4 py-2 font-semibold">Chi</th>
                    <th className="px-4 py-2 font-semibold">Azione</th>
                    <th className="px-4 py-2 font-semibold">Oggetto</th>
                    <th className="px-4 py-2 font-semibold">Dettagli</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-brand-navy">{entry.actor}</td>
                      <td className="px-4 py-2 font-mono text-xs font-medium text-brand-navy">{entry.action}</td>
                      <td className="px-4 py-2 text-muted-foreground">{entry.entity_type ?? "—"}</td>
                      <td className="max-w-[20rem] truncate px-4 py-2 text-xs text-muted-foreground">
                        {describeMetadata(entry.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {auditEntries.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {auditTotal > auditEntries.length
                ? `Ultime ${auditEntries.length} voci di ${auditTotal} totali. Le voci piu vecchie non sono mostrate in questa schermata.`
                : `${auditTotal} voci in totale.`}{" "}
              Indirizzo IP e browser sono registrati ma non vengono mostrati.
            </p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Invite a client who never asked for access.
 *
 * Before this existed an invitation could only be produced by approving an
 * incoming request, so the client had to discover the site and apply first —
 * 4Bid could not start the conversation at all.
 *
 * The result panel always shows the link, even when the email was sent
 * successfully: the message can land in spam, and an invitation that only ever
 * existed inside a mail server is one nobody can chase.
 */
function InviteForm({
  projects,
  onDone,
}: {
  projects: { id: string; name: string; status: string }[]
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "")
  const [role, setRole] = useState<string>("reader")
  const [canDownload, setCanDownload] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{
    url: string
    email: string
    project_name: string
    emailSent: boolean
    emailError?: string
    replacedPrevious: number
  } | null>(null)

  async function submit() {
    setError(null)
    if (!email.trim()) {
      setError("Inserisci l'email della persona da invitare.")
      return
    }
    if (!projectId) {
      setError("Nessun progetto disponibile a cui associare l'invito.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/project-room/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          project_id: projectId,
          role,
          can_download: canDownload,
          note: note.trim() || null,
          send_email: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "Invito non creato.")
        return
      }
      setResult({
        url: data.invitation.url,
        email: data.invitation.email,
        project_name: data.invitation.project_name,
        emailSent: Boolean(data.email?.sent),
        emailError: data.email?.error,
        replacedPrevious: Number(data.replaced_previous ?? 0),
      })
      // Refresh straight away: waiting until the panel is closed left the list
      // below reading "Nessun invito emesso" directly under a confirmation that
      // one had just been created.
      onDone()
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setResult(null)
    setEmail("")
    setNote("")
    setCanDownload(false)
    setRole("reader")
    setOpen(false)
    onDone()
  }

  if (result) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-emerald-900">
          <Check className="size-4" aria-hidden="true" />
          Invito creato per {result.email}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          {result.emailSent
            ? `Email inviata a ${result.email} con l'accesso al progetto ${result.project_name}.`
            : "L'invito è valido, ma l'email non è partita: inoltra il link qui sotto manualmente."}
        </p>
        {!result.emailSent && result.emailError ? (
          <p className="mt-1 text-xs text-emerald-900">Motivo: {result.emailError}</p>
        ) : null}
        {result.replacedPrevious > 0 ? (
          <p className="mt-1 text-xs text-emerald-900">
            {result.replacedPrevious === 1
              ? "L'invito precedente ancora valido è stato revocato: solo questo link funziona."
              : `${result.replacedPrevious} inviti precedenti sono stati revocati: solo questo link funziona.`}
          </p>
        ) : null}

        <p className="mt-3 text-sm font-medium text-emerald-900">
          Link mostrato una sola volta: non è memorizzato e non potrà essere recuperato.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={result.url} className="bg-card font-mono text-xs" aria-label="Link di invito" />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result.url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {
                setError("Copia non riuscita: seleziona il testo manualmente.")
              }
            }}
          >
            {copied ? (
              <>
                <Check className="mr-2 size-4" aria-hidden="true" />
                Copiato
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" aria-hidden="true" />
                Copia
              </>
            )}
          </Button>
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={reset}>
          Ho finito, chiudi
        </Button>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div className="min-w-0">
          <p className="font-semibold text-brand-navy">Invita un cliente</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Serve per dare accesso a chi non ha compilato il modulo sul sito. Riceve l&apos;email con il link e tu
            mantieni una copia del link da inoltrare.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)} disabled={projects.length === 0}>
          <Send className="mr-2 size-4" aria-hidden="true" />
          Nuovo invito
        </Button>
        {projects.length === 0 ? (
          <p className="w-full text-sm text-muted-foreground">
            Nessun progetto disponibile: creane uno prima di invitare.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-semibold text-brand-navy">Nuovo invito</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email del cliente</Label>
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@azienda.it"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-project">Progetto</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="invite-project">
              <SelectValue placeholder="Seleziona" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role">Ruolo</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-note">Messaggio per il cliente</Label>
          <Input
            id="invite-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Facoltativo, compare nell'email"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={canDownload} onCheckedChange={(v) => setCanDownload(v === true)} />
        Consenti il download dei PDF
      </label>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={submit} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="mr-2 size-4" aria-hidden="true" />
          )}
          Crea e invia invito
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Annulla
        </Button>
      </div>
    </div>
  )
}

function RequestCard({
  request,
  projects,
  onDone,
}: {
  request: AccessRequest
  projects: { id: string; name: string; status: string }[]
  onDone: () => void
}) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "")
  const [role, setRole] = useState<string>("reader")
  const [canDownload, setCanDownload] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function submit(action: "approve" | "reject") {
    setError(null)
    if (action === "approve" && !projectId) {
      setError("Nessun progetto disponibile a cui associare l'utente.")
      return
    }
    setBusy(action)
    try {
      const res = await fetch(`/api/project-room/admin/access-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          review_note: note || null,
          ...(action === "approve" ? { project_id: projectId, role, can_download: canDownload } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // 409 = the request is no longer pending: another admin handled it, or
        // this tab has simply been open for a while. Showing the error alone
        // left the card stuck with live buttons and the counter still showing
        // it, so the only way out was a manual reload. Reload the list instead:
        // the stale card disappears on its own.
        if (res.status === 409) {
          setError("Questa richiesta è già stata gestita altrove. Aggiorno l'elenco…")
          onDone()
          return
        }
        setError(data?.error ?? "Operazione non riuscita.")
        return
      }
      if (action === "approve" && data?.invitation?.url) {
        // Shown once: the raw token is not stored anywhere.
        setInviteUrl(data.invitation.url)
      } else {
        onDone()
      }
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setBusy(null)
    }
  }

  if (inviteUrl) {
    return (
      <li className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-emerald-900">
          <Check className="size-4" aria-hidden="true" />
          Richiesta approvata
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          Inoltra questo link a <span className="font-medium">{request.email}</span>. Viene mostrato una sola volta: per
          sicurezza non è memorizzato e non potrà essere recuperato.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={inviteUrl} className="bg-card font-mono text-xs" aria-label="Link di invito" />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(inviteUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {
                setError("Copia non riuscita: seleziona il testo manualmente.")
              }
            }}
          >
            {copied ? (
              <>
                <Check className="mr-2 size-4" aria-hidden="true" />
                Copiato
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" aria-hidden="true" />
                Copia
              </>
            )}
          </Button>
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={onDone}>
          Ho salvato il link, chiudi
        </Button>
      </li>
    )
  }

  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-brand-navy">{fullName(request)}</p>
          <p className="text-sm text-muted-foreground">{request.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[request.company, request.job_role, request.phone].filter(Boolean).join(" · ") || "Nessun dato aggiuntivo"}
          </p>
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(request.created_at)}</span>
      </div>

      {request.message ? (
        <p className="mt-3 rounded-md bg-secondary/60 p-3 text-sm leading-relaxed text-foreground">{request.message}</p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`project-${request.id}`}>Progetto</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id={`project-${request.id}`}>
              <SelectValue placeholder="Seleziona" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`role-${request.id}`}>Ruolo</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id={`role-${request.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`note-${request.id}`}>Nota interna</Label>
          <Input
            id={`note-${request.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Facoltativa"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={canDownload} onCheckedChange={(v) => setCanDownload(v === true)} />
        Consenti il download dei PDF
      </label>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => submit("approve")} disabled={busy !== null}>
          {busy === "approve" ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="mr-2 size-4" aria-hidden="true" />
          )}
          Approva e genera invito
        </Button>
        <Button type="button" variant="outline" onClick={() => submit("reject")} disabled={busy !== null}>
          {busy === "reject" ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <X className="mr-2 size-4" aria-hidden="true" />
          )}
          Rifiuta
        </Button>
      </div>
    </li>
  )
}

/**
 * One active membership, with the role and download controls.
 *
 * Both actions call the server: `pr_project_members` grants no UPDATE to
 * `authenticated`, so the browser genuinely cannot write these values itself.
 * The UI never optimistically re-renders a permission — it waits for the server
 * to confirm, because showing a role that was not actually saved is exactly the
 * kind of thing that gets someone the wrong document.
 */
function MemberRow({
  projectId,
  member,
  onDone,
}: {
  projectId: string
  member: ProjectMember
  onDone: () => void
}) {
  const [busy, setBusy] = useState<"role" | "download" | "remove" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const endpoint = `/api/project-room/admin/projects/${projectId}/members/${member.user_id}`
  const editableRole = (INVITABLE_ROLES as readonly string[]).includes(member.role)

  async function patch(body: Record<string, unknown>, kind: "role" | "download") {
    setError(null)
    setBusy(kind)
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "Modifica non riuscita.")
        return
      }
      onDone()
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setError(null)
    setBusy("remove")
    try {
      const res = await fetch(endpoint, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "Revoca non riuscita.")
        return
      }
      onDone()
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setBusy(null)
      setConfirming(false)
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">
        <span className="block font-medium text-brand-navy">{member.name}</span>
        <span className="block text-xs text-muted-foreground">{member.email ?? "—"}</span>
        {error ? (
          <span role="alert" className="mt-1 block text-xs text-destructive">
            {error}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-2">
        {editableRole ? (
          <Select
            value={member.role}
            onValueChange={(value) => {
              if (value !== member.role) void patch({ role: value }, "role")
            }}
            disabled={busy !== null}
          >
            <SelectTrigger className="w-[11rem]" aria-label={`Ruolo di ${member.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          // `admin` is not in INVITABLE_ROLES, so rendering it in the Select
          // would show an empty trigger. Shown as read-only text instead: a
          // project administrator is not something to demote by mis-click.
          <span className="inline-flex flex-col">
            <span className="font-medium text-brand-navy">
              {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role}
            </span>
            <span className="text-xs text-muted-foreground">Non modificabile qui</span>
          </span>
        )}
      </td>
      <td className="px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={member.can_download}
            disabled={busy !== null}
            onCheckedChange={(v) => void patch({ can_download: v === true }, "download")}
            aria-label={`Consenti il download a ${member.name}`}
          />
          {busy === "download" ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <span className="text-muted-foreground">{member.can_download ? "Sì" : "No"}</span>
          )}
        </label>
      </td>
      <td className="whitespace-nowrap px-4 py-2 text-right">
        {confirming ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Revocare?</span>
            {/* Every row renders the same visible words, so the accessible name
                has to carry the person: an irreversible action must never read
                as a bare "Revoca" repeated once per member. */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={remove}
              disabled={busy !== null}
              aria-label={`Conferma la revoca dell'accesso di ${member.name}`}
            >
              {busy === "remove" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Sì, revoca"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={busy !== null}
              aria-label={`Annulla la revoca dell'accesso di ${member.name}`}
            >
              Annulla
            </Button>
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            disabled={busy !== null}
            aria-label={`Revoca l'accesso di ${member.name}`}
          >
            <Trash2 className="mr-2 size-4" aria-hidden="true" />
            Revoca
          </Button>
        )}
      </td>
    </tr>
  )
}

function InvitationRow({ invitation, onDone }: { invitation: Invitation; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const state = invitationState(invitation)
  const revocable = !invitation.accepted_at && !invitation.revoked_at
  // Accepted invitations are done: the person is a member, so resending is
  // meaningless. Everything else (pending, expired, revoked) can be resent.
  const resendable = !invitation.accepted_at

  async function revoke() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/project-room/admin/invitations/${invitation.id}`, { method: "DELETE" })
      if (res.ok) {
        onDone()
        return
      }
      // Previously the failure was swallowed and the row just sat there. Now the
      // reason is shown, and the list refreshes when the server says the row has
      // already moved on.
      const payload = await res.json().catch(() => null)
      setError(payload?.error ?? "Revoca non riuscita.")
      if (res.status === 404 || res.status === 409) onDone()
    } catch {
      setError("Revoca non riuscita: controlla la connessione.")
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <ResendInvitationRow
        invitation={invitation}
        onCancel={() => setEditing(false)}
        onDone={() => {
          setEditing(false)
          onDone()
        }}
      />
    )
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium text-brand-navy">
        {invitation.email}
        {error ? (
          <span className="mt-1 block text-xs font-normal text-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-2 text-muted-foreground">{invitation.project_name}</td>
      <td className="px-4 py-2 text-muted-foreground">
        {ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS] ?? invitation.role}
      </td>
      <td className="px-4 py-2 text-muted-foreground">{invitation.can_download ? "Sì" : "No"}</td>
      <td className={`px-4 py-2 font-semibold ${state.tone}`}>{state.label}</td>
      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{formatDate(invitation.expires_at)}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {resendable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null)
                setEditing(true)
              }}
              disabled={busy}
              aria-label={`Reinvia o modifica l'invito di ${invitation.email}`}
            >
              <Send className="mr-2 size-4" aria-hidden="true" />
              Reinvia
            </Button>
          ) : null}
          {revocable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={revoke}
              disabled={busy}
              aria-label={`Revoca l'invito di ${invitation.email}`}
            >
              {busy ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldOff className="mr-2 size-4" aria-hidden="true" />
              )}
              Revoca
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

/**
 * Inline editor for resending an invitation.
 *
 * The one thing this panel must never do is imply the old link still works. The
 * server decides whether the link is reused or rotated (changing the address
 * always rotates it, because the previous recipient would otherwise keep access
 * to a confidential project), and the outcome is reported verbatim afterwards.
 */
function ResendInvitationRow({
  invitation,
  onCancel,
  onDone,
}: {
  invitation: Invitation
  onCancel: () => void
  onDone: () => void
}) {
  const [email, setEmail] = useState(invitation.email)
  const [role, setRole] = useState(invitation.role)
  const [canDownload, setCanDownload] = useState(invitation.can_download === true)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; rotated: boolean; emailSent: boolean; emailError: string | null } | null>(
    null,
  )

  const emailChanged = email.trim().toLowerCase() !== invitation.email

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/project-room/admin/invitations/${invitation.id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role, can_download: canDownload, note: note.trim() || null }),
      })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        setError(payload?.error ?? "Reinvio non riuscito.")
        // The invitation was accepted or deleted meanwhile: refresh so the row
        // stops offering an action that can no longer work.
        if (res.status === 404 || res.status === 409) onDone()
        return
      }

      setResult({
        url: payload.url,
        rotated: payload.link_rotated === true,
        emailSent: payload.email_sent === true,
        emailError: payload.email_error ?? null,
      })
    } catch {
      setError("Reinvio non riuscito: controlla la connessione.")
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <tr className="border-b border-border bg-muted/40 last:border-0">
        <td colSpan={7} className="px-4 py-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-brand-navy">
              Invito reinviato a {email.trim().toLowerCase()}
            </p>

            <p className="text-sm text-muted-foreground">
              {result.rotated
                ? "È stato generato un link nuovo: quello precedente non funziona più."
                : "È stato reinviato lo stesso link di prima, che resta valido."}
            </p>

            {/* "Consegnata" sarebbe una promessa che non possiamo mantenere: il
                servizio di posta conferma di aver PRESO IN CARICO il messaggio, non
                che sia arrivato nella posta in arrivo. Due inviti reali risultavano
                accettati e non sono mai stati letti (probabilmente in Promozioni o
                Spam), quindi il link resta sempre in vista come rimedio certo. */}
            {result.emailSent ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-emerald-700">Email consegnata al servizio di posta.</span> Se non la
                trova, chiedi di controllare Spam e Promozioni, oppure mandagli direttamente il link qui sotto.
              </p>
            ) : (
              <p className="text-sm text-destructive" role="alert">
                Email non inviata{result.emailError ? `: ${result.emailError}` : ""}. Copia il link qui sotto e invialo a
                mano.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 truncate rounded border border-border bg-background px-3 py-2 text-xs">
                {result.url}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(result.url)}
              >
                Copia link
              </Button>
              <Button type="button" size="sm" onClick={onDone}>
                Chiudi
              </Button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border bg-muted/40 last:border-0">
      <td colSpan={7} className="px-4 py-4">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-brand-navy">Reinvia invito</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`resend-email-${invitation.id}`}>Email</Label>
              <Input
                id={`resend-email-${invitation.id}`}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`resend-role-${invitation.id}`}>Ruolo</Label>
              {/* INVITABLE_ROLES, not every label: the server rejects anything else,
                  so offering a wider list would only produce a confusing error. */}
              <Select value={role} onValueChange={setRole} disabled={busy}>
                <SelectTrigger id={`resend-role-${invitation.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`resend-note-${invitation.id}`}>Nota (facoltativa)</Label>
              <Input
                id={`resend-note-${invitation.id}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={busy}
                placeholder="Mostrata nell'email"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={canDownload}
              onCheckedChange={(checked) => setCanDownload(checked === true)}
              disabled={busy}
            />
            Può scaricare i PDF
          </label>

          {/* Stated BEFORE sending, not after: changing the address must revoke the
              old link, and the admin has to know that in advance. */}
          <p className="text-sm text-muted-foreground">
            {emailChanged
              ? "Hai modificato l'indirizzo: verrà generato un link nuovo e quello inviato prima smetterà di funzionare."
              : "Verrà reinviato lo stesso link, se ancora recuperabile; altrimenti ne verrà creato uno nuovo (te lo diremo)."}
          </p>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Invio…
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" aria-hidden="true" />
                  Reinvia invito
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              Annulla
            </Button>
          </div>
        </div>
      </td>
    </tr>
  )
}
