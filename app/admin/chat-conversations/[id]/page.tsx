import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import AdminReplyForm from "@/components/admin-reply-form"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    redirect("/admin/login")
  }

  // Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", id)
    .single()

  if (convError || !conversation) {
    notFound()
  }

  // Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  if (msgError) {
    console.error("[v0] Error fetching messages:", msgError)
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

        {/* Conversation Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{conversation.user_email}</CardTitle>
                <div className="flex items-center gap-3">
                  {getStatusBadge(conversation.status)}
                  <Badge variant="outline">{conversation.account_type.toUpperCase()}</Badge>
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
                  {new Date(conversation.started_at).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Ultimo messaggio:</span>
                <p className="font-medium">
                  {new Date(conversation.last_message_at).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cronologia Messaggi</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {allMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun messaggio</p>
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
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold opacity-80">
                            {message.role === "user"
                              ? "Utente"
                              : message.role === "admin"
                                ? "👤 Admin"
                                : message.role === "system"
                                  ? "🔔 Sistema"
                                  : "🤖 AI Assistant"}
                          </span>
                          <span className="text-xs opacity-70">
                            {new Date(message.created_at).toLocaleString("it-IT", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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

        {/* Admin Reply Form */}
        {conversation.status !== "closed" && (
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
