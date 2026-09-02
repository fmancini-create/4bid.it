import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"
import { getAuditProject } from "@/lib/control-center/projects"

export const maxDuration = 60

type FindingRow = {
  id: string
  project_slug: string
  code: string
  title: string
  description?: string | null
  evidence?: string | null
  remediation?: string | null
  file_path?: string | null
  severity?: string | null
  change_type?: string | null
}

type Plan = {
  summary: string
  risk: "basso" | "medio" | "alto"
  files: string[]
  steps: string[]
  checks: string[]
}

function evidencePaths(evidence?: string | null) {
  if (!evidence) return []
  return evidence
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.includes("/") || /\.[a-z0-9]{1,8}$/i.test(value))
    .slice(0, 8)
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))]
}

function buildPlan(finding: FindingRow): Plan {
  const filesFromEvidence = evidencePaths(finding.evidence)
  const genericChecks = [
    "Verificare il diff completo prima del merge.",
    "Eseguire lint, test e build disponibili nel repository.",
    "Rilanciare l'audit del Control Center dopo il deploy.",
  ]

  switch (finding.code) {
    case "SECRET_FILE":
      return {
        summary: "Verificare se i file rilevati contengono segreti reali, rimuoverli dal repository e ruotare le credenziali eventualmente esposte.",
        risk: "alto",
        files: unique([finding.file_path, ...filesFromEvidence, ".gitignore"]),
        steps: [
          "Aprire i file segnalati senza copiarne il contenuto in log o ticket.",
          "Stabilire se contengono credenziali, chiavi, certificati o token reali.",
          "Se sono segreti reali, ruotarli prima di rimuoverli dal repository.",
          "Rimuovere i file dalla branch di lavoro e aggiungere regole .gitignore appropriate.",
          "Valutare la bonifica della cronologia Git se il segreto e' stato versionato in commit precedenti.",
        ],
        checks: ["Confermare che le vecchie credenziali non siano piu' valide.", ...genericChecks],
      }
    case "TREE_TRUNCATED":
      return {
        summary: "L'albero GitHub e' troppo grande per l'analisi completa: occorre ridurre gli artefatti versionati o suddividere l'ispezione per directory.",
        risk: "medio",
        files: unique([finding.file_path, ".gitignore"]),
        steps: [
          "Individuare directory molto grandi, build artefacts, cache o file generati versionati per errore.",
          "Escludere dal repository gli artefatti che possono essere rigenerati.",
          "Se il repository e' legittimamente molto grande, modificare l'analizzatore per scansionare le directory in piu' richieste.",
        ],
        checks: genericChecks,
      }
    case "DEBUG_ROUTES":
      return {
        summary: "Le route di debug vanno rimosse dalla produzione oppure protette con autorizzazione forte e limitazioni esplicite.",
        risk: "alto",
        files: unique([finding.file_path, ...filesFromEvidence]),
        steps: [
          "Aprire le route segnalate e verificare quali dati o azioni espongono.",
          "Rimuovere le route non necessarie in produzione.",
          "Per quelle necessarie, imporre autenticazione server-side e autorizzazione superadmin.",
          "Evitare risposte che espongano environment variables, stack trace o dati tenant.",
        ],
        checks: ["Provare accesso anonimo e con utente non autorizzato: deve essere negato.", ...genericChecks],
      }
    case "NO_TESTS":
    case "LOW_TEST_RATIO":
      return {
        summary: "Aumentare la copertura automatica partendo dai flussi che possono causare danni economici, isolamento tenant o blocchi operativi.",
        risk: "medio",
        files: unique([finding.file_path, "package.json", "tests/", "__tests__/"]),
        steps: [
          "Identificare i flussi piu' critici del prodotto.",
          "Aggiungere test per autenticazione/autorizzazione, isolamento tenant, pagamenti e integrazioni esterne pertinenti.",
          "Aggiungere o standardizzare lo script npm test.",
          "Inserire i test nella CI prima del merge.",
        ],
        checks: genericChecks,
      }
    case "NO_BUILD_SCRIPT":
      return {
        summary: "Definire una build riproducibile nel package.json e farla eseguire dalla CI.",
        risk: "medio",
        files: unique([finding.file_path, "package.json"]),
        steps: [
          "Verificare framework e comando di build effettivamente usato in produzione.",
          "Aggiungere lo script build senza cambiare il comportamento del deploy.",
          "Eseguire npm run build in ambiente pulito.",
        ],
        checks: genericChecks,
      }
    case "NO_LINT":
      return {
        summary: "Aggiungere uno script lint coerente con lo stack del repository e renderlo ripetibile in CI.",
        risk: "basso",
        files: unique([finding.file_path, "package.json", "eslint.config.mjs", ".eslintrc.json"]),
        steps: [
          "Verificare se ESLint e' gia' installato o configurato.",
          "Definire lo script lint usando la configurazione esistente o una configurazione minima compatibile.",
          "Correggere gli errori bloccanti senza introdurre refactor non necessari.",
        ],
        checks: genericChecks,
      }
    case "NO_TEST_SCRIPT":
      return {
        summary: "Standardizzare il comando di test in package.json usando il runner gia' presente nel progetto.",
        risk: "basso",
        files: unique([finding.file_path, "package.json"]),
        steps: [
          "Individuare il test runner gia' usato dal repository.",
          "Aggiungere lo script npm test senza cambiare la suite esistente.",
          "Eseguire lo script in CI.",
        ],
        checks: genericChecks,
      }
    case "NO_REQUEST_GUARD":
      return {
        summary: "Verificare le aree private e introdurre un guard globale solo se coerente con l'architettura di autenticazione esistente.",
        risk: "alto",
        files: unique([finding.file_path, "proxy.ts", "middleware.ts", "lib/admin-config.ts"]),
        steps: [
          "Mappare route pubbliche, tenant, admin e superadmin.",
          "Verificare dove avvengono oggi autenticazione e autorizzazione server-side.",
          "Aggiungere proxy.ts/middleware.ts solo se non duplica o rompe i controlli esistenti.",
          "Applicare regole deny-by-default alle aree realmente private.",
        ],
        checks: ["Testare utente anonimo, tenant, admin e superadmin su tutte le aree protette.", ...genericChecks],
      }
    case "INVALID_PACKAGE_JSON":
      return {
        summary: "Correggere il manifest JSON prima di qualsiasi altro intervento, preservando dipendenze e script esistenti.",
        risk: "alto",
        files: unique([finding.file_path, "package.json"]),
        steps: [
          "Validare sintassi JSON e individuare il punto di rottura.",
          "Correggere solo la sintassi necessaria senza aggiornare dipendenze contestualmente.",
          "Eseguire installazione pulita e build.",
        ],
        checks: genericChecks,
      }
    case "BUILD_ERRORS_IGNORED":
      return {
        summary: "Rimuovere gradualmente le esclusioni che permettono il deploy con errori TypeScript/ESLint, correggendo prima gli errori reali.",
        risk: "alto",
        files: unique([finding.file_path, "next.config.mjs", "next.config.ts"]),
        steps: [
          "Eseguire typecheck/lint/build con le esclusioni attuali per censire gli errori.",
          "Correggere gli errori bloccanti in una branch dedicata.",
          "Rimuovere ignoreBuildErrors/ignoreDuringBuilds soltanto quando la build e' verde.",
        ],
        checks: genericChecks,
      }
    case "MEMORY_RATE_LIMIT":
      return {
        summary: "Sostituire il rate limiting in memoria con una soluzione condivisa tra istanze serverless oppure con il firewall della piattaforma.",
        risk: "alto",
        files: unique([finding.file_path, "proxy.ts", "middleware.ts"]),
        steps: [
          "Individuare tutte le route che dipendono dal rate limiter in memoria.",
          "Definire chiave, finestra e soglie per tenant/IP/utente.",
          "Spostare lo stato su un backend distribuito o su una funzione nativa della piattaforma.",
          "Mantenere un comportamento fail-safe in caso di indisponibilita' del backend di rate limiting.",
        ],
        checks: ["Testare richieste concorrenti su piu' istanze e verificare che il limite sia condiviso.", ...genericChecks],
      }
    case "NO_DB_MIGRATIONS":
      return {
        summary: "Versionare lo schema del database con migrazioni ripetibili senza ricostruire o alterare dati esistenti alla cieca.",
        risk: "alto",
        files: unique([finding.file_path, "supabase/migrations/", "migrations/", "scripts/"]),
        steps: [
          "Individuare il database e lo schema realmente in produzione.",
          "Confrontare lo schema corrente con quello atteso dall'applicazione.",
          "Creare una baseline o migrazioni incrementali idempotenti secondo gli strumenti del progetto.",
          "Provare le migrazioni su un database di test prima della produzione.",
        ],
        checks: ["Verificare che nessuna migrazione distrugga o ricrei dati esistenti.", ...genericChecks],
      }
    default:
      return {
        summary: finding.remediation || finding.description || "Il problema richiede una revisione tecnica prima di modificare il codice.",
        risk: finding.severity === "critical" || finding.severity === "high" ? "alto" : "medio",
        files: unique([finding.file_path, ...filesFromEvidence]),
        steps: [
          "Aprire l'evidenza indicata dal Control Center e confermare il problema sul commit analizzato.",
          "Preparare la modifica minima necessaria su branch dedicata.",
          "Evitare modifiche collaterali non richieste dal finding.",
        ],
        checks: genericChecks,
      }
  }
}

export async function POST(request: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { findingId?: string }
  if (!body.findingId) return NextResponse.json({ error: "findingId mancante" }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("technical_audit_findings")
    .select("*")
    .eq("id", body.findingId)
    .single()

  if (error || !data) return NextResponse.json({ error: "Problema non trovato" }, { status: 404 })

  const finding = data as FindingRow
  const project = getAuditProject(finding.project_slug)
  if (!project) return NextResponse.json({ error: "Repository non riconosciuto" }, { status: 400 })

  const plan = buildPlan(finding)

  return NextResponse.json({
    ok: true,
    plan: {
      findingId: finding.id,
      code: finding.code,
      title: finding.title,
      severity: finding.severity || "medium",
      changeType: finding.change_type || "IMPROVEMENT",
      repository: project.repository,
      repositoryUrl: `https://github.com/${project.repository}`,
      branch: project.branch,
      summary: plan.summary,
      risk: plan.risk,
      files: plan.files,
      steps: plan.steps,
      checks: plan.checks,
    },
  })
}
