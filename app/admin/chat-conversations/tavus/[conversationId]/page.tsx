import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Bot, Building2, Clock3, Mail, MessageSquareText, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { formatDateTimeNumericIT } from "@/lib/date-utils"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

type EventMetadata = Record<string, unknown>

type TranscriptLine = {
  role: "user" | "assistant"
  content: string
  timestamp?: number | string | null
  durationMs?: number | null
}

function asMetadata(value: unknown): EventMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as EventMetadata) : {}
}

function transcriptLines(value: unknown): TranscriptLine[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return []
    const raw = item as Record<string, unknown>
    const rawRole = String(raw.role || "").toLowerCase()
    const role = rawRole === "user" ? "user" : ["assistant", "replica", "pal"].includes(rawRole) ? "assistant" : null
    const content = typeof raw.content === "string" ? raw.content.trim() : ""
    if (!role || !content) return []

    return [
      {
        role,
        content,
        timestamp: typeof raw.timestamp === "number" || typeof raw.timestamp === "string" ? raw.timestamp : null,
        durationMs: typeof raw.duration_ms === "number" ? raw.duration_ms : null,
      },
    ]
  })
}

function eventDate(value: number | string | null | undefined) {
  if (typeof value === "number") {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000
    return new Date(milliseconds).toISOString()
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return null
}

export default async function TavusConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) redirect("/admin/login")

  const admin = createAdminClient()
  const { data: events, error } = await admin
    .from("business_plan_share_events")
    .select("id, created_at, event_type, recipient_email, metadata")
    .contains("metadata", { conversation_id: conversationId })
    .in("event_type", ["avatar_started", "avatar_connected", "avatar_ended", "avatar_transcript", "tavus_shutdown"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/tavus-conversation] fetch failed", error)
  }

  if (!events?.length) notFound()

  const started = events.find((event) => event.event_type === "avatar_started")
  const transcriptEvent = events.find((event) => event.event_type === "avatar_transcript")
  const ended = events.find((event) => event.event_type === "avatar_ended")
  const shutdown = events.find((event) => event.event_type === "tavus_shutdown")

  const startedMeta = asMetadata(started?.metadata)
  const transcriptMeta = asMetadata(transcriptEvent?.metadata)
  const endedMeta = asMetadata(ended?.metadata)
  const shutdownMeta = asMetadata(shutdown?.metadata)
  const transcript = transcriptLines(transcriptMeta.transcript)

  const visitorName = String(startedMeta.visitor_name || "").trim()
  const visitorCompany = String(startedMeta.visitor_company || "").trim()
  const recipientEmail = String(startedMeta.visitor_email || started?.recipient_email || transcriptEvent?.recipient_email || "").trim()
  const endedReason = String(endedMeta.reason || shutdownMeta.shutdown_reason || "").trim()
  const startedAt = started?.created_at || transcriptEvent?.created_at || null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/admin/chat-conversations" aria-label="Torna alle conversazioni">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold sm:text-2xl">Trascrizione Avatar Tavus</h1>
              <Badge className={transcript.length ? "bg-emerald-600" : "bg-amber-600"}>
                {transcript.length ? "Trascritta" : "In elaborazione"}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">ID {conversationId}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-4 px-3 py-4 sm:px-4 sm:py-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dettagli conversazione</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Interlocutore</p>
                <p className="font-medium">{visitorName || "Visitatore"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Azienda</p>
                <p className="font-medium">{visitorCompany || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate font-medium">{recipientEmail || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Avviata</p>
                <p className="font-medium">{startedAt ? formatDateTimeNumericIT(startedAt) : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="h-5 w-5" />
                Trascrizione
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{transcript.length} interventi</span>
                {endedReason ? <Badge variant="outline">Fine: {endedReason}</Badge> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transcript.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                La conversazione è stata registrata, ma Tavus non ha ancora consegnato la trascrizione finale.
              </div>
            ) : (
              <div className="space-y-3">
                {transcript.map((line, index) => {
                  const timestamp = eventDate(line.timestamp)
                  const isAssistant = line.role === "assistant"
                  return (
                    <div
                      key={`${line.role}-${index}`}
                      className={`flex gap-3 rounded-xl border p-3 sm:p-4 ${isAssistant ? "bg-muted/40" : "bg-background"}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAssistant ? "bg-primary text-primary-foreground" : "bg-emerald-100 text-emerald-800"}`}>
                        {isAssistant ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {isAssistant ? "Anna" : visitorName || "Utente"}
                          </span>
                          {timestamp ? <span className="text-[11px] text-muted-foreground">{formatDateTimeNumericIT(timestamp)}</span> : null}
                          {line.durationMs ? <span className="text-[11px] text-muted-foreground">{(line.durationMs / 1000).toFixed(1)}s</span> : null}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6">{line.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
