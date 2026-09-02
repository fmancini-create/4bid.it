"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ExternalLink, GitBranch, GitMerge, Loader2, Play, Wrench, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AuditProject } from "@/lib/control-center/types"

type Row = Record<string, any>
type Latest = { project: AuditProject; run: Row | null }
type PendingPr = { project: string; prNumber: number; prUrl: string; branch: string }

const AUTO_REMEDIATION_CODES = new Set(["ENV_NOT_IGNORED", "NO_CI"])

function statusStyle(status?: string) {
  if (status === "healthy") return { label: "Sano", className: "bg-emerald-600 text-white", icon: CheckCircle2 }
  if (status === "critical") return { label: "Critico", className: "bg-red-600 text-white", icon: XCircle }
  if (status === "failed") return { label: "Errore", className: "bg-slate-700 text-white", icon: XCircle }
  return { label: status ? "Attenzione" : "Mai analizzato", className: "bg-amber-500 text-white", icon: AlertTriangle }
}

function scoreColor(score?: number) {
  if (typeof score !== "number") return "text-muted-foreground"
  if (score >= 85) return "text-emerald-600"
  if (score >= 65) return "text-amber-600"
  return "text-red-600"
}

export default function ControlCenterDashboard({ userEmail, latestRuns, findings, history, storageReady, githubReady, githubFixReady }: { userEmail: string; latestRuns: Latest[]; findings: Row[]; history: Row[]; storageReady: boolean; githubReady: boolean; githubFixReady: boolean }) {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [fixing, setFixing] = useState<string | null>(null)
  const [merging, setMerging] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingPr, setPendingPr] = useState<PendingPr | null>(null)
  const [selected, setSelected] = useState(latestRuns[0]?.project.slug || "")
  const active = latestRuns.find((item) => item.project.slug === selected)
  const activeFindings = useMemo(() => {
    const runId = active?.run?.id
    if (!runId) return []
    return findings.filter((item) => item.run_id === runId)
      .sort((a, b) => ["critical", "high", "medium", "low", "info"].indexOf(a.severity) - ["critical", "high", "medium", "low", "info"].indexOf(b.severity))
  }, [active, findings])
  const activeAutoFixable = activeFindings.filter((item) => AUTO_REMEDIATION_CODES.has(item.code))

  async function runAudit(project?: string) {
    setRunning(project || "all")
    setMessage(null)
    setPendingPr(null)
    try {
      const response = await fetch("/api/admin/control-center/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project ? { project } : {}) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || payload.results?.map((item: Row) => item.error).filter(Boolean).join("; ") || "Analisi non riuscita")
      const failed = payload.results.filter((item: Row) => !item.ok)
      setMessage(failed.length ? `Analisi completata con ${failed.length} errore/i.` : "Analisi completata e salvata.")
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analisi non riuscita")
    } finally {
      setRunning(null)
    }
  }

  async function remediate(input: { findingId?: string; project?: string; allFixable?: boolean }, key: string) {
    setFixing(key)
    setMessage(null)
    setPendingPr(null)
    try {
      const response = await fetch("/api/admin/control-center/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || payload.message || "Intervento non riuscito")
      if (payload.requiresReview) {
        setMessage(payload.message || "Il problema richiede revisione manuale.")
      } else if (payload.ok) {
        const projectSlug = input.project || active?.project.slug || ""
        setMessage(`Correzione preparata su branch ${payload.branch}. PR #${payload.prNumber} pronta per i controlli.`)
        setPendingPr({ project: projectSlug, prNumber: payload.prNumber, prUrl: payload.prUrl, branch: payload.branch })
      } else {
        setMessage(payload.message || "Nessuna modifica applicata.")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Intervento non riuscito")
    } finally {
      setFixing(null)
    }
  }

  async function approveAndMerge() {
    if (!pendingPr) return
    setMerging(true)
    setMessage("Verifico conflitti e controlli GitHub prima del merge…")
    try {
      const response = await fetch("/api/admin/control-center/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: pendingPr.project, prNumber: pendingPr.prNumber }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Merge non riuscito")
      setMessage(payload.message || "Merge completato.")
      setPendingPr(null)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Merge non riuscito")
    } finally {
      setMerging(false)
    }
  }

  function prepareManual(item: Row) {
    setPendingPr(null)
    setMessage(`“${item.title}” richiede una revisione tecnica prima di modificare il codice. Azione consigliata: ${item.remediation}`)
  }

  const critical = latestRuns.filter((item) => item.run?.status === "critical").length
  const attention = latestRuns.filter((item) => item.run?.status === "attention").length
  const availableScores = latestRuns.flatMap((item) => typeof item.run?.score_overall === "number" ? [item.run.score_overall] : [])
  const averageScore = availableScores.length ? Math.round(availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length) : null

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Activity className="h-7 w-7 text-primary" /><div><h1 className="text-2xl font-bold">4 BID Control Center</h1><p className="text-sm text-muted-foreground">Salute tecnica e interventi controllati sull'intero ecosistema GitHub · {userEmail}</p></div></div>
          <div className="flex gap-2"><Button variant="outline" asChild><a href="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Admin</a></Button><Button onClick={() => runAudit()} disabled={Boolean(running) || !storageReady || !githubReady}><Play className="h-4 w-4 mr-2" />{running === "all" ? "Analisi in corso…" : "Analizza tutti i repository"}</Button></div>
        </div>

        {(!storageReady || !githubReady || !githubFixReady || message || pendingPr) && <div className={`rounded-lg border p-4 text-sm space-y-3 ${!storageReady || !githubReady || !githubFixReady ? "border-amber-300 bg-amber-50 text-amber-900" : "bg-card"}`}>{!storageReady && <p><strong>Database da inizializzare.</strong> Applicare `scripts/071_technical_audit_control_center.sql`.</p>}{!githubReady && <p><strong>GitHub non collegato.</strong> Configurare `GITHUB_AUDIT_TOKEN` server-side con accesso in sola lettura a tutti i repository dell'account `fmancini-create`.</p>}{!githubFixReady && <p><strong>Interventi automatici non ancora abilitati.</strong> Configurare `GITHUB_FIX_TOKEN` separato dal token di audit.</p>}{message && <p>{message}</p>}{pendingPr && <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" asChild><a href={pendingPr.prUrl} target="_blank" rel="noreferrer">Apri PR #{pendingPr.prNumber}<ExternalLink className="h-3.5 w-3.5 ml-1" /></a></Button><Button size="sm" onClick={approveAndMerge} disabled={merging}>{merging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitMerge className="h-4 w-4 mr-2" />}Approva e mergia</Button><span className="text-xs text-muted-foreground">Il merge viene bloccato automaticamente se ci sono conflitti, CI non verde o file inattesi.</span></div>}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Card><CardHeader className="pb-2"><CardDescription>Repository monitorati</CardDescription><CardTitle>{latestRuns.length}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Punteggio medio</CardDescription><CardTitle className={scoreColor(averageScore ?? undefined)}>{averageScore ?? "—"}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Critici</CardDescription><CardTitle className="text-red-600">{critical}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Da attenzionare</CardDescription><CardTitle className="text-amber-600">{attention}</CardTitle></CardHeader></Card></div>

        <Tabs value={selected} onValueChange={setSelected} className="space-y-4"><TabsList className="flex flex-wrap h-auto">{latestRuns.map(({ project }) => <TabsTrigger key={project.slug} value={project.slug}>{project.name}</TabsTrigger>)}</TabsList>{latestRuns.map(({ project, run }) => { const style = statusStyle(run?.status); const Icon = style.icon; const projectFindings = run ? findings.filter((item) => item.run_id === run.id) : []; const fixable = projectFindings.filter((item) => AUTO_REMEDIATION_CODES.has(item.code)); return <TabsContent key={project.slug} value={project.slug} className="space-y-4"><Card><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle className="flex items-center gap-2">{project.name}<Badge className={style.className}><Icon className="h-3 w-3 mr-1" />{style.label}</Badge></CardTitle><CardDescription className="mt-2 flex flex-wrap gap-x-4 gap-y-1"><span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" />{project.repository} · {project.branch}</span>{run?.completed_at && <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(run.completed_at).toLocaleString("it-IT")}</span>}</CardDescription></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => runAudit(project.slug)} disabled={Boolean(running) || Boolean(fixing) || !storageReady || !githubReady}>{running === project.slug ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}Analizza</Button>{fixable.length > 0 && <Button onClick={() => remediate({ project: project.slug, allFixable: true }, `all-${project.slug}`)} disabled={Boolean(fixing) || !githubFixReady}>{fixing === `all-${project.slug}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wrench className="h-4 w-4 mr-2" />}Intervieni sui correggibili ({fixable.length})</Button>}</div></div></CardHeader>{run && <CardContent className="space-y-5"><div className="grid grid-cols-3 sm:grid-cols-6 gap-3"><div><p className="text-xs text-muted-foreground">Totale</p><p className={`text-2xl font-bold ${scoreColor(run.score_overall)}`}>{run.score_overall}</p></div>{Object.entries(run.scores || {}).filter(([key]) => key !== "overall").map(([key, value]) => <div key={key}><p className="text-xs text-muted-foreground capitalize">{key}</p><p className={`text-xl font-semibold ${scoreColor(value as number)}`}>{String(value)}</p></div>)}</div><div className="text-sm text-muted-foreground"><p><strong>Commit:</strong> <a className="text-primary hover:underline" href={run.commit_url} target="_blank" rel="noreferrer">{String(run.commit_sha).slice(0, 7)}</a> · {run.commit_message}</p><p><strong>Rilevati:</strong> {projectFindings.length} problemi · {run.metrics?.files || 0} file · {run.metrics?.testFiles || 0} test · {run.metrics?.workflows || 0} workflow</p></div></CardContent>}</Card></TabsContent> })}</Tabs>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-4"><Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle>Problemi dell'ultima analisi</CardTitle><CardDescription>Ordinati per gravita', con evidenza, intervento consigliato e azione controllata.</CardDescription></div>{activeAutoFixable.length > 0 && active && <Button size="sm" onClick={() => remediate({ project: active.project.slug, allFixable: true }, `active-${active.project.slug}`)} disabled={Boolean(fixing) || !githubFixReady}>{fixing === `active-${active.project.slug}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wrench className="h-4 w-4 mr-2" />}Correggi automaticamente ({activeAutoFixable.length})</Button>}</div></CardHeader><CardContent className="space-y-3">{!activeFindings.length && <p className="text-sm text-muted-foreground">Nessun risultato disponibile.</p>}{activeFindings.map((item) => { const auto = AUTO_REMEDIATION_CODES.has(item.code); return <div key={item.id} className="rounded-lg border p-4 space-y-3"><div className="flex flex-wrap items-center gap-2"><Badge variant={item.severity === "critical" || item.severity === "high" ? "destructive" : "secondary"}>{String(item.severity).toUpperCase()}</Badge><Badge variant="outline">{item.change_type}</Badge>{auto ? <Badge className="bg-emerald-600 text-white">AUTO-CORREGGIBILE</Badge> : <Badge variant="secondary">REVISIONE</Badge>}<strong>{item.title}</strong></div><p className="text-sm">{item.description}</p>{item.evidence && <p className="text-xs text-muted-foreground break-all"><strong>Evidenza:</strong> {item.evidence}</p>}<p className="text-sm text-primary"><strong>Azione:</strong> {item.remediation}</p><div className="flex justify-end">{auto ? <Button size="sm" onClick={() => remediate({ findingId: item.id }, item.id)} disabled={Boolean(fixing) || !githubFixReady}>{fixing === item.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wrench className="h-4 w-4 mr-2" />}Intervieni</Button> : <Button size="sm" variant="outline" onClick={() => prepareManual(item)}><Wrench className="h-4 w-4 mr-2" />Prepara intervento</Button>}</div></div> })}</CardContent></Card><Card><CardHeader><CardTitle>Storico</CardTitle><CardDescription>Ultime esecuzioni di tutti i repository.</CardDescription></CardHeader><CardContent className="space-y-3">{history.slice(0, 15).map((run) => <div key={run.id} className="flex items-center justify-between gap-2 border-b pb-2"><div className="min-w-0"><p className="font-medium truncate">{run.project_name}</p><p className="text-xs text-muted-foreground">{new Date(run.completed_at).toLocaleString("it-IT")}</p></div><span className={`font-bold ${scoreColor(run.score_overall)}`}>{run.score_overall}</span></div>)}</CardContent></Card></div>
      </div>
    </div>
  )
}
