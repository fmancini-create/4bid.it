import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function ChatConversationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    redirect("/admin/login")
  }

  // Fetch all conversations
  const { data: conversations, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching conversations:", error)
  }

  const allConversations = conversations || []
  const activeConversations = allConversations.filter((c) => c.status === "active")
  const escalatedConversations = allConversations.filter((c) => c.status === "escalated")
  const closedConversations = allConversations.filter((c) => c.status === "closed")

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Conversazioni Chat AI</h1>
          <p className="text-muted-foreground">Gestisci tutte le conversazioni del supporto clienti AI</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Conversazioni</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allConversations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attive</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeConversations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalate</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{escalatedConversations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiuse</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedConversations.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Tutte le Conversazioni</CardTitle>
          </CardHeader>
          <CardContent>
            {allConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna conversazione al momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{conversation.user_email}</h3>
                        {getStatusBadge(conversation.status)}
                        <Badge variant="outline">{conversation.account_type.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{conversation.message_count} messaggi</span>
                        <span>
                          Ultimo messaggio:{" "}
                          {new Date(conversation.last_message_at).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <Link href={`/admin/chat-conversations/${conversation.id}`}>
                      <Button variant="outline">Visualizza</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Link href="/admin">
            <Button variant="outline">← Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
