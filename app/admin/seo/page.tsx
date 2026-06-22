import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { SOLUTIONS } from "@/lib/seo/solutions"
import SeoDashboard from "./seo-dashboard"

export const metadata: Metadata = {
  title: "Monitor SEO | Admin 4BID.IT",
  description: "Monitoraggio query reali, keyword di settore e ottimizzazioni assistite dall'AI",
}

export default async function SeoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Pagine ottimizzabili (slug + titolo) per il generatore di suggerimenti.
  const pages = SOLUTIONS.map((s) => ({ slug: `/${s.slug}`, title: s.title }))

  return <SeoDashboard userEmail={user.email || ""} pages={pages} />
}
