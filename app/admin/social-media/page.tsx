import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import SocialMediaDashboard from "./social-media-dashboard"

export const metadata: Metadata = {
  title: "Gestione Social Media | Admin 4BID.IT",
  description: "Gestisci i social media con AI",
}

export default async function SocialMediaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch social accounts
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch posts
  const { data: posts } = await supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch settings
  const { data: settings } = await supabase.from("social_settings").select("*").single()

  // Fetch topic rules - usa admin client perche' la tabella ha RLS senza policy permissive
  const supabaseAdmin = createAdminClient()
  const { data: topicRules } = await supabaseAdmin
    .from("social_topic_rules")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <SocialMediaDashboard
      initialAccounts={accounts || []}
      initialPosts={posts || []}
      initialSettings={settings || null}
      initialTopicRules={topicRules || []}
      userEmail={user.email || ""}
    />
  )
}
