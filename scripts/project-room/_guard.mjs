/**
 * Shared safety guard for the Project Room verification scripts.
 *
 * These scripts create AND delete real rows — including auth users — using the
 * service role key, which bypasses RLS. The key is present in production too,
 * so "the key exists" is not a safe signal on its own. Running a teardown
 * against live data would destroy real accounts, so an explicit opt-in is
 * required and the target project is printed before anything is written.
 */
export function assertVerificationAllowed(scriptName) {
  if (process.env.PR_ALLOW_DESTRUCTIVE_VERIFY !== "yes") {
    console.error(
      [
        `Refusing to run ${scriptName}.`,
        "",
        "This script creates and deletes real rows (including auth users) with the",
        "service role key, which bypasses RLS. Re-run with an explicit opt-in:",
        "",
        `  PR_ALLOW_DESTRUCTIVE_VERIFY=yes node scripts/project-room/${scriptName}`,
        "",
        "Never set this against a production database you care about.",
      ].join("\n"),
    )
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  // Printed so the operator can see which project is about to be mutated
  // instead of discovering it afterwards. Host only — never the key.
  console.log(`[verify] target project host: ${new URL(url).host}`)
  return { url, service }
}
