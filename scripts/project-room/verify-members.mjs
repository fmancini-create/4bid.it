/**
 * Temporary verification for the member-management endpoint.
 *
 * Creates its own fixtures (a second organisation included, to prove tenant
 * isolation), drives the real HTTP routes with a real cookie session, then
 * deletes everything it created. Not part of the app.
 */

import { createClient } from "@supabase/supabase-js"

const SB_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = "http://localhost:3000"

const db = createClient(SB_URL, SERVICE, { auth: { persistSession: false } })
const ref = new global.URL(SB_URL).hostname.split(".")[0]

const created = { users: [], orgs: [], projects: [], clients: [] }
let pass = 0
let fail = 0

function check(label, actual, expected) {
  const ok = String(actual) === String(expected)
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  ->  ${actual}${ok ? "" : ` (atteso ${expected})`}`)
  ok ? pass++ : fail++
}

async function makeUser(email) {
  const password = `Tmp-${crypto.randomUUID()}`
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  created.users.push(data.user.id)
  await db.from("profiles").upsert({ id: data.user.id, email, first_name: "Test", last_name: email.split("@")[0] })
  return { id: data.user.id, email, password }
}

/** Sign in for real and shape the session into the cookie @supabase/ssr reads. */
async function cookieFor(user) {
  const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  })
  const session = await res.json()
  if (!session.access_token) throw new Error(`login failed: ${JSON.stringify(session)}`)
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`
  return `sb-${ref}-auth-token=${value}`
}

async function call(method, path, cookie, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { cookie, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

async function main() {
  const { data: org } = await db.from("pr_organizations").select("id").eq("slug", "4bid").single()
  const { data: project } = await db
    .from("pr_projects")
    .select("id")
    .eq("organization_id", org.id)
    .limit(1)
    .single()

  // Fixtures: an admin of the real org, a plain member, and a foreign org.
  const adminUser = await makeUser(`tmp-admin-${Date.now()}@4bid.test`)
  const memberUser = await makeUser(`tmp-member-${Date.now()}@4bid.test`)
  const outsider = await makeUser(`tmp-outsider-${Date.now()}@4bid.test`)

  await db.from("pr_organization_members").insert({ organization_id: org.id, user_id: adminUser.id, role: "admin" })
  await db
    .from("pr_project_members")
    .insert({ project_id: project.id, user_id: memberUser.id, role: "commenter", can_download: false })

  // A second organisation with its own project, to test cross-tenant access.
  const { data: org2 } = await db
    .from("pr_organizations")
    .insert({ name: "Tmp Org", slug: `tmp-org-${Date.now()}` })
    .select("id")
    .single()
  created.orgs.push(org2.id)
  const { data: client2 } = await db
    .from("pr_clients")
    .insert({ organization_id: org2.id, name: "Tmp Client", slug: `tmp-client-${Date.now()}` })
    .select("id")
    .single()
  created.clients.push(client2.id)
  const { data: project2 } = await db
    .from("pr_projects")
    .insert({
      organization_id: org2.id,
      client_id: client2.id,
      name: "Tmp Project",
      slug: `tmp-project-${Date.now()}`,
      status: "bozza",
    })
    .select("id")
    .single()
  created.projects.push(project2.id)
  await db
    .from("pr_project_members")
    .insert({ project_id: project2.id, user_id: outsider.id, role: "reader", can_download: false })

  const adminCookie = await cookieFor(adminUser)
  const memberCookie = await cookieFor(memberUser)
  const ep = (p, u) => `/api/project-room/admin/projects/${p}/members/${u}`

  console.log("\n--- authorisation ---")
  check("member (non-admin) PATCH", (await call("PATCH", ep(project.id, memberUser.id), memberCookie, { role: "reader" })).status, 403)
  check("member (non-admin) DELETE", (await call("DELETE", ep(project.id, memberUser.id), memberCookie)).status, 403)

  console.log("\n--- tenant isolation ---")
  check(
    "admin of org1 on org2 project",
    (await call("PATCH", ep(project2.id, outsider.id), adminCookie, { role: "reader" })).status,
    404,
  )
  check(
    "admin on member of another project",
    (await call("PATCH", ep(project.id, outsider.id), adminCookie, { role: "reader" })).status,
    404,
  )

  console.log("\n--- input validation ---")
  check("invalid role", (await call("PATCH", ep(project.id, memberUser.id), adminCookie, { role: "superuser" })).status, 400)
  check("role not a string", (await call("PATCH", ep(project.id, memberUser.id), adminCookie, { role: 5 })).status, 400)
  check(
    "can_download not boolean",
    (await call("PATCH", ep(project.id, memberUser.id), adminCookie, { can_download: "yes" })).status,
    400,
  )
  check("empty payload", (await call("PATCH", ep(project.id, memberUser.id), adminCookie, {})).status, 400)

  console.log("\n--- effective changes ---")
  const roleRes = await call("PATCH", ep(project.id, memberUser.id), adminCookie, { role: "reviewer" })
  check("role change accepted", roleRes.status, 200)
  const { data: afterRole } = await db
    .from("pr_project_members")
    .select("role, can_download")
    .eq("project_id", project.id)
    .eq("user_id", memberUser.id)
    .single()
  check("role persisted in DB", afterRole.role, "reviewer")
  check("can_download untouched by role change", afterRole.can_download, false)

  check(
    "download grant accepted",
    (await call("PATCH", ep(project.id, memberUser.id), adminCookie, { can_download: true })).status,
    200,
  )
  const { data: afterDl } = await db
    .from("pr_project_members")
    .select("role, can_download")
    .eq("project_id", project.id)
    .eq("user_id", memberUser.id)
    .single()
  check("can_download persisted", afterDl.can_download, true)
  check("role untouched by download change", afterDl.role, "reviewer")

  console.log("\n--- revocation ---")
  check("revoke accepted", (await call("DELETE", ep(project.id, memberUser.id), adminCookie)).status, 200)
  const { data: gone } = await db
    .from("pr_project_members")
    .select("id")
    .eq("project_id", project.id)
    .eq("user_id", memberUser.id)
    .maybeSingle()
  check("membership removed", gone === null, "true")
  check("second revoke is 404", (await call("DELETE", ep(project.id, memberUser.id), adminCookie)).status, 404)

  console.log("\n--- audit trail ---")
  const { data: logs } = await db
    .from("pr_audit_logs")
    .select("action, organization_id, metadata")
    .in("action", ["member.role_changed", "member.removed"])
    .order("created_at", { ascending: false })
    .limit(3)
  check("audit entries written", (logs ?? []).length >= 3, "true")
  check("audit scoped to organisation", (logs ?? []).every((l) => l.organization_id === org.id), "true")
  check(
    "previous role recorded",
    (logs ?? []).some((l) => l.metadata?.previous_role),
    "true",
  )
  check(
    "actor email denormalised",
    (logs ?? []).every((l) => typeof l.metadata?.actor_email === "string"),
    "true",
  )
  const removal = (logs ?? []).find((l) => l.action === "member.removed")
  check("removal kept the role it had", removal?.metadata?.previous_role, "reviewer")

  console.log(`\n${fail === 0 ? "TUTTI I CONTROLLI PASSATI" : "CI SONO FALLIMENTI"} — pass ${pass}, fail ${fail}`)
}

async function cleanup() {
  console.log("\n--- cleanup ---")
  for (const id of created.projects) await db.from("pr_project_members").delete().eq("project_id", id)
  await db.from("pr_audit_logs").delete().in("user_id", created.users)
  for (const id of created.users) {
    await db.from("pr_project_members").delete().eq("user_id", id)
    await db.from("pr_organization_members").delete().eq("user_id", id)
    await db.from("profiles").delete().eq("id", id)
    await db.auth.admin.deleteUser(id)
  }
  for (const id of created.projects) await db.from("pr_projects").delete().eq("id", id)
  for (const id of created.clients) await db.from("pr_clients").delete().eq("id", id)
  for (const id of created.orgs) await db.from("pr_organizations").delete().eq("id", id)
  console.log("fixtures rimosse")
}

try {
  await main()
} catch (err) {
  console.error("ERRORE:", err.message)
  fail++
} finally {
  await cleanup()
  process.exit(fail === 0 ? 0 : 1)
}
