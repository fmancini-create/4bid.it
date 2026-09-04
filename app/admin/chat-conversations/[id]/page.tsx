import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { reconcileTavusSession } from "@/lib/quotes/tavus-live-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Video } from "lucide-react"
import Link from "next/link"
import AdminReplyForm from "@/components/admin-reply-form"
import { formatDateIT } from "@/lib/date-utils"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== "f.mancini@4bid.it") {
    redirect("/admin/login")
  }

  const admin = createAdminClient()

  let { data: conversation, error: convError } = await admin
    .from("chat_conversations")
    .select("*")
    .eq("id", id)
    .single()

  if (convError || !conversation) {
    notFound()
  }

  let { data: messages, error: msgError } = await admin
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  if (msgError) {
    console.error("[chat-conversation] Error fetching messages:", msgError)
  }

  const { data: tavusSession } = await admin
    .from("quote_live_sales_sessions")
    .select("id, quote_id, chat_conversation_id, provider_conversation_id, status, transcript, created_at, ended_at, metadata")
    .eq("provider", "tavus")
    .eq("chat_conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Tavus mantiene il transcript completo sul provider. Lo rileggiamo ogni volta
  // che apri una video-conversazione: così recuperiamo anche sessioni storiche
  // che avevano ricevuto un callback parziale o nessun callback.
  if (tavusSession) {
    await reconcileTavusSession(admin, tavusSession)

    const [conversationResult, messagesResult] = await Promise.all([
      admin.from("chat_conversations").select("*").eq("id", id).single(),
      admin.from("chat_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
    ])

    if (conversationResult.data) conversation = conversationResult.data
    if (messagesResult.data) messages = messagesResult.data
  }

  const allMessages = messages || []

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/chat-conversations">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle conversazioni
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl mb-2">{conversation.user_email}</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(conversation.status)}
                  <Badge variant="outline">{conversation.account_type.toUpperCase()}</Badge>
                  {tavusSession ? (
                    <Badge variant="outline" className="gap-1 border-violet-200 bg-violet-50 text-violet-700">
                      <Video className="h-3 w-3" /> Video Tavus
                    </Badge>
                  ) : null}
                  <span className="text-sm text-muted-foreground">{conversation.message_count} messaggi</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Iniziata:</span>
                <p className="font-medium">
                  {formatDateIT(conversation.started_at, { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Ultimo messaggio:</span>
                <p className="font-medium">
                  {formatDateIT(conversation.last_message_at, { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{tavusSession ? "Trascrizione conversazione video" : "Cronologia Messaggi"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {allMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>{tavusSession ? "La trascrizione non è ancora disponibile da Tavus." : "Nessun messaggio"}</p>
                  {tavusSession ? <p className="mt-2 text-xs">Ricarica questa pagina dopo la chiusura della videochiamata: la sincronizzazione è automatica.</p> : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {allMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`${message.role === "user" ? "flex justify-end" : "flex justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : message.role === "admin"
                              ? "bg-green-100 text-green-900 border-2 border-green-300"
                              : message.role === "system"
                                ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
                                : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 gap-4">
                          <span className="text-xs font-semibold opacity-80">
                            {message.role === "user"
                              ? "Cliente"
                              : message.role === "admin"
                                ? "👤 Admin"
                                : message.role === "system"
                                  ? "🔔 Sistema"
                                  : tavusSession
                                    ? "Anna · AI 4BID"
                                    : "🤖 AI Assistant"}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatDateIT(message.created_at, { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {conversation.status !== "closed" && !tavusSession && (
          <Card>
            <CardHeader>
              <CardTitle>Rispondi come Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminReplyForm conversationId={conversation.id} userEmail={conversation.user_email} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
