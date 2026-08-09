import { createClient } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/admin-config"

/**
 * Returns the authenticated super-admin user, or null if the caller is not
 * signed in as an authorized administrator. Use in every careers back-office
 * API route and page: candidatures contain personal data and CVs.
 */
export async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isSuperAdminEmail(user.email)) return null
  return user
}
