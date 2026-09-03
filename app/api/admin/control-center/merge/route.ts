import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { getAuditProject } from "@/lib/control-center/projects"
import { analyzeProject } from "@/lib/control-center/analyzer"
import { saveAuditResult } from "@/lib/control-center/storage"
import { dependencyFingerprint, isAiPathAllowedForCode, parseAiMeta } from "@/lib/control-center/ai-meta"
import { verifyAiMetaSignature } from "@/lib/control-center/ai-signature"

export const maxDuration = 300

type PullRequestPayload = {
  number: number
  state: string
  draft: boolean
  merged: boolean
  mergeable: boolean | null
  mergeable_state: string
  html_url: string
  title: string
  body?: string | null
  head: { sha: string; ref: string; repo?: { full_name?: string } | null }
  base: { ref: string }
}

type PullRequestFile = { filename: string }

type WorkflowRun = {
  name?: string | null
  display_title?: string | null
  status?: string | null
  conclusion?: string | null
  html_url?: string | null
  head_sha?: string | null
}

type CommitStatus = {
  context?: string | null
  state?: string | null
  target_url?: string | null
}

type CiSummary = {
  available: boolean
  pending: string[]
  failed: string[]
  passed: string[]
  sourceCount: number
  bootstrap: boolean
}

function fixToken() {
  const token = process.env.GITHUB_FIX_TOKEN
  if (!token) throw new Error("GITHUB_FIX_TOKEN non configurato")
  return token
}

function headers() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${fixToken()}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "4bid-control-center-merge/1.0",
    "Content-Type": "application/json",
  }
}

async function githubResponse(path: string, init?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  })
}

async function github<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await githubResponse(path, init)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`GitHub ${response.status}: ${detail.slice(0, 300)}`)
  }
  return response.json() as Promise<T>
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/")
}

async function readRepoText(owner: string, repo: string, path: string, ref: string) {
  const response = await githubResponse(`/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Impossibile leggere ${path}@${ref} (GitHub ${response.status}): ${detail.slice(0, 180)}`)
  }
  const payload = (await response.json()) as { content?: string; encoding?: string }
  if (payload.encoding !== "base64" || !payload.content) throw new Error(`Contenuto ${path}@${ref} non leggibile.`)
  return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8")
}

async function readWorkflowRuns(owner: string, repo: string, sha: string) {
  const response = await githubResponse(`/repos/${owner}/${repo}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=100`)
  if (response.status === 403) {
    throw new Error("Impossibile verificare GitHub Actions: aggiungere a GITHUB_FIX_TOKEN Repository permissions > Actions > Read-only.")
  }
  if (response.status === 404) {
    throw new Error("Impossibile leggere GitHub Actions per questo repository. Merge bloccato per sicurezza.")
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Impossibile verificare GitHub Actions (GitHub ${response.status}): ${detail.slice(0, 200)}`)
  }
  const payload = (await response.json()) as { workflow_runs?: WorkflowRun[] }
  return (payload.workflow_runs || []).filter((run) => !run.head_sha || run.head_sha === sha)
}

async function readCommitStatuses(owner: string, repo: string, sha: string) {
  const response = await githubResponse(`/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}/status`)
  if (response.status === 403) {
    throw new Error("Impossibile verificare gli status del commit: aggiungere a GITHUB_FIX_TOKEN Repository permissions > Commit statuses > Read-only.")
  }
  if (response.status === 404) {
    throw new Error("Impossibile leggere gli status del commit. Merge bloccato per sicurezza.")
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Impossibile verificare gli status del commit (GitHub ${response.status}): ${detail.slice(0, 200)}`)
  }
  const payload = (await response.json()) as { statuses?: CommitStatus[] }
  return payload.statuses || []
}

function workflowLabel(run: WorkflowRun, index: number) {
  return run.name || run.display_title || `GitHub Actions #${index + 1}`
}

async function summarizeCi(owner: string, repo: string, sha: string, files: PullRequestFile[]): Promise<CiSummary> {
  const [runs, statuses] = await Promise.all([
    readWorkflowRuns(owner, repo, sha),
    readCommitStatuses(owner, repo, sha),
  ])

  const pending: string[] = []
  const failed: string[] = []
  const passed: string[] = []

  runs.forEach((run, index) => {
    const label = workflowLabel(run, index)
    if (run.status !== "completed" || !run.conclusion) {
      pending.push(label)
      return
    }
    if (["success", "neutral", "skipped"].includes(run.conclusion)) passed.push(label)
    else failed.push(label)
  })

  statuses.forEach((status, index) => {
    const label = status.context || `Commit status #${index + 1}`
    if (status.state === "success") passed.push(label)
    else if (status.state === "pending") pending.push(label)
    else if (status.state === "failure" || status.state === "error") failed.push(label)
    else pending.push(label)
  })

  const sourceCount = runs.length + statuses.length
  const bootstrap = sourceCount === 0 && files.some((file) => file.filename === ".github/workflows/control-center-ci.yml")

  return {
    available: sourceCount > 0 || bootstrap,
    pending: [...new Set(pending)],
    failed: [...new Set(failed)],
    passed: [...new Set(passed)],
    sourceCount,
    bootstrap,
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  if (!process.env.GITHUB_FIX_TOKEN) {
    return NextResponse.json({ error: "GITHUB_FIX_TOKEN non configurato" }, { status: 503 })
  }

  const body = (await request.json().catch(() => ({}))) as { project?: string; prNumber?: number; confirmAiRisk?: boolean }
  if (!body.project || !Number.isInteger(body.prNumber) || Number(body.prNumber) <= 0) {
    return NextResponse.json({ error: "Specificare project e prNumber" }, { status: 400 })
  }

  const project = getAuditProject(body.project)
  if (!project) return NextResponse.json({ error: "Repository non riconosciuto" }, { status: 400 })
  if (project.archived) {
    return NextResponse.json({ error: "Merge bloccato: il repository e' archiviato su GitHub." }, { status: 409 })
  }

  const [owner, repo] = project.repository.split("/")

  try {
    const pr = await github<PullRequestPayload>(`/repos/${owner}/${repo}/pulls/${body.prNumber}`)

    if (pr.merged) return NextResponse.json({ error: "La Pull Request risulta gia' mergiata." }, { status: 409 })
    if (pr.state !== "open") return NextResponse.json({ error: "La Pull Request non e' aperta." }, { status: 409 })
    if (pr.draft) return NextResponse.json({ error: "La Pull Request e' ancora in bozza." }, { status: 409 })
    if (pr.base.ref !== project.branch) {
      return NextResponse.json({ error: `Merge bloccato: la PR non punta alla branch prevista ${project.branch}.` }, { status: 409 })
    }

    const deterministic = pr.head.ref.startsWith("control-center/fix-")
    const aiGenerated = pr.head.ref.startsWith("control-center/ai-fix-")
    if (!deterministic && !aiGenerated) {
      return NextResponse.json({ error: "Merge bloccato: questa PR non e' stata creata dal Control Center." }, { status: 409 })
    }
    if (pr.head.repo?.full_name && pr.head.repo.full_name !== project.repository) {
      return NextResponse.json({ error: "Merge bloccato: la branch della PR proviene da un repository esterno." }, { status: 409 })
    }

    const files = await github<PullRequestFile[]>(`/repos/${owner}/${repo}/pulls/${body.prNumber}/files?per_page=100`)
    let aiMeta = null as ReturnType<typeof parseAiMeta>

    if (deterministic) {
      const allowedFiles = new Set([".gitignore", ".github/workflows/control-center-ci.yml"])
      const unexpectedFiles = files.map((file) => file.filename).filter((filename) => !allowedFiles.has(filename))
      if (unexpectedFiles.length) {
        return NextResponse.json({
          error: "Merge automatico bloccato: la PR contiene file che richiedono revisione manuale.",
          unexpectedFiles,
        }, { status: 409 })
      }
    } else {
      aiMeta = parseAiMeta(pr.body)
      if (!aiMeta || aiMeta.project !== project.slug || !verifyAiMetaSignature(aiMeta)) {
        return NextResponse.json({ error: "Merge AI bloccato: manifest di sicurezza mancante, alterato o non valido." }, { status: 409 })
      }
      if (aiMeta.files.length > 12 || files.length > 12) {
        return NextResponse.json({ error: "Merge AI bloccato: la PR supera il limite di 12 file." }, { status: 409 })
      }
      const manifest = new Set(aiMeta.files)
      const unexpectedFiles = files
        .map((file) => file.filename)
        .filter((filename) => !manifest.has(filename) || !isAiPathAllowedForCode(aiMeta!.code, filename))
      if (unexpectedFiles.length) {
        return NextResponse.json({
          error: "Merge AI bloccato: file fuori dallo scope autorizzato dal finding.",
          unexpectedFiles,
        }, { status: 409 })
      }
      if (files.some((file) => file.filename === "package.json")) {
        const [basePackage, headPackage] = await Promise.all([
          readRepoText(owner, repo, "package.json", project.branch),
          readRepoText(owner, repo, "package.json", pr.head.ref),
        ])
        try {
          if (dependencyFingerprint(basePackage) !== dependencyFingerprint(headPackage)) {
            return NextResponse.json({ error: "Merge AI bloccato: package.json modifica dipendenze o package manager." }, { status: 409 })
          }
        } catch {
          return NextResponse.json({ error: "Merge AI bloccato: package.json non e' validabile." }, { status: 409 })
        }
      }
      if (aiMeta.risk === "alto" && body.confirmAiRisk !== true) {
        return NextResponse.json({
          error: "Questa remediation AI e' classificata a rischio alto e richiede conferma esplicita prima del merge.",
          requiresRiskConfirmation: true,
        }, { status: 409 })
      }
    }

    if (pr.mergeable === false || pr.mergeable_state === "dirty") {
      return NextResponse.json({ error: "Merge bloccato: la Pull Request presenta conflitti." }, { status: 409 })
    }
    if (pr.mergeable === null || pr.mergeable_state === "unknown") {
      return NextResponse.json({ error: "GitHub sta ancora calcolando la mergeabilita'. Riprova tra pochi secondi." }, { status: 409 })
    }
    if (["blocked", "unstable", "behind", "draft"].includes(pr.mergeable_state)) {
      const reason = pr.mergeable_state === "unstable"
        ? "uno o piu' controlli CI non risultano verdi"
        : pr.mergeable_state === "behind"
          ? "la branch della PR deve essere aggiornata"
          : "GitHub sta bloccando il merge per regole o controlli del repository"
      return NextResponse.json({ error: `Merge bloccato: ${reason}.`, mergeableState: pr.mergeable_state }, { status: 409 })
    }

    const checks = await summarizeCi(owner, repo, pr.head.sha, files)
    if (checks.failed.length) {
      return NextResponse.json({ error: `Merge bloccato: controlli falliti (${checks.failed.join(", ")}).`, checks }, { status: 409 })
    }
    if (checks.pending.length) {
      return NextResponse.json({ error: `Merge bloccato: CI ancora in corso (${checks.pending.join(", ")}).`, checks }, { status: 409 })
    }
    if (!checks.available) {
      return NextResponse.json({
        error: "Merge bloccato: non risultano GitHub Actions o commit status verificabili per questa PR.",
        checks,
      }, { status: 409 })
    }

    const merge = await github<{ sha?: string; merged?: boolean; message?: string }>(
      `/repos/${owner}/${repo}/pulls/${body.prNumber}/merge`,
      {
        method: "PUT",
        body: JSON.stringify({
          sha: pr.head.sha,
          merge_method: "squash",
          commit_title: `${aiGenerated ? "Control Center AI" : "Control Center"}: ${pr.title} (#${pr.number})`,
        }),
      },
    )

    if (!merge.merged) {
      return NextResponse.json({ error: merge.message || "GitHub non ha completato il merge." }, { status: 409 })
    }

    try {
      const encodedRef = pr.head.ref.split("/").map(encodeURIComponent).join("/")
      await githubResponse(`/repos/${owner}/${repo}/git/refs/heads/${encodedRef}`, { method: "DELETE" })
    } catch {
      // La branch puo' essere eliminata automaticamente da GitHub o restare disponibile per audit/debug.
    }

    let audit: { status: string; score: number } | null = null
    try {
      const result = await analyzeProject(project)
      await saveAuditResult(result)
      audit = { status: result.status, score: result.scores.overall }
    } catch {
      // Il merge e' gia' avvenuto: un eventuale problema nel re-audit non deve falsare l'esito del merge.
    }

    return NextResponse.json({
      ok: true,
      merged: true,
      mergeSha: merge.sha || null,
      prUrl: pr.html_url,
      audit,
      checks,
      ai: aiGenerated,
      aiMeta,
      message: audit
        ? `Merge completato. Nuovo audit: ${audit.status}, punteggio ${audit.score}.`
        : "Merge completato. Il re-audit automatico non e' stato completato; rilanciare Analizza.",
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Merge non riuscito" }, { status: 500 })
  }
}
