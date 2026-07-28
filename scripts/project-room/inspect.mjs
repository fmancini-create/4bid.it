/**
 * Read-only inspection of the Project Room data, used during development to
 * confirm what the seed actually produced. Never mutates anything.
 *
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/project-room/inspect.mjs
 */

import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.log("[v0] missing Supabase env", { hasUrl: Boolean(url), hasKey: Boolean(key) })
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

const TABLES = [
  "pr_organizations",
  "pr_clients",
  "pr_projects",
  "pr_documents",
  "pr_document_versions",
  "pr_project_members",
  "pr_organization_members",
  "pr_comments",
  "pr_revision_proposals",
  "pr_access_requests",
  "pr_invitations",
]

for (const table of TABLES) {
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true })
  console.log(table.padEnd(26), error ? `ERR ${error.message}` : count)
}

const { data: projects } = await db.from("pr_projects").select("id, name, slug, status")
console.log("\nprojects:", JSON.stringify(projects, null, 1))

const { data: versions } = await db
  .from("pr_document_versions")
  .select("id, document_id, version_label, file_path, file_name, page_count, status")
console.log("\nversions:", JSON.stringify(versions, null, 1))

const { data: members } = await db.from("pr_project_members").select("project_id, user_id, role, can_download")
console.log("\nproject members:", JSON.stringify(members, null, 1))

const { data: objects, error: storageError } = await db.storage.from("project-room").list("", { limit: 50 })
console.log("\nstorage root:", storageError ? storageError.message : JSON.stringify(objects?.map((o) => o.name)))

const { data: users, error: usersError } = await db.auth.admin.listUsers({ perPage: 20 })
console.log(
  "\nauth users:",
  usersError ? usersError.message : JSON.stringify(users.users.map((u) => ({ id: u.id, email: u.email }))),
)
