import { randomUUID } from "node:crypto"
import type { AuditProject } from "./types"

type FindingRow = {
  id: string
  code: string
  title: string
  description?: string | null
  remediation?: string | null
  file_path?: string | null
  severity?: string | null
  change_type?: string | null
}

type FileChange = {
  path: string
  content: string
  message: string
}

type ChangePlan = {
  changes: FileChange[]
  appliedCodes: string[]
  reviewMessages: string[]
}

export const AUTO_REMEDIATION_CODES = new Set(["ENV_NOT_IGNORED", "NO_CI"])

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
    "User-Agent": "4bid-control-center-fix/1.0",
    "Content-Type": "application/json",
  }
}

async function github<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.github.com${url}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  })
  if (!response.ok) {
    const detail = await response.text()
    if (response.status === 403 && url.includes("/contents/.github/workflows/")) {
      throw new Error("Il token GITHUB_FIX_TOKEN non puo' modificare workflow GitHub. Aggiungere al token il permesso Repository permissions > Workflows > Read and write.")
    }
    throw new Error(`GitHub ${response.status}: ${detail.slice(0, 300)}`)
  }
  return response.json() as Promise<T>
}

async function readText(repository: string, path: string, ref: string) {
  const [owner, repo] = repository.split("/")
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(ref)}`,
    { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(20_000) },
  )
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GitHub ${response.status}: impossibile leggere ${path}`)
  const payload = (await response.json()) as { content?: string; encoding?: string; sha?: string }
  if (payload.encoding !== "base64" || !payload.content) return null
  return {
    text: Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8"),
    sha: payload.sha || "",
  }
}

async function writeText(repository: string, branch: string, change: FileChange) {
  const [owner, repo] = repository.split("/")
  const existing = await readText(repository, change.path, branch)
  const body: Record<string, string> = {
    message: change.message,
    content: Buffer.from(change.content, "utf8").toString("base64"),
    branch,
  }
  if (existing?.sha) body.sha = existing.sha
  await github(`/repos/${owner}/${repo}/contents/${encodeURIComponent(change.path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

function scriptStep(name: string, script: string, runner: "npm" | "pnpm") {
  return `      - name: ${name}\n        shell: bash\n        run: |\n          if node -e \"process.exit(require('./package.json').scripts?.['${script}'] ? 0 : 1)\"; then ${runner} run ${script}; fi\n`
}

function detectPnpmVersion(packageJson: string | null, lockfile: string) {
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson) as { packageManager?: string }
      const match = pkg.packageManager?.match(/^pnpm@(\d+)/)
      if (match?.[1]) return match[1]
    } catch {
      // Il package.json verra' validato dall'audit; qui basta un fallback prudente.
    }
  }
  if (/lockfileVersion:\s*['\"]?5(?:\.\d+)?['\"]?/i.test(lockfile)) return "7"
  if (/lockfileVersion:\s*['\"]?6(?:\.\d+)?['\"]?/i.test(lockfile)) return "8"
  if (/lockfileVersion:\s*['\"]?9(?:\.\d+)?['\"]?/i.test(lockfile)) return "10"
  return "10"
}

async function buildCiChange(project: AuditProject) {
  const [packageJson, pnpmLock, packageLock, yarnLock, bunLock, bunLockb] = await Promise.all([
    readText(project.repository, "package.json", project.branch),
    readText(project.repository, "pnpm-lock.yaml", project.branch),
    readText(project.repository, "package-lock.json", project.branch),
    readText(project.repository, "yarn.lock", project.branch),
    readText(project.repository, "bun.lock", project.branch),
    readText(project.repository, "bun.lockb", project.branch),
  ])

  if (yarnLock) {
    return { change: null, review: "CI non creata automaticamente: il repository usa Yarn e richiede una pipeline coerente con la versione/configurazione Yarn presente." }
  }
  if (bunLock || bunLockb) {
    return { change: null, review: "CI non creata automaticamente: il repository usa Bun e richiede una pipeline coerente con la versione/configurazione Bun presente." }
  }

  let setup = ""
  let install = ""
  let runner: "npm" | "pnpm"

  if (pnpmLock) {
    runner = "pnpm"
    const pnpmVersion = detectPnpmVersion(packageJson?.text || null, pnpmLock.text)
    setup = `      - name: Setup pnpm\n        uses: pnpm/action-setup@v4\n        with:\n          version: ${pnpmVersion}\n      - name: Setup Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: pnpm\n`
    install = "      - name: Install dependencies\n        run: pnpm install --frozen-lockfile\n"
  } else if (packageLock) {
    runner = "npm"
    setup = `      - name: Setup Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n`
    install = "      - name: Install dependencies\n        run: npm ci\n"
  } else {
    return { change: null, review: "CI non creata automaticamente: non e' stato rilevato un lockfile npm/pnpm. Serve scegliere il package manager prima di generare la pipeline." }
  }

  const workflow = `name: Control Center CI\n\non:\n  pull_request:\n  push:\n    branches:\n      - ${project.branch}\n\npermissions:\n  contents: read\n\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n${setup}${install}${scriptStep("Lint", "lint", runner)}${scriptStep("Test", "test", runner)}${scriptStep("Build", "build", runner)}`

  return {
    change: {
      path: ".github/workflows/control-center-ci.yml",
      content: workflow,
      message: "ci: add baseline validation workflow",
    } satisfies FileChange,
    review: null,
  }
}

async function buildChanges(project: AuditProject, findings: FindingRow[]): Promise<ChangePlan> {
  const changes: FileChange[] = []
  const appliedCodes: string[] = []
  const reviewMessages: string[] = []

  if (findings.some((item) => item.code === "ENV_NOT_IGNORED")) {
    const current = await readText(project.repository, ".gitignore", project.branch)
    const base = current?.text || ""
    const wanted = [".env", ".env.*", "!.env.example"]
    const lines = new Set(base.split(/\r?\n/).map((line) => line.trim()))
    const additions = wanted.filter((line) => !lines.has(line))
    if (additions.length) {
      changes.push({
        path: ".gitignore",
        content: `${base.replace(/\s+$/, "")}\n\n# Environment secrets\n${additions.join("\n")}\n`,
        message: "fix(security): ignore environment secret files",
      })
      appliedCodes.push("ENV_NOT_IGNORED")
    }
  }

  if (findings.some((item) => item.code === "NO_CI")) {
    const ci = await buildCiChange(project)
    if (ci.change) {
      changes.push(ci.change)
      appliedCodes.push("NO_CI")
    } else if (ci.review) {
      reviewMessages.push(ci.review)
    }
  }

  return { changes, appliedCodes, reviewMessages }
}

export function remediationCapability(code: string) {
  if (AUTO_REMEDIATION_CODES.has(code)) return { mode: "auto" as const, label: "Intervieni" }
  return { mode: "review" as const, label: "Prepara intervento" }
}

export async function remediateFindings(project: AuditProject, findings: FindingRow[]) {
  if (project.archived) {
    return {
      ok: false,
      requiresReview: true,
      message: "Repository archiviato: resta monitorabile, ma il Control Center non applica modifiche automatiche finche' non viene riattivato su GitHub.",
    }
  }

  const supported = findings.filter((item) => AUTO_REMEDIATION_CODES.has(item.code))
  if (!supported.length) {
    return {
      ok: false,
      requiresReview: true,
      message: "Questi problemi richiedono una modifica progettuale o una revisione manuale; nessuna modifica automatica e' stata applicata.",
    }
  }

  const plan = await buildChanges(project, supported)
  if (!plan.changes.length) {
    if (plan.reviewMessages.length) {
      return { ok: false, requiresReview: true, message: plan.reviewMessages.join(" ") }
    }
    return { ok: false, requiresReview: false, message: "Nessuna modifica necessaria: il repository risulta gia' corretto per questi controlli." }
  }

  const [owner, repo] = project.repository.split("/")
  const baseRef = await github<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(project.branch)}`,
  )
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)
  const branch = `control-center/fix-${stamp}-${randomUUID().slice(0, 8)}`
  await github(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha }),
  })

  for (const change of plan.changes) await writeText(project.repository, branch, change)

  const titles = supported.filter((item) => plan.appliedCodes.includes(item.code)).map((item) => item.title)
  const pr = await github<{ html_url: string; number: number }>(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `Control Center: correggi ${plan.appliedCodes.length} problema/i`,
      head: branch,
      base: project.branch,
      body: [
        "## Intervento automatico 4 BID Control Center",
        "",
        "Correzioni preparate su branch dedicata: nessuna modifica diretta alla branch di produzione.",
        "",
        ...titles.map((title) => `- ${title}`),
        "",
        "### File modificati",
        ...plan.changes.map((change) => `- \`${change.path}\``),
        ...(plan.reviewMessages.length ? ["", "### Da revisionare manualmente", ...plan.reviewMessages.map((message) => `- ${message}`)] : []),
        "",
        "Verificare CI e diff prima del merge.",
      ].join("\n"),
    }),
  })

  return {
    ok: true,
    requiresReview: false,
    branch,
    prUrl: pr.html_url,
    prNumber: pr.number,
    changedFiles: plan.changes.map((change) => change.path),
    fixedCodes: plan.appliedCodes,
    reviewMessages: plan.reviewMessages,
  }
}
