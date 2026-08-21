import { getRepositorySnapshot } from "./github"
import type { AuditFinding, AuditProject, AuditResult, AuditScores, AuditSeverity } from "./types"

const ENGINE_VERSION = "1.0.0"
const SOURCE_RE = /\.(ts|tsx|js|jsx|py|go|java)$/
const TEST_RE = /(^|\/)(__tests__|tests?|e2e)(\/|\.)|\.(test|spec)\.[^.]+$/
const MIGRATION_RE = /(^|\/)(migrations?|supabase|scripts)\/.*\.sql$/

function finding(input: AuditFinding): AuditFinding {
  return input
}

function scoresFrom(findings: AuditFinding[]): AuditScores {
  const penalty: Record<AuditSeverity, number> = { critical: 35, high: 18, medium: 8, low: 3, info: 0 }
  const categories = ["security", "reliability", "tests", "maintainability", "scalability"] as const
  const categoryScores = Object.fromEntries(
    categories.map((category) => [
      category,
      Math.max(0, 100 - findings.filter((item) => item.category === category).reduce((sum, item) => sum + penalty[item.severity], 0)),
    ]),
  ) as Record<(typeof categories)[number], number>
  const overall = Math.round(categories.reduce((sum, category) => sum + categoryScores[category], 0) / categories.length)
  return { ...categoryScores, overall }
}

export async function analyzeProject(project: AuditProject): Promise<AuditResult> {
  const started = Date.now()
  const snapshot = await getRepositorySnapshot(project.repository, project.branch)
  const paths = snapshot.tree.filter((item) => item.type === "blob").map((item) => item.path)
  const pathSet = new Set(paths)
  const sourceFiles = paths.filter((path) => SOURCE_RE.test(path))
  const testFiles = paths.filter((path) => TEST_RE.test(path))
  const migrationFiles = paths.filter((path) => MIGRATION_RE.test(path))
  const workflows = paths.filter((path) => path.startsWith(".github/workflows/") && /\.ya?ml$/.test(path))
  const findings: AuditFinding[] = []

  const [packageJson, nextConfig, proxy, gitignore] = await Promise.all([
    snapshot.readText("package.json"),
    snapshot.readText("next.config.mjs"),
    snapshot.readText("proxy.ts"),
    snapshot.readText(".gitignore"),
  ])

  if (snapshot.treeTruncated) {
    findings.push(finding({ code: "TREE_TRUNCATED", category: "reliability", severity: "medium", title: "Analisi albero incompleta", description: "GitHub ha troncato l'albero del repository per dimensione.", remediation: "Suddividere l'analisi per directory oppure ridurre gli artefatti versionati.", changeType: "IMPROVEMENT" }))
  }
  const riskyFiles = paths.filter((path) => /(^|\/)(\.env($|\.)|service-account.*\.json$|id_rsa$|.*\.pem$)/i.test(path) && !/\.example$/i.test(path))
  if (riskyFiles.length) {
    findings.push(finding({ code: "SECRET_FILE", category: "security", severity: "critical", title: "Possibili file sensibili versionati", description: "Sono presenti file il cui nome e' normalmente associato a credenziali.", evidence: riskyFiles.slice(0, 8).join(", "), remediation: "Verificare immediatamente i file, ruotare eventuali segreti e rimuoverli dalla cronologia Git.", changeType: "FIX" }))
  }
  if (!gitignore || !gitignore.includes(".env")) {
    findings.push(finding({ code: "ENV_NOT_IGNORED", category: "security", severity: "high", title: ".env non protetto chiaramente", description: "Il file .gitignore non contiene una regola esplicita per i file .env.", filePath: ".gitignore", remediation: "Aggiungere .env e le varianti locali al file .gitignore.", changeType: "FIX" }))
  }
  if (paths.some((path) => /(^|\/)api\/debug(\/|$)|debug-.*route/i.test(path))) {
    findings.push(finding({ code: "DEBUG_ROUTES", category: "security", severity: "medium", title: "Route di debug presenti", description: "Le route di debug possono esporre configurazione o informazioni operative.", evidence: paths.filter((path) => /(^|\/)api\/debug(\/|$)|debug-.*route/i.test(path)).slice(0, 6).join(", "), remediation: "Proteggere le route con autorizzazione forte oppure escluderle dalla produzione.", changeType: "FIX" }))
  }
  if (!workflows.length) {
    findings.push(finding({ code: "NO_CI", category: "reliability", severity: "high", title: "Controlli CI assenti", description: "Non risultano workflow GitHub Actions.", remediation: "Aggiungere una pipeline con typecheck, lint, test e build su ogni pull request.", changeType: "IMPROVEMENT" }))
  }
  if (!testFiles.length) {
    findings.push(finding({ code: "NO_TESTS", category: "tests", severity: "high", title: "Test automatici non rilevati", description: "Nessun file di test e' stato individuato.", remediation: "Coprire prima autenticazione, isolamento tenant, pagamenti e integrazioni critiche.", changeType: "IMPROVEMENT" }))
  } else if (sourceFiles.length > 60 && testFiles.length / sourceFiles.length < 0.03) {
    findings.push(finding({ code: "LOW_TEST_RATIO", category: "tests", severity: "medium", title: "Copertura test probabilmente bassa", description: `${testFiles.length} file di test per ${sourceFiles.length} file sorgente.`, remediation: "Aumentare progressivamente i test sui flussi a rischio maggiore.", changeType: "IMPROVEMENT" }))
  }
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson) as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
      const scripts = pkg.scripts || {}
      if (!scripts.build) findings.push(finding({ code: "NO_BUILD_SCRIPT", category: "reliability", severity: "high", title: "Script build assente", description: "package.json non espone uno script build.", filePath: "package.json", remediation: "Definire una build riproducibile e inserirla nella CI.", changeType: "FIX" }))
      if (!scripts.lint) findings.push(finding({ code: "NO_LINT", category: "maintainability", severity: "medium", title: "Lint non configurato", description: "Manca uno script lint ripetibile.", filePath: "package.json", remediation: "Configurare ESLint e renderlo obbligatorio in pull request.", changeType: "IMPROVEMENT" }))
      if (!scripts.test) findings.push(finding({ code: "NO_TEST_SCRIPT", category: "tests", severity: "medium", title: "Script test assente", description: "I test non possono essere eseguiti con un comando standard.", filePath: "package.json", remediation: "Aggiungere uno script test stabile e usarlo in CI.", changeType: "IMPROVEMENT" }))
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      if (deps.next && !pathSet.has("proxy.ts") && !pathSet.has("middleware.ts")) findings.push(finding({ code: "NO_REQUEST_GUARD", category: "security", severity: "medium", title: "Nessun guard globale rilevato", description: "Il progetto Next.js non presenta proxy.ts o middleware.ts.", remediation: "Verificare che ogni area privata applichi autenticazione e autorizzazione server-side.", changeType: "FIX" }))
    } catch {
      findings.push(finding({ code: "INVALID_PACKAGE_JSON", category: "reliability", severity: "critical", title: "package.json non valido", description: "Il manifest non e' JSON valido.", filePath: "package.json", remediation: "Correggere il manifest prima del prossimo deploy.", changeType: "FIX" }))
    }
  }
  if (nextConfig && /ignoreBuildErrors\s*:\s*true|ignoreDuringBuilds\s*:\s*true/.test(nextConfig)) {
    findings.push(finding({ code: "BUILD_ERRORS_IGNORED", category: "reliability", severity: "high", title: "Errori di build ignorati", description: "La configurazione consente il deploy ignorando errori TypeScript o ESLint.", filePath: "next.config.mjs", remediation: "Rimuovere le esclusioni e risolvere gli errori reali.", changeType: "FIX" }))
  }
  if (proxy && /new Map<.*rate/i.test(proxy)) {
    findings.push(finding({ code: "MEMORY_RATE_LIMIT", category: "scalability", severity: "medium", title: "Rate limiting in memoria", description: "In ambiente serverless lo stato in memoria non e' condiviso fra istanze e puo' essere azzerato.", filePath: "proxy.ts", remediation: "Usare un rate limiter distribuito o il firewall della piattaforma.", changeType: "REFACTOR" }))
  }
  if (!migrationFiles.length) {
    findings.push(finding({ code: "NO_DB_MIGRATIONS", category: "maintainability", severity: "low", title: "Migrazioni database non rilevate", description: "Non e' presente una storia schema verificabile nel repository.", remediation: "Versionare lo schema e applicare migrazioni ripetibili.", changeType: "IMPROVEMENT" }))
  }

  const scores = scoresFrom(findings)
  const status = findings.some((item) => item.severity === "critical") ? "critical" : findings.some((item) => item.severity === "high") ? "attention" : "healthy"
  const completed = Date.now()
  return {
    project,
    status,
    commitSha: snapshot.commit.sha,
    commitUrl: snapshot.commit.html_url,
    commitMessage: snapshot.commit.commit.message.split("\n")[0],
    startedAt: new Date(started).toISOString(),
    completedAt: new Date(completed).toISOString(),
    durationMs: completed - started,
    scores,
    findings,
    metrics: { files: paths.length, workflows: workflows.length, sourceFiles: sourceFiles.length, testFiles: testFiles.length, migrationFiles: migrationFiles.length },
    engineVersion: ENGINE_VERSION,
  }
}

