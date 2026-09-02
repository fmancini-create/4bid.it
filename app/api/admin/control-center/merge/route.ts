import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { getAuditProject } from "@/lib/control-center/projects"
import { analyzeProject } from "@/lib/control-center/analyzer"
import { saveAuditResult } from "@/lib/control-center/storage"

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

type CheckRun = {
  name: string
  status: "queued" | "in_progress" | "completed"
  conclusion: string | null
  html_url?: string | null
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

async function readChecks(owner: string, repo: string, sha: string) {
  const response = await githubResponse(`/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`)
  if (response.status === 403) {
    throw new Error("Impossibile verificare la CI: aggiungere a GITHUB_FIX_TOKEN il permesso Repository permissions > Checks > Read-only.")
  }
  if (response.status === 404) {
    throw new Error("Impossibile verificare i controlli GitHub per questo commit. Merge bloccato per sicurezza.")
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Impossibile verificare la CI (GitHub ${response.status}): ${detail.slice(0, 200)}`)
  }
  const payload = (await response.json()) as { check_runs?: CheckRun[] }
  return payload.check_runs || []
}

function summarizeChecks(checks: CheckRun[]) {
  const pending = checks.filter((check) => check.status !== "completed" || !check.conclusion)
  const failed = checks.filter((check) =>
    check.status === "completed" && !["success", "neutral", "skipped"].includes(check.conclusion || ""),
  )
  const passed = checks.filter((check) =>
    check.status === "completed" && ["success", "neutral", "skipped"].includes(check.conclusion || ""),
  )
  return {
    available: true,
    pending: pending.map((check) => check.name),
    failed: failed.map((check) => check.name),
    passed: passed.map((check) => check.name),
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

  const body = (await request.json().catch(() => ({}))) as { project?: string; prNumber?: number }
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
    if (!pr.head.ref.startsWith("control-center/fix-")) {
      return NextResponse.json({ error: "Merge bloccato: questa PR non e' stata creata dal Control Center." }, { status: 409 })
    }
    if (pr.head.repo?.full_name && pr.head.repo.full_name !== project.repository) {
      return NextResponse.json({ error: "Merge bloccato: la branch della PR proviene da un repository esterno." }, { status: 409 })
    }

    const files = await github<PullRequestFile[]>(`/repos/${owner}/${repo}/pulls/${body.prNumber}/files?per_page=100`)
    const allowedFiles = new Set([".gitignore", ".github/workflows/control-center-ci.yml"])
    const unexpectedFiles = files.map((file) => file.filename).filter((filename) => !allowedFiles.has(filename))
    if (unexpectedFiles.length) {
      return NextResponse.json({
        error: "Merge automatico bloccato: la PR contiene file che richiedono revisione manuale.",
        unexpectedFiles,
      }, { status: 409 })
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

    const checks = summarizeChecks(await readChecks(owner, repo, pr.head.sha))
    if (checks.failed.length) {
      return NextResponse.json({ error: `Merge bloccato: controlli falliti (${checks.failed.join(", ")}).`, checks }, { status: 409 })
    }
    if (checks.pending.length) {
      return NextResponse.json({ error: `Merge bloccato: CI ancora in corso (${checks.pending.join(", ")}).`, checks }, { status: 409 })
    }

    const merge = await github<{ sha?: string; merged?: boolean; message?: string }>(
      `/repos/${owner}/${repo}/pulls/${body.prNumber}/merge`,
      {
        method: "PUT",
        body: JSON.stringify({
          sha: pr.head.sha,
          merge_method: "squash",
          commit_title: `Control Center: ${pr.title} (#${pr.number})`,
        }),
      },
    )

    if (!merge.merged) {
      return NextResponse.json({ error: merge.message || "GitHub non ha completato il merge." }, { status: 409 })
    }

    // Il merge e' gia' concluso: la pulizia della branch non deve mai cambiare l'esito.
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
      message: audit
        ? `Merge completato. Nuovo audit: ${audit.status}, punteggio ${audit.score}.`
        : "Merge completato. Il re-audit automatico non e' stato completato; rilanciare Analizza.",
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Merge non riuscito" }, { status: 500 })
  }
}
