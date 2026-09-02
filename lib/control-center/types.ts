export type AuditSeverity = "critical" | "high" | "medium" | "low" | "info"
export type AuditStatus = "healthy" | "attention" | "critical" | "failed"
export type AuditCategory = "security" | "reliability" | "tests" | "maintainability" | "scalability"

export type AuditFinding = {
  code: string
  category: AuditCategory
  severity: AuditSeverity
  title: string
  description: string
  evidence?: string
  filePath?: string
  remediation: string
  changeType: "FIX" | "REFACTOR" | "IMPROVEMENT"
}

export type AuditScores = Record<AuditCategory, number> & { overall: number }

export type AuditProject = {
  slug: string
  name: string
  repository: string
  branch: string
  productUrl?: string
  archived?: boolean
}

export type AuditResult = {
  project: AuditProject
  status: AuditStatus
  commitSha: string
  commitUrl: string
  commitMessage: string
  startedAt: string
  completedAt: string
  durationMs: number
  scores: AuditScores
  findings: AuditFinding[]
  metrics: {
    files: number
    workflows: number
    sourceFiles: number
    testFiles: number
    migrationFiles: number
  }
  engineVersion: string
}
