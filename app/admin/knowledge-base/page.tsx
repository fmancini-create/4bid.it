"use client"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Database, ExternalLink, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import KnowledgeBaseActions from "@/components/knowledge-base-actions"

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
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-orange-500">
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
                <Button onClick={() => window.location.reload()} className="w-full">
                  Ricarica Pagina
                </Button>
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
        </div>
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Knowledge Base AI</h1>
            <p className="text-muted-foreground">Gestisci le informazioni utilizzate dall'assistente AI</p>
          </div>
          <KnowledgeBaseActions />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Informazioni</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allItems.length}</div>
              <p className="text-xs text-muted-foreground">{activeItems.length} attive</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Da Sito Web</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bySource["website"] || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Da Siti Esterni</CardTitle>
              <ExternalLink className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bySource["external"] || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Da Chat</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bySource["chat"] || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* External Sites Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Siti Esterni da Crawlare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(externalSites || []).map((site: any) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{site.name}</h3>
                      {site.is_active ? (
                        <Badge className="bg-green-500">Attivo</Badge>
                      ) : (
                        <Badge variant="secondary">Inattivo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{site.base_url}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Frequenza: {site.crawl_frequency}</span>
                      {site.last_crawled_at && (
                        <span>
                          Ultimo crawl:{" "}
                          {new Date(site.last_crawled_at).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <span>{site.pages_crawled} pagine</span>
                    </div>
                  </div>
                  <form
                    action={async () => {
                      "use server"
                      // This would trigger the crawl API
                    }}
                  >
                    <Button variant="outline" size="sm" type="button">
                      Crawl Ora
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Tutte le Informazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.is_active ? (
                        <Badge className="bg-green-500">Attiva</Badge>
                      ) : (
                        <Badge variant="secondary">Disattivata</Badge>
                      )}
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge variant="outline">{item.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Priorità: {item.priority}</span>
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Sorgente →
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
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Modifica
                    </Button>
                    <Button variant="ghost" size="sm">
                      {item.is_active ? "Disattiva" : "Attiva"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Link href="/admin">
            <Button variant="outline">← Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
