import { execSync } from "child_process"

/**
 * Get the last git commit date for a specific file.
 * Returns ISO string or null if unavailable.
 * Safe: never crashes the build.
 */
export function getLastUpdatedISOForFile(filePath: string): string | null {
  try {
    // Execute git log to get last commit date for the file
    const result = execSync(`git log -1 --format=%cI -- ${filePath}`, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    })
    const trimmed = result.trim()
    // Validate it looks like an ISO date
    if (trimmed && /^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      return trimmed
    }
    return null
  } catch {
    // Git not available, file not tracked, or other error
    return null
  }
}
