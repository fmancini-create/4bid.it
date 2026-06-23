"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Search,
  TrendingUp,
  Target,
  Lightbulb,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

type GscRow = { query: string; page?: string; clicks: number; impressions: number; ctr: number; position: number }
type TrendPoint = { date: string; position: number; clicks: number; impressions: number; ctr: number }
type KeywordRow = {
  id: string
  keyword: string
  search_volume: number | null
  competition: number | null
  competition_level: string | null
  cpc: number | null
}
type Suggestion = {
  id: string
  page_path: string
  target_query: string | null
  current_title: string | null
  suggested_title: string | null
  suggested_description: string | null
  suggested_h1: string | null
  suggested_paragraph: string | null
  rationale: string | null
  status: string
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export default function SeoDashboard({
  userEmail,
  pages,
}: {
  userEmail: string
  pages: { slug: string; title: string }[]
}) {
  const { toast } = useToast()
  const [days, setDays] = useState("28")

  const queriesKey = `/api/admin/seo/queries?days=${days}`
  const { data: queriesData, isLoading: queriesLoading, mutate: mutateQueries } = useSWR(queriesKey, fetcher)
  const { data: keywordsData, mutate: mutateKeywords } = useSWR("/api/admin/seo/keywords", fetcher)
  const { data: suggData, mutate: mutateSugg } = useSWR("/api/admin/seo/suggestions", fetcher)

  const gscConfigured = queriesData ? queriesData.configured !== false : true
  const topQueries: GscRow[] = queriesData?.topQueries || []
  const opportunities: GscRow[] = queriesData?.opportunities || []
  const keywords: KeywordRow[] = keywordsData?.keywords || []
  const dfsConfigured = keywordsData ? keywordsData.configured !== false : true
  const suggestions: Suggestion[] = suggData?.suggestions || []

  // Trend dialog
  const [trendQuery, setTrendQuery] = useState<string | null>(null)
  const { data: trendData, isLoading: trendLoading } = useSWR(
    trendQuery ? `/api/admin/seo/trend?query=${encodeURIComponent(trendQuery)}&days=90` : null,
    fetcher,
  )
  const trend: TrendPoint[] = trendData?.trend || []

  // Keyword research
  const [seeds, setSeeds] = useState("revenue management hotel")
  const [researching, setResearching] = useState(false)

  async function runResearch() {
    setResearching(true)
    try {
      const res = await fetch("/api/admin/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seeds: seeds.split(",").map((s) => s.trim()).filter(Boolean) }),
      })
      const json = await res.json()
      if (json.configured === false) {
        toast({ title: "DataForSEO non configurato", description: json.message, variant: "destructive" })
      } else if (json.error) {
        toast({ title: "Errore", description: json.error, variant: "destructive" })
      } else {
        toast({ title: "Ricerca completata", description: `${json.inserted} keyword aggiornate.` })
        mutateKeywords()
      }
    } finally {
      setResearching(false)
    }
  }

  // AI suggestion generation
  const [genOpen, setGenOpen] = useState(false)
  const [genPage, setGenPage] = useState(pages[0]?.slug || "")
  const [genQuery, setGenQuery] = useState("")
  const [generating, setGenerating] = useState(false)

  function openGenerator(prefillQuery?: string, prefillPage?: string) {
    if (prefillQuery) setGenQuery(prefillQuery)
    if (prefillPage) setGenPage(prefillPage)
    setGenOpen(true)
  }

  async function generateSuggestion() {
    if (!genPage || !genQuery.trim()) {
      toast({ title: "Dati mancanti", description: "Seleziona pagina e query.", variant: "destructive" })
      return
    }
    setGenerating(true)
    try {
      const currentTitle = pages.find((p) => p.slug === genPage)?.title || ""
      const res = await fetch("/api/admin/seo/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagePath: genPage, targetQuery: genQuery.trim(), currentTitle }),
      })
      const json = await res.json()
      if (json.error) {
        toast({
          title: "Errore",
          description: json.detail ? `${json.error} (${json.detail})` : json.error,
          variant: "destructive",
        })
      } else {
        toast({ title: "Suggerimento generato", description: "Trovi la proposta nella tab Suggerimenti." })
        setGenOpen(false)
        setGenQuery("")
        mutateSugg()
      }
    } finally {
      setGenerating(false)
    }
  }

  async function updateSuggestion(id: string, status: string) {
    await fetch(`/api/admin/seo/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    mutateSugg()
  }

  const pendingCount = suggestions.filter((s) => s.status === "pending").length

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Monitor SEO</h1>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin
            </a>
          </Button>
        </div>

        <Tabs defaultValue="queries" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="queries" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Query reali
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-2">
              <Target className="h-4 w-4" /> Opportunità
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-2">
              <Search className="h-4 w-4" /> Keyword di settore
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Lightbulb className="h-4 w-4" /> Suggerimenti
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB: Query reali */}
          <TabsContent value="queries" className="space-y-4">
            {!gscConfigured && <GscSetupPanel email={queriesData?.serviceAccountEmail} message={queriesData?.message} />}
            <div className="flex items-center justify-between gap-3">
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="28">Ultimi 28 giorni</SelectItem>
                  <SelectItem value="90">Ultimi 3 mesi</SelectItem>
                  <SelectItem value="180">Ultimi 6 mesi</SelectItem>
                  <SelectItem value="365">Ultimi 12 mesi</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => mutateQueries()} disabled={queriesLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${queriesLoading ? "animate-spin" : ""}`} />
                Aggiorna
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Query che portano traffico</CardTitle>
                <CardDescription>
                  Dati reali da Google Search Console. Clicca una query per vedere l&apos;andamento della posizione.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {queriesLoading ? (
                  <LoadingRow />
                ) : topQueries.length === 0 ? (
                  <EmptyRow text={gscConfigured ? "Nessun dato disponibile per il periodo." : "Completa il setup di Search Console."} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead className="text-right">Clic</TableHead>
                          <TableHead className="text-right">Impression</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Posizione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topQueries.slice(0, 100).map((r) => (
                          <TableRow
                            key={r.query}
                            className="cursor-pointer"
                            onClick={() => setTrendQuery(r.query)}
                          >
                            <TableCell className="font-medium">{r.query}</TableCell>
                            <TableCell className="text-right">{r.clicks}</TableCell>
                            <TableCell className="text-right">{r.impressions}</TableCell>
                            <TableCell className="text-right">{pct(r.ctr)}</TableCell>
                            <TableCell className="text-right">{r.position.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Opportunità */}
          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Opportunità in prima pagina</CardTitle>
                <CardDescription>
                  Query in posizione 8-20: sei a un passo dalla prima pagina. Ottimizza queste per il massimo ritorno.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {queriesLoading ? (
                  <LoadingRow />
                ) : opportunities.length === 0 ? (
                  <EmptyRow text="Nessuna opportunità in questo intervallo (o setup non completato)." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead>Pagina</TableHead>
                          <TableHead className="text-right">Impr.</TableHead>
                          <TableHead className="text-right">Pos.</TableHead>
                          <TableHead className="text-right">Azione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {opportunities.map((r, i) => {
                          const path = pagePathFromUrl(r.page)
                          return (
                            <TableRow key={`${r.query}-${i}`}>
                              <TableCell className="font-medium">{r.query}</TableCell>
                              <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{path}</TableCell>
                              <TableCell className="text-right">{r.impressions}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{r.position.toFixed(1)}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => openGenerator(r.query, path)}>
                                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                                  Ottimizza
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Keyword di settore */}
          <TabsContent value="keywords" className="space-y-4">
            {!dfsConfigured && <DataForSeoSetupPanel message={keywordsData?.message} />}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scopri keyword di settore</CardTitle>
                <CardDescription>
                  Volumi reali da DataForSEO (mercato Italia). Inserisci una o più keyword seed separate da virgola.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={seeds}
                    onChange={(e) => setSeeds(e.target.value)}
                    placeholder="es. revenue management hotel, dynamic pricing"
                  />
                  <Button onClick={runResearch} disabled={researching}>
                    {researching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Cerca
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {keywords.length === 0 ? (
                  <EmptyRow text="Nessuna keyword ancora. Avvia una ricerca qui sopra." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead className="text-right">Volume/mese</TableHead>
                          <TableHead className="text-right">Competizione</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                          <TableHead className="text-right">Stato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywords.slice(0, 200).map((k) => {
                          const covered = topQueries.some(
                            (q) => q.query.toLowerCase() === k.keyword.toLowerCase(),
                          )
                          return (
                            <TableRow key={k.id}>
                              <TableCell className="font-medium">{k.keyword}</TableCell>
                              <TableCell className="text-right">
                                {k.search_volume != null ? k.search_volume.toLocaleString("it-IT") : "n/d"}
                              </TableCell>
                              <TableCell className="text-right">
                                {k.competition_level || (k.competition != null ? k.competition.toFixed(2) : "n/d")}
                              </TableCell>
                              <TableCell className="text-right">
                                {k.cpc != null ? `€${k.cpc.toFixed(2)}` : "n/d"}
                              </TableCell>
                              <TableCell className="text-right">
                                {covered ? (
                                  <Badge variant="secondary">Già presidiata</Badge>
                                ) : (
                                  <Badge className="bg-primary text-primary-foreground">Gap</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Suggerimenti */}
          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openGenerator()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Genera suggerimento
              </Button>
            </div>
            {suggestions.length === 0 ? (
              <EmptyRow text="Nessun suggerimento. Generane uno dalle Opportunità o qui sopra." />
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <SuggestionCard key={s.id} s={s} onUpdate={updateSuggestion} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Trend dialog */}
      <Dialog open={!!trendQuery} onOpenChange={(o) => !o && setTrendQuery(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Andamento posizione</DialogTitle>
            <DialogDescription>&quot;{trendQuery}&quot; — ultimi 90 giorni</DialogDescription>
          </DialogHeader>
          {trendLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nessun dato di trend per questa query.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Generator dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">Genera suggerimento di ottimizzazione</DialogTitle>
            <DialogDescription>
              L&apos;AI propone title, descrizione, H1 e un paragrafo. Nessun dato inventato: tu approvi e applichi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Pagina</label>
              <Select value={genPage} onValueChange={setGenPage}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona pagina" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Query target</label>
              <Input value={genQuery} onChange={(e) => setGenQuery(e.target.value)} placeholder="es. revenue management agriturismo" />
            </div>
            <Button onClick={generateSuggestion} disabled={generating} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Genera
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SuggestionCard({ s, onUpdate }: { s: Suggestion; onUpdate: (id: string, status: string) => void }) {
  const statusBadge =
    s.status === "approved" ? (
      <Badge className="bg-green-600 text-white">Approvato</Badge>
    ) : s.status === "dismissed" ? (
      <Badge variant="secondary">Scartato</Badge>
    ) : (
      <Badge className="bg-primary text-primary-foreground">Da rivedere</Badge>
    )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
            <a href={s.page_path} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
              {s.page_path} <ExternalLink className="h-3 w-3" />
            </a>
          </CardTitle>
          {statusBadge}
        </div>
        {s.target_query && (
          <CardDescription>
            Query target: <span className="font-medium text-foreground">{s.target_query}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Field label="Title proposto" value={s.suggested_title} />
        <Field label="Meta description" value={s.suggested_description} />
        <Field label="H1 proposto" value={s.suggested_h1} />
        <Field label="Paragrafo aggiuntivo" value={s.suggested_paragraph} />
        {s.rationale && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Perché</p>
            <p className="text-sm">{s.rationale}</p>
          </div>
        )}
        {s.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => onUpdate(s.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="h-4 w-4 mr-1" /> Approva
            </Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(s.id, "dismissed")}>
              <X className="h-4 w-4 mr-1" /> Scarta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p>{value}</p>
    </div>
  )
}

function GscSetupPanel({ email, message }: { email?: string | null; message?: string }) {
  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" /> Setup Google Search Console
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-yellow-900 space-y-2">
        <p>{message || "Per leggere le query reali serve collegare un service account a Search Console."}</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Imposta le variabili <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> e <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>.</li>
          <li>Abilita la &quot;Google Search Console API&quot; nel progetto Google Cloud del service account.</li>
          <li>
            In Search Console → Impostazioni → Utenti e autorizzazioni, aggiungi come utente
            {email ? (
              <span className="font-mono"> {email}</span>
            ) : (
              <span> l&apos;email del service account</span>
            )}
            {" "}sulla property <span className="font-mono">sc-domain:4bid.it</span>.
          </li>
        </ol>
      </CardContent>
    </Card>
  )
}

function DataForSeoSetupPanel({ message }: { message?: string }) {
  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" /> Setup DataForSEO
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-yellow-900 space-y-2">
        <p>{message || "Per scoprire le keyword di settore con volumi reali serve un account DataForSEO."}</p>
        <p>
          Imposta le variabili <code>DATAFORSEO_LOGIN</code> e <code>DATAFORSEO_PASSWORD</code> nelle impostazioni del progetto.
        </p>
      </CardContent>
    </Card>
  )
}

function LoadingRow() {
  return (
    <div className="h-40 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-10 text-center">{text}</p>
}

/** Estrae il path relativo da un URL completo di GSC (https://www.4bid.it/slug -> /slug). */
function pagePathFromUrl(url?: string): string {
  if (!url) return ""
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
