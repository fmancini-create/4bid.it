"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ExternalLink, GitMerge, Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AI_REMEDIATION_CODES, type AiRisk } from "@/lib/control-center/ai-meta"

type ProjectLite = {
  slug: string
  name: string
  repository: string
  branch: string
  archived?: boolean
}

type FindingLite = {
  id: string
  project_slug: string
  code: string
  title: string
  description?: string | null
  severity?: string | null
  change_type?: string | null
}

type PendingAiPr = {
  project: string
  prNumber: number
  prUrl: string
  branch: string
  risk: AiRisk
  iteration: number
}

function riskBadge(risk: AiRisk) {
  if (risk === "alto") return "destructive" as const
  if (risk === "medio") return "secondary" as const
  return "outline" as const
}

export default function ControlCenterAiPanel({
  projects,
  findings,
  githubFixReady,
  aiReady,
}: {
  projects: ProjectLite[]
  findings: FindingLite[]
  githubFixReady: boolean
  aiReady: boolean
}) {
  const router = useRouter()
  const [working, setWorking] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAiPr | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const eligible = useMemo(
    () => findings.filter((finding) => AI_REMEDIATION_CODES.has(finding.code)),
    [findings],
  )

  async function start(finding: FindingLite) {
    setWorking(`start-${finding.id}`)
    setMessage("L'AI sta leggendo il finding e il contesto minimo del repository…")
    try {
      const response = await fetch("/api/admin/control-center/ai-remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId: finding.id }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || payload.message || "Remediation AI non riuscita")
      if (payload.requiresReview) {
        setPending(null)
        setMessage(`${payload.message || "Revisione tecnica necessaria."}${payload.summary ? ` ${payload.summary}` : ""}`)
        return
      }
      setPending({
        project: finding.project_slug,
        prNumber: payload.prNumber,
        prUrl: payload.prUrl,
        branch: payload.branch,
        risk: payload.risk || "medio",
        iteration: payload.iteration || 0,
      })
      setMessage(payload.message || `PR AI #${payload.prNumber} creata.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Remediation AI non riuscita")
    } finally {
      setWorking(null)
    }
  }

  async function continueWithAi() {
    if (!pending) return
    setWorking(`iterate-${pending.prNumber}`)
    setMessage("Leggo lo stato CI e, se necessario, passo gli errori all'AI…")
    try {
      const response = await fetch("/api/admin/control-center/ai-iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: pending.project, prNumber: pending.prNumber }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || payload.message || "Iterazione AI non riuscita")
      if (payload.requiresReview) {
        setMessage(`${payload.message || "Revisione tecnica necessaria."}${payload.summary ? ` ${payload.summary}` : ""}`)
        return
      }
      setPending((current) => current ? {
        ...current,
        risk: payload.risk || current.risk,
        iteration: typeof payload.iteration === "number" ? payload.iteration : current.iteration,
      } : current)
      setMessage(payload.message || "Controllo CI completato.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Iterazione AI non riuscita")
    } finally {
      setWorking(null)
    }
  }

  async function mergeAiPr() {
    if (!pending) return
    if (pending.risk === "alto") {
      const confirmed = window.confirm("Questa remediation AI e' classificata a rischio alto. Il Control Center verifichera' comunque CI, file e guardrail prima del merge. Vuoi continuare?")
      if (!confirmed) return
    }
    setWorking(`merge-${pending.prNumber}`)
    setMessage("Verifico file, conflitti e CI prima del merge…")
    try {
      const response = await fetch("/api/admin/control-center/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: pending.project,
          prNumber: pending.prNumber,
          confirmAiRisk: pending.risk === "alto",
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Merge non riuscito")
      setMessage(payload.message || "Merge AI completato.")
      setPending(null)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Merge non riuscito")
    } finally {
      setWorking(null)
    }
  }

  return (
    <Card className="border-violet-300/60 bg-gradient-to-br from-violet-50/70 to-background dark:from-violet-950/20">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              AI Repair Lab
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              Correzioni assistite su branch dedicata, PR controllata e ciclo CI → AI → CI. L'AI non puo' modificare segreti, migrazioni, workflow, lockfile o dipendenze.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" />Guardrail attivi</Badge>
            <Badge variant="secondary">max 8 iterazioni</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!githubFixReady || !aiReady) && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            {!githubFixReady ? "GITHUB_FIX_TOKEN non configurato. " : ""}
            {!aiReady ? "AI Gateway non disponibile in questo ambiente." : ""}
          </div>
        )}

        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nell'ultimo audit non ci sono finding attualmente abilitati alla remediation AI.</p>
        ) : (
          <div className="grid gap-2">
            {eligible.map((finding) => {
              const project = projects.find((item) => item.slug === finding.project_slug)
              const disabled = Boolean(working) || !githubFixReady || !aiReady || Boolean(project?.archived)
              return (
                <div key={finding.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/80 p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{project?.name || finding.project_slug}</span>
                      <Badge variant="outline" className="font-mono text-[11px]">{finding.code}</Badge>
                      {finding.severity && <Badge variant={finding.severity === "high" || finding.severity === "critical" ? "destructive" : "secondary"}>{finding.severity}</Badge>}
                    </div>
                    <p className="text-sm mt-1">{finding.title}</p>
                    {finding.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{finding.description}</p>}
                  </div>
                  <Button size="sm" onClick={() => start(finding)} disabled={disabled}>
                    {working === `start-${finding.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Correggi con AI
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {(message || pending) && (
          <div className="rounded-lg border bg-background p-3 text-sm space-y-3">
            {message && <p>{message}</p>}
            {pending && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={riskBadge(pending.risk)}>Rischio {pending.risk}</Badge>
                <Badge variant="outline">Iterazione {pending.iteration}</Badge>
                <Button size="sm" variant="outline" asChild>
                  <a href={pending.prUrl} target="_blank" rel="noreferrer">
                    Apri PR #{pending.prNumber}<ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={continueWithAi} disabled={Boolean(working)}>
                  {working === `iterate-${pending.prNumber}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Leggi CI e continua con AI
                </Button>
                <Button size="sm" onClick={mergeAiPr} disabled={Boolean(working)}>
                  {working === `merge-${pending.prNumber}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitMerge className="h-4 w-4 mr-2" />}
                  Approva e mergia
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
