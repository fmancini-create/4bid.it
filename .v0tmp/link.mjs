import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email: "f.mancini@4bid.it" })
if (error) { console.error("ERRORE:", error.message); process.exit(1) }
// Non stampo il link intero: basta il token da consumare in locale.
console.log("token_hash:", data.properties.hashed_token)
console.log("tipo:", data.properties.verification_type)
