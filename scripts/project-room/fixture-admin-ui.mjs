/**
 * Temporary fixture for VISUAL verification of the admin "Accessi" tab.
 *
 * Creates an isolated organisation (so nothing touches the real 4Bid data) with
 * one admin to log in as, plus members covering every role branch of the UI —
 * including an `admin` member, which renders the read-only role cell because
 * `admin` is not in INVITABLE_ROLES.
 *
 *   node scripts/project-room/fixture-admin-ui.mjs setup
 *   node scripts/project-room/fixture-admin-ui.mjs teardown
 */
import { createClient } from "@supabase/supabase-js"
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs"

const SB_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SB_URL || !SERVICE) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const db = createClient(SB_URL, SERVICE, { auth: { persistSession: false } })
const STATE = "/tmp/pr-admin-ui-fixture.json"

async function mkUser(email, password, first, last) {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  const id = data.user.id
  // A trigger on auth.users (pr_on_auth_user_created -> pr_handle_new_user)
  // already created the profile row, so this must upsert, never insert.
  const { error: pErr } = await db
    .from("profiles")
    .upsert({ id, email, first_name: first, last_name: last }, { onConflict: "id" })
  if (pErr) throw new Error(`profiles ${email}: ${pErr.message}`)
  return id
}

async function setup() {
  const stamp = Date.now()
  const password = `UiFix!${stamp}aA1`
  const state = { stamp, password, users: [], orgs: [], clients: [], projects: [] }

  const { data: org, error: oErr } = await db
    .from("pr_organizations")
    .insert({ name: `UI Fixture Org ${stamp}`, slug: `ui-fix-${stamp}` })
    .select("id")
    .single()
  if (oErr) throw new Error(`pr_organizations: ${oErr.message}`)
  state.orgs.push(org.id)

  const { data: client, error: cErr } = await db
    .from("pr_clients")
    .insert({ organization_id: org.id, name: "Immobiliare Verifica", slug: `imm-verifica-${stamp}` })
    .select("id")
    .single()
  if (cErr) throw new Error(`pr_clients: ${cErr.message}`)
  state.clients.push(client.id)

  const { data: project, error: prErr } = await db
    .from("pr_projects")
    .insert({
      organization_id: org.id,
      client_id: client.id,
      name: "Piano di Acquisizione Verifica",
      slug: `piano-verifica-${stamp}`,
      status: "in_revisione",
    })
    .select("id")
    .single()
  if (prErr) throw new Error(`pr_projects: ${prErr.message}`)
  state.projects.push(project.id)

  // The admin we log in as.
  const adminEmail = `ui.admin+${stamp}@4bid.test`
  const adminId = await mkUser(adminEmail, password, "Ada", "Verifica")
  state.users.push(adminId)
  state.adminEmail = adminEmail
  const { error: omErr } = await db
    .from("pr_organization_members")
    .insert({ organization_id: org.id, user_id: adminId, role: "admin" })
  if (omErr) throw new Error(`pr_organization_members: ${omErr.message}`)

  // One member per role branch, including `admin` (read-only cell).
  // Exactly the values allowed by pr_project_members_role_check / PROJECT_ROLES.
  const members = [
    { role: "reader", can_download: false, first: "Rita", last: "Lettrice" },
    { role: "commenter", can_download: false, first: "Carlo", last: "Commentatore" },
    { role: "reviewer", can_download: true, first: "Remo", last: "Revisore" },
    { role: "project_manager", can_download: true, first: "Piera", last: "Manager" },
    { role: "admin", can_download: true, first: "Ada", last: "Amministratrice" },
  ]
  for (const m of members) {
    // Prefixed with `member.` so the project-level `admin` member does not
    // collide with the organisation admin created above.
    const email = `ui.member.${m.role}+${stamp}@4bid.test`
    const id = await mkUser(email, password, m.first, m.last)
    state.users.push(id)
    const { error } = await db
      .from("pr_project_members")
      .insert({ project_id: project.id, user_id: id, role: m.role, can_download: m.can_download })
    if (error) throw new Error(`pr_project_members ${m.role}: ${error.message}`)
  }

  // A second project with no members, to check the empty state.
  const { data: empty, error: eErr } = await db
    .from("pr_projects")
    .insert({
      organization_id: org.id,
      client_id: client.id,
      name: "Progetto Senza Accessi",
      slug: `senza-accessi-${stamp}`,
      status: "bozza",
    })
    .select("id")
    .single()
  if (eErr) throw new Error(`pr_projects empty: ${eErr.message}`)
  state.projects.push(empty.id)

  writeFileSync(STATE, JSON.stringify(state, null, 2))
  console.log("FIXTURE PRONTA")
  console.log("email   :", adminEmail)
  console.log("password:", password)
}

async function teardown() {
  if (!existsSync(STATE)) {
    console.log("nessuna fixture da rimuovere")
    return
  }
  const state = JSON.parse(readFileSync(STATE, "utf8"))
  for (const id of state.projects ?? []) {
    await db.from("pr_project_members").delete().eq("project_id", id)
    await db.from("pr_audit_logs").delete().eq("project_id", id)
  }
  for (const id of state.users ?? []) {
    await db.from("pr_audit_logs").delete().eq("user_id", id)
    await db.from("pr_project_members").delete().eq("user_id", id)
    await db.from("pr_organization_members").delete().eq("user_id", id)
    await db.from("profiles").delete().eq("id", id)
    await db.auth.admin.deleteUser(id).catch(() => {})
  }
  for (const id of state.projects ?? []) await db.from("pr_projects").delete().eq("id", id)
  for (const id of state.clients ?? []) await db.from("pr_clients").delete().eq("id", id)
  for (const id of state.orgs ?? []) await db.from("pr_organizations").delete().eq("id", id)
  unlinkSync(STATE)
  console.log("fixture rimossa")
}

const cmd = process.argv[2]
const run = cmd === "teardown" ? teardown : setup
run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("errore:", err.message)
    if (cmd !== "teardown") await teardown().catch(() => {})
    process.exit(1)
  })
