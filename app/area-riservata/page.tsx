import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Entry point of the reserved area.
 *
 * This route is public (see the proxy allow-list) precisely so it can decide
 * where to send the visitor: an authenticated user goes to their projects, a
 * visitor goes to the login screen.
 */
export default async function AreaRiservataPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/area-riservata/progetti")
  }

  redirect("/area-riservata/login")
}
