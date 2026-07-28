"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Inbox, Loader2, ScrollText, Send, ShieldOff, X } from "lucide-react"

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

type AuditEntry = {
  id: string
  action: string
  entity_type: string | null
  metadata: Record<string, unknown> | null
  created_at: string
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
  invitations,
  auditEntries,
}: {
  requests: AccessRequest[]
  projects: { id: string; name: string; status: string }[]
  invitations: Invitation[]
  auditEntries: AuditEntry[]
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
        <TabsList className="mb-6 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="requests">
            Richieste
            {pending.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-primary-blue px-1.5 text-[11px] font-bold text-white">
                {pending.length}
              </span>
            ) : null}
          </TabsTrigger>
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

        <TabsContent value="invitations">
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
                      <td className="px-4 py-2 font-mono text-xs font-medium text-brand-navy">{entry.action}</td>
                      <td className="px-4 py-2 text-muted-foreground">{entry.entity_type ?? "—"}</td>
                      <td className="max-w-[22rem] truncate px-4 py-2 text-xs text-muted-foreground">
                        {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
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

function InvitationRow({ invitation, onDone }: { invitation: Invitation; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const state = invitationState(invitation)
  const revocable = !invitation.accepted_at && !invitation.revoked_at

  async function revoke() {
    setBusy(true)
    try {
      const res = await fetch(`/api/project-room/admin/invitations/${invitation.id}`, { method: "DELETE" })
      if (res.ok) onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium text-brand-navy">{invitation.email}</td>
      <td className="px-4 py-2 text-muted-foreground">{invitation.project_name}</td>
      <td className="px-4 py-2 text-muted-foreground">
        {ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS] ?? invitation.role}
      </td>
      <td className="px-4 py-2 text-muted-foreground">{invitation.can_download ? "Sì" : "No"}</td>
      <td className={`px-4 py-2 font-semibold ${state.tone}`}>{state.label}</td>
      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{formatDate(invitation.expires_at)}</td>
      <td className="px-4 py-2 text-right">
        {revocable ? (
          <Button type="button" variant="ghost" size="sm" onClick={revoke} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldOff className="mr-2 size-4" aria-hidden="true" />
            )}
            Revoca
          </Button>
        ) : null}
      </td>
    </tr>
  )
}
