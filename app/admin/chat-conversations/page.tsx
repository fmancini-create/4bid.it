import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, AlertCircle, CheckCircle, MessageSquare, PlayCircle, TrendingUp, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { formatDateOnlyIT, formatDateTimeNumericIT } from "@/lib/date-utils"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

type EventMetadata = Record<string, unknown>

type AvatarConversation = {
  conversationId: string
  visitorName: string
  visitorCompany: string
  recipientEmail: string
  startedAt: string | null
  lastAt: string
  transcriptCount: number
  hasTranscript: boolean
  ended: boolean
}

type QuoteTavusSession = {
  id: string
  chat_conversation_id: string | null
  provider_conversation_id: string
  status: string | null
  transcript: unknown
  created_at: string
  ended_at: string | null
  metadata: EventMetadata | null
}

function asMetadata(value: unknown): EventMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as EventMetadata) : {}
}

function visibleTranscriptCount(value: unknown) {
  if (!Array.isArray(value)) return 0
  return value.filter((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false
    const row = item as Record<string, unknown>
    const role = String(row.role || "").toLowerCase()
    const content = typeof row.content === "string" ? row.content.trim() : ""
    return Boolean(content) && ["user", "assistant", "replica", "pal"].includes(role)
  }).length
}

export default async function ChatConversationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) redirect("/admin/login")

  const admin = createAdminClient()
  const [conversationResult, bankEventResult, quoteSessionResult] = await Promise.all([
    admin.from("chat_conversations").select("*").order("last_message_at", { ascending: false }),
    admin
      .from("business_plan_share_events")
      .select("id, created_at, event_type, recipient_email, metadata")
      .in("event_type", ["avatar_started", "avatar_connected", "avatar_ended", "avatar_transcript", "tavus_shutdown"])
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("quote_live_sales_sessions")
      .select("id, chat_conversation_id, provider_conversation_id, status, transcript, created_at, ended_at, metadata")
      .eq("provider", "tavus")
      .order("created_at", { ascending: false })
      .limit(250),
  ])

  if (conversationResult.error) console.error("[admin/chat-conversations] conversations fetch failed", conversationResult.error)
  if (bankEventResult.error) console.error("[admin/chat-conversations] bank Tavus fetch failed", bankEventResult.error)
  if (quoteSessionResult.error) console.error("[admin/chat-conversations] quote Tavus fetch failed", quoteSessionResult.error)

  const allConversations = conversationResult.data || []
  const quoteSessions = (quoteSessionResult.data || []) as QuoteTavusSession[]
  const conversationById = new Map(allConversations.map((conversation) => [conversation.id, conversation]))
  const quoteConversationIds = new Set(
    quoteSessions.map((session) => session.chat_conversation_id).filter(Boolean) as string[],
  )
  const supportConversations = allConversations.filter((conversation) => !quoteConversationIds.has(conversation.id))
  const activeSupport = supportConversations.filter((conversation) => conversation.status === "active")
  const escalatedSupport = supportConversations.filter((conversation) => conversation.status === "escalated")
  const closedSupport = supportConversations.filter((conversation) => conversation.status === "closed")

  const avatarMap = new Map<string, AvatarConversation>()

  for (const event of bankEventResult.data || []) {
    const metadata = asMetadata(event.metadata)
    const conversationId = String(metadata.conversation_id || "").trim()
    if (!conversationId) continue

    const existing = avatarMap.get(conversationId) || {
      conversationId,
      visitorName: "",
      visitorCompany: "",
      recipientEmail: "",
      startedAt: null,
      lastAt: event.created_at,
      transcriptCount: 0,
      hasTranscript: false,
      ended: false,
    }

    if (new Date(event.created_at).getTime() > new Date(existing.lastAt).getTime()) existing.lastAt = event.created_at

    if (event.event_type === "avatar_started") {
      existing.visitorName ||= String(metadata.visitor_name || "").trim()
      existing.visitorCompany ||= String(metadata.visitor_company || "").trim()
      existing.recipientEmail ||= String(metadata.visitor_email || event.recipient_email || "").trim()
      if (!existing.startedAt || new Date(event.created_at).getTime() < new Date(existing.startedAt).getTime()) {
        existing.startedAt = event.created_at
      }
    }

    if (event.event_type === "avatar_transcript") {
      const count = visibleTranscriptCount(metadata.transcript)
      if (!existing.hasTranscript || count > existing.transcriptCount) existing.transcriptCount = count
      existing.hasTranscript = true
      existing.recipientEmail ||= String(event.recipient_email || "").trim()
    }

    if (event.event_type === "avatar_ended" || event.event_type === "tavus_shutdown") existing.ended = true
    avatarMap.set(conversationId, existing)
  }

  const bankAvatarConversations = Array.from(avatarMap.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Attiva</Badge>
      case "escalated":
        return <Badge className="bg-red-500">Escalata</Badge>
      case "closed":
        return <Badge variant="secondary">Chiusa</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-50 border-b border-border bg-card"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold sm:text-2xl">Conversazioni AI</h1>
                <p className="hidden text-[10px] text-muted-foreground sm:block sm:text-sm">
                  Preventivi, dossier banca e supporto clienti in un unico punto
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {quoteSessions.length + bankAvatarConversations.length} Tavus
            </Badge>
          </div>
        </div>
      </header>

      <main
        className="container mx-auto space-y-4 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="grid grid-cols-2 gap-1.5 sm:gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-2.5 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground sm:text-sm">Preventivi Tavus</p>
                  <p className="text-lg font-bold text-violet-600 sm:text-3xl">{quoteSessions.length}</p>
                </div>
                <Video className="h-5 w-5 text-violet-500 sm:h-8 sm:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2.5 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground sm:text-sm">Dossier banca</p>
                  <p className="text-lg font-bold text-blue-600 sm:text-3xl">{bankAvatarConversations.length}</p>
                </div>
                <PlayCircle className="h-5 w-5 text-blue-500 sm:h-8 sm:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2.5 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground sm:text-sm">Supporto attivo</p>
                  <p className="text-lg font-bold text-green-600 sm:text-3xl">{activeSupport.length}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500 sm:h-8 sm:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2.5 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground sm:text-sm">Escalate</p>
                  <p className="text-lg font-bold text-red-600 sm:text-3xl">{escalatedSupport.length}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-500 sm:h-8 sm:w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Video className="h-5 w-5 text-violet-500" />
                Conversazioni Preventivi Tavus
              </CardTitle>
              <Badge variant="secondary">{quoteSessions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {quoteSessions.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Video className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>Nessuna conversazione video sui preventivi.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {quoteSessions.map((session) => {
                  const metadata = asMetadata(session.metadata)
                  const chat = session.chat_conversation_id ? conversationById.get(session.chat_conversation_id) : null
                  const transcriptCount = visibleTranscriptCount(session.transcript)
                  const clientName = String(metadata.client_name || "").trim()
                  const clientCompany = String(metadata.client_company || "").trim()
                  const quoteNumber = String(metadata.quote_number || "").trim()
                  const href = session.chat_conversation_id
                    ? `/admin/chat-conversations/${session.chat_conversation_id}`
                    : "#"

                  return (
                    <Link key={session.id} href={href} className="block">
                      <div className="flex touch-manipulation items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:p-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="max-w-[190px] truncate text-xs font-semibold sm:max-w-none sm:text-base">
                              {clientName || clientCompany || chat?.user_email || "Cliente preventivo"}
                            </h3>
                            {transcriptCount > 0 ? (
                              <Badge className="bg-emerald-600">{transcriptCount} interventi</Badge>
                            ) : session.status === "ended" ? (
                              <Badge className="bg-amber-600">Da sincronizzare</Badge>
                            ) : (
                              <Badge className="bg-violet-600">Sessione Tavus</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-sm">
                            {clientCompany ? <span>{clientCompany}</span> : null}
                            {quoteNumber ? <span>{quoteNumber}</span> : null}
                            {chat?.user_email ? <span>{chat.user_email}</span> : null}
                            <span>{formatDateTimeNumericIT(session.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-violet-600">
                          <span className="hidden sm:inline">Apri trascrizione</span>
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <PlayCircle className="h-5 w-5 text-blue-500" />
                Conversazioni Dossier Banca
              </CardTitle>
              <Badge variant="secondary">{bankAvatarConversations.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {bankAvatarConversations.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <PlayCircle className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>Nessuna conversazione Tavus sul dossier banca.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {bankAvatarConversations.map((conversation) => (
                  <Link
                    key={conversation.conversationId}
                    href={`/admin/chat-conversations/tavus/${encodeURIComponent(conversation.conversationId)}`}
                    className="block"
                  >
                    <div className="flex touch-manipulation items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:p-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className="max-w-[180px] truncate text-xs font-semibold sm:max-w-none sm:text-base">
                            {conversation.visitorName || conversation.recipientEmail || "Visitatore"}
                          </h3>
                          {conversation.hasTranscript ? (
                            <Badge className="bg-emerald-600">Trascritta</Badge>
                          ) : conversation.ended ? (
                            <Badge className="bg-amber-600">In elaborazione</Badge>
                          ) : (
                            <Badge className="bg-blue-600">Avviata</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-sm">
                          {conversation.visitorCompany ? <span>{conversation.visitorCompany}</span> : null}
                          {conversation.recipientEmail ? <span>{conversation.recipientEmail}</span> : null}
                          <span>{conversation.transcriptCount} interventi</span>
                          <span>{formatDateTimeNumericIT(conversation.startedAt || conversation.lastAt)}</span>
                        </div>
                      </div>
                      <PlayCircle className="h-5 w-5 shrink-0 text-blue-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm sm:text-lg">Conversazioni supporto</CardTitle>
              <div className="flex items-center gap-2">
                {closedSupport.length ? <Badge variant="outline">{closedSupport.length} chiuse</Badge> : null}
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {supportConversations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Nessuna conversazione di supporto al momento</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {supportConversations.map((conversation) => (
                  <Link key={conversation.id} href={`/admin/chat-conversations/${conversation.id}`} className="block">
                    <div className="flex touch-manipulation items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 active:bg-muted/70 sm:p-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-1.5 sm:gap-2">
                          <h3 className="max-w-[140px] truncate text-xs font-semibold sm:max-w-none sm:text-base">
                            {conversation.user_email}
                          </h3>
                          {getStatusBadge(conversation.status)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground sm:text-sm">
                          <span>{conversation.message_count} msg</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDateOnlyIT(conversation.last_message_at)}</span>
                        </div>
                      </div>
                      <ArrowLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
