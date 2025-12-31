import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Database, ExternalLink, Clock, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import KnowledgeBaseActions from "@/components/knowledge-base-actions"
import ExternalSiteCard from "@/components/external-site-card"
import KnowledgeItemActions from "@/components/knowledge-item-actions"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function KnowledgeBasePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    redirect("/admin/login")
  }

  // Fetch knowledge items with error handling
  const { data: knowledgeItems, error: knowledgeError } = await supabase
    .from("knowledge_base")
    .select("*")
    .order("updated_at", { ascending: false })

  // Fetch external sites with error handling
  const { data: externalSites, error: sitesError } = await supabase.from("external_sites").select("*").order("name")

  // Check if we're in a cache refresh state (tables exist but not in cache)
  const isCacheRefreshing = knowledgeError?.code === "PGRST205" || sitesError?.code === "PGRST205"

  if (isCacheRefreshing) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" asChild className="shrink-0">
                <Link href="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Knowledge Base AI</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gestisci le informazioni utilizzate dall'assistente AI
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <Card className="border-orange-500 max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                <CardTitle>Aggiornamento Cache in Corso</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Le tabelle del knowledge base sono state create con successo, ma la cache di Supabase si sta ancora
                aggiornando.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Cosa sta succedendo:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Le tabelle sono state create nel database</li>
                  <li>La cache PostgREST di Supabase si sta aggiornando (1-2 minuti)</li>
                  <li>Questo è un processo automatico normale</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Link href="/admin/knowledge-base" className="w-full">
                  <Button className="w-full">Ricarica Pagina</Button>
                </Link>
                <Link href="/admin" className="w-full">
                  <Button variant="outline" className="w-full bg-transparent">
                    Torna alla Dashboard
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Attendi 1-2 minuti e ricarica la pagina. Se il problema persiste dopo 5 minuti, contatta il supporto.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const allItems = knowledgeItems || []
  const activeItems = allItems.filter((item) => item.is_active)
  const bySource = allItems.reduce((acc: any, item: any) => {
    acc[item.source] = (acc[item.source] || 0) + 1
    return acc
  }, {})

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
                <h1 className="text-lg sm:text-2xl font-bold truncate">Knowledge Base AI</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gestisci le informazioni utilizzate dall'assistente AI
                </p>
              </div>
            </div>
            <KnowledgeBaseActions />
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
                  <p className="text-xl sm:text-3xl font-bold">{allItems.length}</p>
                  <p className="text-xs text-muted-foreground">{activeItems.length} attive</p>
                </div>
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Da Sito</p>
                  <p className="text-xl sm:text-3xl font-bold">{bySource["website"] || 0}</p>
                </div>
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Esterni</p>
                  <p className="text-xl sm:text-3xl font-bold">{bySource["external"] || 0}</p>
                </div>
                <ExternalLink className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Da Chat</p>
                  <p className="text-xl sm:text-3xl font-bold">{bySource["chat"] || 0}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* External Sites Section */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Siti Esterni da Crawlare</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3">
              {(externalSites || []).map((site: any) => (
                <ExternalSiteCard key={site.id} site={site} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Items List */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Tutte le Informazioni</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3">
              {allItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm sm:text-base">{item.title}</h3>
                      {item.is_active ? (
                        <Badge className="bg-green-500 text-xs">Attiva</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Disattivata
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.source}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">{item.content}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <span>Priorità: {item.priority}</span>
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Sorgente
                        </a>
                      )}
                      <span>
                        Aggiornato:{" "}
                        {new Date(item.updated_at).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <KnowledgeItemActions item={item} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
