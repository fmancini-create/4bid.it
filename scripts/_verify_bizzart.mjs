import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: all, error } = await supabase
  .from("sales_channel_quotes")
  .select("id, quote_number, title, client_name, client_company, token, status, view_count, first_viewed_at, last_viewed_at, updated_at")
  .order("created_at", { ascending: false })

if (error) {
  console.log("ERRORE:", error.message)
  process.exit(1)
}

for (const q of all) {
  console.log(
    JSON.stringify(
      {
        quote_number: q.quote_number,
        title: q.title,
        client_name: q.client_name,
        client_company: q.client_company,
        status: q.status,
        token: q.token,
        view_count: q.view_count,
        first_viewed_at: q.first_viewed_at,
        last_viewed_at: q.last_viewed_at,
        updated_at: q.updated_at,
      },
      null,
      2,
    ),
  )
}
