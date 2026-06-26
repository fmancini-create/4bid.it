import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key for admin operations
// This bypasses Row Level Security (RLS) policies
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase admin env vars")

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
