"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Download, ExternalLink, Loader2, Mail, Phone, MapPin, Plus } from "lucide-react"
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  type ApplicationStatus,
  type JobApplication,
  type JobPosition,
} from "@/lib/jobs/types"

interface Props {
  initialApplications: JobApplication[]
  initialPositions: JobPosition[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function ApplicationsManager({ initialApplications, initialPositions }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications)
  const [positions, setPositions] = useState<JobPosition[]>(initialPositions)
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all")
  const [selected, setSelected] = useState<JobApplication | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length }
    for (const s of APPLICATION_STATUSES) c[s] = 0
    for (const a of applications) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [applications])

  const filtered = useMemo(
    () => (filter === "all" ? applications : applications.filter((a) => a.status === filter)),
    [applications, filter],
  )

  const updateApplication = (updated: JobApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    if (selected?.id === updated.id) setSelected(updated)
  }

  return (
    <Tabs defaultValue="candidature" className="w-full">
      <TabsList>
        <TabsTrigger value="candidature">Candidature ({applications.length})</TabsTrigger>
        <TabsTrigger value="posizioni">Posizioni ({positions.length})</TabsTrigger>
      </TabsList>

      {/* ---------------- CANDIDATURE ---------------- */}
      <TabsContent value="candidature" className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Tutte" count={counts.all} />
          {APPLICATION_STATUSES.map((s) => (
            <FilterChip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={STATUS_LABELS[s]}
              count={counts[s] ?? 0}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            Nessuna candidatura in questo stato.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Disponibilità</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <TableCell className="font-medium text-[#2C3E50]">
                      {a.first_name} {a.last_name}
                      <span className="block text-xs font-normal text-gray-400">{a.email}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{a.position_title || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{fmtDate(a.created_at)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{a.city || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{a.availability || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[a.status]}`}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* ---------------- POSIZIONI ---------------- */}
      <TabsContent value="posizioni" className="mt-6">
        <PositionsPanel positions={positions} setPositions={setPositions} />
      </TabsContent>

      {/* ---------------- DETAIL DIALOG ---------------- */}
      <ApplicationDetail
        application={selected}
        onClose={() => setSelected(null)}
        onUpdated={updateApplication}
      />
    </Tabs>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-[#5B9BD5]"
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  )
}

function ApplicationDetail({
  application,
  onClose,
  onUpdated,
}: {
  application: JobApplication | null
  onClose: () => void
  onUpdated: (a: JobApplication) => void
}) {
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [cvLoading, setCvLoading] = useState(false)

  // Reset notes whenever a new application is opened.
  const open = !!application
  const appId = application?.id
  useEffect(() => {
    setNotes(application?.admin_notes ?? "")
  }, [appId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!application) return null

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/job-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: application.id, ...payload }),
    })
    if (!res.ok) throw new Error("update failed")
    return (await res.json()) as JobApplication
  }

  const changeStatus = async (status: string) => {
    setSavingStatus(true)
    try {
      const updated = await patch({ status })
      onUpdated(updated)
    } catch {
      /* noop */
    } finally {
      setSavingStatus(false)
    }
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const updated = await patch({ admin_notes: notes })
      onUpdated(updated)
    } catch {
      /* noop */
    } finally {
      setSavingNotes(false)
    }
  }

  const openCv = async (download: boolean) => {
    setCvLoading(true)
    try {
      const res = await fetch(`/api/admin/job-applications/${application.id}/cv${download ? "?download=1" : ""}`)
      const data = await res.json()
      if (data?.url) window.open(data.url, "_blank", "noopener,noreferrer")
    } catch {
      /* noop */
    } finally {
      setCvLoading(false)
    }
  }

  const answerEntries = Object.entries(application.answers ?? {}).filter(([, v]) => String(v ?? "").trim())

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#2C3E50]">
            {application.first_name} {application.last_name}
          </DialogTitle>
          <DialogDescription>
            {application.position_title || "Candidatura spontanea"} · {fmtDate(application.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Label className="text-sm">Stato:</Label>
            <Select value={application.status} onValueChange={changeStatus} disabled={savingStatus}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savingStatus && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          {/* Contacts */}
          <div className="grid gap-2 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
            <a href={`mailto:${application.email}`} className="flex items-center gap-2 text-[#5B9BD5]">
              <Mail className="h-4 w-4" /> {application.email}
            </a>
            {application.phone && (
              <a href={`tel:${application.phone}`} className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4" /> {application.phone}
              </a>
            )}
            {application.city && (
              <span className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" /> {application.city}
              </span>
            )}
            {application.linkedin_url && (
              <a
                href={application.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#5B9BD5]"
              >
                <ExternalLink className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {application.portfolio_url && (
              <a
                href={application.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#5B9BD5]"
              >
                <ExternalLink className="h-4 w-4" /> GitHub / Portfolio
              </a>
            )}
          </div>

          {/* CV */}
          <div className="flex flex-wrap items-center gap-3">
            {application.cv_path ? (
              <>
                <Button variant="outline" size="sm" onClick={() => openCv(false)} disabled={cvLoading}>
                  {cvLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Visualizza CV
                </Button>
                <Button variant="outline" size="sm" onClick={() => openCv(true)} disabled={cvLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica
                </Button>
                <span className="text-xs text-gray-400">{application.cv_filename}</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Nessun CV allegato</span>
            )}
          </div>

          {/* Text fields */}
          <DetailField label="Ruolo / esperienza attuale" value={application.current_occupation} />
          <DetailField label="Disponibilità" value={application.availability} />
          <DetailField label="Modalità di collaborazione" value={application.preferred_engagement} />
          <DetailField label="Presentazione" value={application.presentation} multiline />
          <DetailField label="Perché 4 Bid" value={application.motivation} multiline />

          {answerEntries.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#2C3E50]">Risposte specifiche</p>
              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                {answerEntries.map(([k, v]) => (
                  <div key={k} className="text-sm">
                    <span className="font-medium text-gray-500">{k}:</span>{" "}
                    <span className="text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-[#2C3E50]">
              Note interne
            </Label>
            <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="bg-[#5B9BD5] hover:bg-[#4A8BC2]">
              {savingNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salva note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailField({ label, value, multiline }: { label: string; value: string | null; multiline?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-sm font-semibold text-[#2C3E50]">{label}</p>
      <p className={`text-sm text-gray-600 ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>{value}</p>
    </div>
  )
}

/* ---------------- POSITIONS PANEL ---------------- */

function PositionsPanel({
  positions,
  setPositions,
}: {
  positions: JobPosition[]
  setPositions: React.Dispatch<React.SetStateAction<JobPosition[]>>
}) {
  const [editing, setEditing] = useState<JobPosition | null>(null)
  const [creating, setCreating] = useState(false)

  const toggleOpen = async (pos: JobPosition, isOpen: boolean) => {
    // Optimistic update.
    setPositions((prev) => prev.map((p) => (p.id === pos.id ? { ...p, is_open: isOpen } : p)))
    const res = await fetch("/api/admin/job-positions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pos.id, is_open: isOpen }),
    })
    if (!res.ok) {
      // Revert on failure.
      setPositions((prev) => prev.map((p) => (p.id === pos.id ? { ...p, is_open: !isOpen } : p)))
    }
  }

  const upsert = (pos: JobPosition) => {
    setPositions((prev) => {
      const exists = prev.some((p) => p.id === pos.id)
      return exists ? prev.map((p) => (p.id === pos.id ? pos : p)) : [...prev, pos]
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)} className="bg-[#5B9BD5] hover:bg-[#4A8BC2]">
          <Plus className="mr-2 h-4 w-4" />
          Nuova posizione
        </Button>
      </div>

      <div className="space-y-3">
        {positions.map((pos) => (
          <div
            key={pos.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-[#2C3E50]">{pos.title}</p>
              <p className="text-xs text-gray-400">
                {pos.employment_type || "—"} · /{pos.slug}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Switch checked={pos.is_open} onCheckedChange={(v) => toggleOpen(pos, v)} />
                {pos.is_open ? "Aperta" : "Chiusa"}
              </label>
              <Button variant="outline" size="sm" onClick={() => setEditing(pos)}>
                Modifica
              </Button>
            </div>
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <PositionEditor
          position={editing}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSaved={(pos) => {
            upsert(pos)
            setEditing(null)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

function PositionEditor({
  position,
  onClose,
  onSaved,
}: {
  position: JobPosition | null
  onClose: () => void
  onSaved: (p: JobPosition) => void
}) {
  const [title, setTitle] = useState(position?.title ?? "")
  const [badge, setBadge] = useState(position?.badge ?? "")
  const [employmentType, setEmploymentType] = useState(position?.employment_type ?? "")
  const [department, setDepartment] = useState(position?.department ?? "")
  const [summary, setSummary] = useState(position?.summary ?? "")
  const [description, setDescription] = useState(position?.description ?? "")
  const [sortOrder, setSortOrder] = useState(String(position?.sort_order ?? 0))
  const [extraFields, setExtraFields] = useState(JSON.stringify(position?.extra_fields ?? [], null, 2))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setError(null)
    if (!title.trim()) {
      setError("Il titolo è obbligatorio.")
      return
    }
    let parsedExtra: unknown = []
    try {
      parsedExtra = extraFields.trim() ? JSON.parse(extraFields) : []
      if (!Array.isArray(parsedExtra)) throw new Error("not array")
    } catch {
      setError("I campi dinamici devono essere un array JSON valido.")
      return
    }

    setSaving(true)
    const payload = {
      ...(position ? { id: position.id } : {}),
      title: title.trim(),
      badge: badge || null,
      employment_type: employmentType || null,
      department: department || null,
      summary: summary || null,
      description: description || null,
      sort_order: Number(sortOrder) || 0,
      extra_fields: parsedExtra,
    }

    const res = await fetch("/api/admin/job-positions", {
      method: position ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(data?.error || "Errore durante il salvataggio.")
      return
    }
    onSaved(data as JobPosition)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#2C3E50]">{position ? "Modifica posizione" : "Nuova posizione"}</DialogTitle>
          <DialogDescription>
            Le posizioni aperte sono visibili pubblicamente su /lavora-con-noi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-title">Titolo *</Label>
            <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-badge">Badge</Label>
              <Input id="p-badge" placeholder="es. PRIORITÀ ALTA" value={badge} onChange={(e) => setBadge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-dept">Area / dipartimento</Label>
              <Input id="p-dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-type">Tipo di collaborazione</Label>
            <Input id="p-type" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-summary">Sommario</Label>
            <Textarea id="p-summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Descrizione (supporta &quot;## Titolo&quot; e &quot;- elenco&quot;)</Label>
            <Textarea id="p-desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-order">Ordine</Label>
            <Input id="p-order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-28" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-extra">Campi dinamici (JSON)</Label>
            <Textarea
              id="p-extra"
              rows={6}
              value={extraFields}
              onChange={(e) => setExtraFields(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-400">
              Array di {`{ key, label, type: "text|textarea|select", required?, options? }`}
            </p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button onClick={save} disabled={saving} className="bg-[#5B9BD5] hover:bg-[#4A8BC2]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
