export const AI_REMEDIATION_CODES = new Set([
  "NO_LINT",
  "NO_TEST_SCRIPT",
  "NO_TESTS",
  "LOW_TEST_RATIO",
  "BUILD_ERRORS_IGNORED",
])

export type AiRisk = "basso" | "medio" | "alto"

export type AiPrMeta = {
  version: 1
  project: string
  findingId: string
  code: string
  risk: AiRisk
  model: string
  files: string[]
  iteration: number
}

const META_PREFIX = "<!-- CONTROL_CENTER_AI_META "
const META_SUFFIX = " -->"

export function serializeAiMeta(meta: AiPrMeta) {
  return `${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}`
}

export function parseAiMeta(body?: string | null): AiPrMeta | null {
  if (!body) return null
  const line = body.split("\n").find((value) => value.startsWith(META_PREFIX) && value.endsWith(META_SUFFIX))
  if (!line) return null
  try {
    const raw = line.slice(META_PREFIX.length, -META_SUFFIX.length)
    const parsed = JSON.parse(raw) as Partial<AiPrMeta>
    if (
      parsed.version !== 1 ||
      typeof parsed.project !== "string" ||
      typeof parsed.findingId !== "string" ||
      typeof parsed.code !== "string" ||
      !AI_REMEDIATION_CODES.has(parsed.code) ||
      !["basso", "medio", "alto"].includes(String(parsed.risk)) ||
      typeof parsed.model !== "string" ||
      !Array.isArray(parsed.files) ||
      !parsed.files.every((file) => typeof file === "string") ||
      !Number.isInteger(parsed.iteration)
    ) return null
    return parsed as AiPrMeta
  } catch {
    return null
  }
}

export function normalizeRepoPath(value: string) {
  const path = value.trim().replace(/^\/+/, "")
  if (!path || path.includes("\\") || path.split("/").some((part) => part === ".." || part === ".")) return null
  if (/\u0000|\r|\n/.test(path)) return null
  return path
}

export function isAiPathForbidden(path: string) {
  return [
    /^\.env(?:\.|$)/i,
    /(^|\/)(?:secrets?|credentials?)(?:\/|$)/i,
    /\.(?:pem|key|p12|pfx)$/i,
    /(^|\/)id_rsa$/i,
    /^\.github\/workflows\//i,
    /(^|\/)(?:migrations?|supabase\/migrations)(?:\/|$)/i,
    /\.sql$/i,
    /^vercel\.json$/i,
    /(^|\/)(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|npm-shrinkwrap\.json)$/i,
    /(^|\/)node_modules(?:\/|$)/i,
  ].some((rule) => rule.test(path))
}

const TEST_PATH_RE = /(^|\/)(__tests__|tests?|e2e)(\/|\.)|\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/i
const TEST_CONFIG_RE = /^(vitest|jest|playwright)\.config\.(ts|js|mjs|cjs)$/i
const ESLINT_CONFIG_RE = /^(eslint\.config\.(ts|js|mjs|cjs)|\.eslintrc(?:\.(json|js|cjs|yml|yaml))?)$/i
const SOURCE_PATH_RE = /^(app|components|lib|hooks|scripts|src)\/.*\.(ts|tsx|js|jsx|mjs|cjs)$/i
const NEXT_CONFIG_RE = /^next\.config\.(ts|js|mjs|cjs)$/i

export function isAiPathAllowedForCode(code: string, path: string) {
  if (isAiPathForbidden(path)) return false
  if (code === "NO_LINT") return path === "package.json" || ESLINT_CONFIG_RE.test(path)
  if (code === "NO_TEST_SCRIPT") return path === "package.json" || TEST_CONFIG_RE.test(path)
  if (code === "NO_TESTS" || code === "LOW_TEST_RATIO") {
    return path === "package.json" || TEST_PATH_RE.test(path) || TEST_CONFIG_RE.test(path)
  }
  if (code === "BUILD_ERRORS_IGNORED") {
    return path === "package.json" || path === "tsconfig.json" || NEXT_CONFIG_RE.test(path) || SOURCE_PATH_RE.test(path)
  }
  return false
}

export function dependencyFingerprint(packageJson: string) {
  const parsed = JSON.parse(packageJson) as Record<string, unknown>
  return JSON.stringify({
    dependencies: parsed.dependencies || {},
    devDependencies: parsed.devDependencies || {},
    peerDependencies: parsed.peerDependencies || {},
    optionalDependencies: parsed.optionalDependencies || {},
    overrides: parsed.overrides || {},
    resolutions: parsed.resolutions || {},
    packageManager: parsed.packageManager || null,
  })
}
