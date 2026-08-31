import Image from "next/image"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server-admin"
import FeedbackForm from "./feedback-form"

export const metadata = {
  title: "Feedback preventivo 4BID",
  robots: { index: false, follow: false },
}

export default async function QuoteFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("sales_channel_quotes")
    .select("title, quote_number, client_company, client_name, expires_at, accepted_at, status, feedback_received_at")
    .eq("token", token)
    .maybeSingle()

  if (error || !data) notFound()

  const accepted = Boolean(data.accepted_at) || data.status === "accepted" || data.status === "paid"
  const expired = data.expires_at ? new Date(data.expires_at).getTime() <= Date.now() : false
  if (accepted || !expired) notFound()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto" priority />
          <span className="text-sm text-muted-foreground">Feedback preventivo</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{data.client_company || data.client_name}</p>
          <p>{data.quote_number ? `Preventivo ${data.quote_number} · ` : ""}{data.title}</p>
        </div>
        {data.feedback_received_at ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">Feedback già ricevuto</h1>
            <p className="mt-2 text-muted-foreground">Grazie, la risposta risulta già registrata.</p>
          </div>
        ) : (
          <FeedbackForm token={token} />
        )}
      </main>
    </div>
  )
}
