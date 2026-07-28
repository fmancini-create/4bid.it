/**
 * Proves the ONE property that justifies denormalising attribution into
 * pr_audit_logs.metadata: an audit entry must still say WHO did WHAT after the
 * acting user and the project have been deleted.
 *
 * All three foreign keys on pr_audit_logs are ON DELETE SET NULL, so without
 * the denormalised copy the trail silently loses its actor. This script keeps
 * the audit row alive on purpose (unlike the other verify scripts, which clean
 * theirs up) and only removes it at the very end.
 *
 * Run: node scripts/project-room/verify-audit-durability.mjs
 */
import { createClient } from "@supabase/supabase-js"

const SB_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SB_URL || !SERVICE) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const db = createClient(SB_URL, SERVICE, { auth: { persistSession: false } })

let pass = 0
let fail = 0
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  ->  ${JSON.stringify(actual)}`)
  ok ? pass++ : fail++
}

const stamp = Date.now()
const created = { users: [], projects: [], clients: [], orgs: [], audit: [] }

async function main() {
  // --- fixtures -----------------------------------------------------------
  const { data: org } = await db
    .from("pr_organizations")
    .insert({ name: `Durability Org ${stamp}`, slug: `dur-org-${stamp}` })
    .select("id")
    .single()
  created.orgs.push(org.id)

  // pr_clients.slug is NOT NULL, and pr_projects.status is constrained to the
  // Italian values in PROJECT_STATUSES ('active' is rejected).
  const { data: client, error: clientErr } = await db
    .from("pr_clients")
    .insert({ organization_id: org.id, name: `Durability Client ${stamp}`, slug: `dur-client-${stamp}` })
    .select("id")
    .single()
  if (clientErr) throw new Error(`pr_clients: ${clientErr.message}`)
  created.clients.push(client.id)

  const { data: project, error: projectErr } = await db
    .from("pr_projects")
    .insert({
      organization_id: org.id,
      client_id: client.id,
      name: `Durability Project ${stamp}`,
      slug: `dur-project-${stamp}`,
      status: "approvato",
    })
    .select("id")
    .single()
  if (projectErr) throw new Error(`pr_projects: ${projectErr.message}`)
  created.projects.push(project.id)

  const email = `durability+${stamp}@4bid.test`
  const { data: userRes } = await db.auth.admin.createUser({
    email,
    password: `Dur!${stamp}aA1`,
    email_confirm: true,
  })
  const userId = userRes.user.id
  created.users.push(userId)
  await db.from("profiles").insert({ id: userId, email, first_name: "Dura", last_name: "Bilita" })

  // --- write an audit entry through the real helper path -------------------
  // Mirrors exactly what recordAudit writes, including the denormalised copy.
  const { data: proj } = await db
    .from("pr_projects")
    .select("name, organization_id")
    .eq("id", project.id)
    .maybeSingle()
  const { data: prof } = await db.from("profiles").select("email").eq("id", userId).maybeSingle()

  const { data: entry, error: entryErr } = await db
    .from("pr_audit_logs")
    .insert({
      organization_id: proj.organization_id,
      project_id: project.id,
      user_id: userId,
      action: "document.downloaded",
      entity_type: "document",
      metadata: { actor_email: prof.email, project_name: proj.name, filename: "contratto.pdf" },
    })
    .select("id")
    .single()
  if (entryErr) throw new Error(`pr_audit_logs: ${entryErr.message}`)
  created.audit.push(entry.id)

  console.log("\n--- before deletion ---")
  const before = await db
    .from("pr_audit_logs")
    .select("user_id, project_id, organization_id, metadata")
    .eq("id", entry.id)
    .single()
  check("actor foreign key present", before.data.user_id === userId, true)
  check("project foreign key present", before.data.project_id === project.id, true)
  check("organisation set", before.data.organization_id === org.id, true)

  // --- destroy the subjects the trail points at ---------------------------
  await db.from("pr_project_members").delete().eq("user_id", userId)
  await db.from("profiles").delete().eq("id", userId)
  await db.auth.admin.deleteUser(userId)
  await db.from("pr_projects").delete().eq("id", project.id)

  console.log("\n--- after deleting the user AND the project ---")
  const after = await db
    .from("pr_audit_logs")
    .select("user_id, project_id, organization_id, action, metadata")
    .eq("id", entry.id)
    .maybeSingle()

  check("audit row survived", after.data !== null, true)
  // These two SHOULD now be null: that is the ON DELETE SET NULL behaviour and
  // the exact reason the denormalised copy has to exist.
  check("actor foreign key was nulled (as designed)", after.data.user_id, null)
  check("project foreign key was nulled (as designed)", after.data.project_id, null)

  // The properties that must hold for the trail to remain meaningful:
  check("organisation SURVIVED (row still visible in admin console)", after.data.organization_id === org.id, true)
  check("actor email SURVIVED", after.data.metadata.actor_email, email)
  check("project name SURVIVED", after.data.metadata.project_name, `Durability Project ${stamp}`)
  check("action SURVIVED", after.data.action, "document.downloaded")
  check("payload SURVIVED", after.data.metadata.filename, "contratto.pdf")

  // The admin console filters by organisation; prove the row is still returned.
  const { data: visible } = await db
    .from("pr_audit_logs")
    .select("id")
    .eq("organization_id", org.id)
    .eq("id", entry.id)
  check("still returned by the org-scoped query the console uses", visible.length, 1)
}

async function cleanup() {
  console.log("\n--- cleanup ---")
  for (const id of created.audit) await db.from("pr_audit_logs").delete().eq("id", id)
  for (const id of created.users) {
    await db.from("profiles").delete().eq("id", id)
    await db.auth.admin.deleteUser(id).catch(() => {})
  }
  for (const id of created.projects) await db.from("pr_projects").delete().eq("id", id)
  for (const id of created.clients) await db.from("pr_clients").delete().eq("id", id)
  for (const id of created.orgs) await db.from("pr_organizations").delete().eq("id", id)
  console.log("fixtures rimosse")
}

main()
  .then(async () => {
    console.log(
      fail === 0
        ? `\nATTRIBUZIONE DUREVOLE CONFERMATA — pass ${pass}, fail ${fail}`
        : `\nFALLITO — pass ${pass}, fail ${fail}`,
    )
    await cleanup()
    process.exit(fail === 0 ? 0 : 1)
  })
  .catch(async (err) => {
    console.error("errore:", err.message)
    await cleanup()
    process.exit(1)
  })
