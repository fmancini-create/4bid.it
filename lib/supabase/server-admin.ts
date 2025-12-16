import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client with service role key for admin operations
// This bypasses Row Level Security (RLS) policies
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
