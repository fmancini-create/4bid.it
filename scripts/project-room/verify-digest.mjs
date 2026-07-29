/**
 * Collaudo del riepilogo di fine sessione SENZA spedire email.
 *
 * Interroga il database reale e stampa cosa il cron farebbe adesso: quali eventi
 * vede, se considera la sessione aperta o chiusa, e a chi manderebbe la mail.
 *
 * Uso:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/project-room/verify-digest.mjs
 */

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const db = createClient(url, key)

const QUIET_MINUTES = 5
const UNDELIVERABLE = [".test", ".invalid", ".example", ".localhost", ".local"]

const { data: projects } = await db.from("pr_projects").select("id, name, slug").neq("status", "archiviato")

for (const p of projects ?? []) {
  console.log(`\n=== ${p.name} (${p.slug}) ===`)

  const { data: state } = await db
    .from("pr_digest_state")
    .select("notified_through, last_sent_at, last_recipients, attempts, last_error, locked_until")
    .eq("project_id", p.id)
    .maybeSingle()

  const since = state?.notified_through ?? new Date(Date.now() - 30 * 60_000).toISOString()
  console.log(`  watermark : ${since}${state ? "" : "  (stato non ancora creato -> lookback 30 min)"}`)
  if (state?.last_sent_at) console.log(`  ultimo invio: ${state.last_sent_at} a ${state.last_recipients} destinatari`)
  if (state?.attempts) console.log(`  tentativi falliti: ${state.attempts} — ${state.last_error ?? ""}`)

  const { data: docs } = await db.from("pr_documents").select("id, title").eq("project_id", p.id)
  const docIds = (docs ?? []).map((d) => d.id)

  const [{ data: comments }, { data: revisions }, { data: versions }] = await Promise.all([
    db.from("pr_comments").select("created_at, content").eq("project_id", p.id).is("deleted_at", null).gt("created_at", since),
    db.from("pr_revision_proposals").select("created_at").eq("project_id", p.id).gt("created_at", since),
    docIds.length
      ? db.from("pr_document_versions").select("created_at").in("document_id", docIds).gt("created_at", since)
      : Promise.resolve({ data: [] }),
  ])

  const all = [...(comments ?? []), ...(revisions ?? []), ...(versions ?? [])].map((r) => r.created_at).sort()
  console.log(`  eventi nuovi: ${all.length}  (commenti ${comments?.length ?? 0}, revisioni ${revisions?.length ?? 0}, versioni ${versions?.length ?? 0})`)

  if (all.length === 0) {
    console.log("  ESITO: nessuna novita -> nessuna mail")
    continue
  }

  const last = all[all.length - 1]
  const quietMin = (Date.now() - new Date(last).getTime()) / 60_000
  console.log(`  ultimo evento: ${last}  (${quietMin.toFixed(1)} min di silenzio)`)

  if (quietMin < QUIET_MINUTES) {
    console.log(`  ESITO: sessione ANCORA APERTA (serve ${QUIET_MINUTES} min) -> attende`)
    continue
  }

  // Destinatari: membri progetto + admin organizzazione.
  const { data: members } = await db.from("pr_project_members").select("user_id").eq("project_id", p.id)
  const { data: proj } = await db.from("pr_projects").select("organization_id").eq("id", p.id).maybeSingle()
  const ids = new Set((members ?? []).map((m) => m.user_id))
  if (proj?.organization_id) {
    const { data: admins } = await db
      .from("pr_organization_members")
      .select("user_id")
      .eq("organization_id", proj.organization_id)
      .eq("role", "admin")
    for (const a of admins ?? []) ids.add(a.user_id)
  }
  const { data: profiles } = await db.from("profiles").select("email").in("id", [...ids])
  const recipients = [
    ...new Set(
      (profiles ?? [])
        .map((r) => (r.email ?? "").trim().toLowerCase())
        .filter((e) => e.includes("@") && !UNDELIVERABLE.some((t) => e.split("@")[1]?.endsWith(t))),
    ),
  ]

  console.log(`  ESITO: MANDEREBBE la mail a ${recipients.length}: ${recipients.join(", ")}`)
}

console.log("\nNessuna email e stata inviata da questo script.")
