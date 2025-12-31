import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, TrendingUp, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="icon" asChild className="shrink-0">
                <Link href="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Conversazioni Chat AI</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gestisci tutte le conversazioni del supporto clienti AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Totale</p>
                  <p className="text-xl sm:text-3xl font-bold">{allConversations.length}</p>
                </div>
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Attive</p>
                  <p className="text-xl sm:text-3xl font-bold text-green-600">{activeConversations.length}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Escalate</p>
                  <p className="text-xl sm:text-3xl font-bold text-red-600">{escalatedConversations.length}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Chiuse</p>
                  <p className="text-xl sm:text-3xl font-bold">{closedConversations.length}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Tutte le Conversazioni</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {allConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna conversazione al momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{conversation.user_email}</h3>
                        {getStatusBadge(conversation.status)}
                        <Badge variant="outline" className="text-xs">
                          {conversation.account_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>{conversation.message_count} messaggi</span>
                        <span>
                          Ultimo:{" "}
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
                      <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                        Visualizza
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
