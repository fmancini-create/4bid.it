import { createClient } from "@supabase/supabase-js"

const db = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const id = process.argv[2]

const embed = await db
  .from("pr_document_versions")
  .select("id, document_id, file_path, pr_documents!inner(project_id)")
  .eq("id", id)
  .maybeSingle()
console.log("EMBED:", embed.error ? "ERROR -> " + embed.error.message : JSON.stringify(embed.data))

const plain = await db.from("pr_document_versions").select("id, document_id, file_path").eq("id", id).maybeSingle()
console.log("PLAIN:", plain.error ? "ERROR -> " + plain.error.message : JSON.stringify(plain.data))
