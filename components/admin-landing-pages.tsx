"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  Eye,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"

interface DailyStats {
  date: string
  views: number
  conversions: number
}

interface LandingPage {
  id: string
  slug: string
  title: string
  category: string
  project_name?: string
  views: number
  conversions: number
  published: boolean
  created_at: string
  launch_date?: string
  yesterday_views?: number
  yesterday_conversions?: number
}

interface AdminLandingPagesProps {
  landingPages: LandingPage[]
}

type SortField = "title" | "views" | "conversions"
type SortDirection = "asc" | "desc"

export default function AdminLandingPages({ landingPages }: AdminLandingPagesProps) {
  const safePages = landingPages || []
  const [sortField, setSortField] = useState<SortField>("views")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const launchDate = new Date("2025-12-15")
  const today = new Date()
  const daysOnline = Math.max(1, Math.ceil((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)))

  const totalViews = safePages.reduce((sum, page) => sum + (page.views || 0), 0)
  const totalConversions = safePages.reduce((sum, page) => sum + (page.conversions || 0), 0)
  const averageDailyViews = (totalViews / daysOnline).toFixed(1)

  const viewsTrend = totalViews > 100 ? "up" : totalViews > 50 ? "neutral" : "down"

  const sortedPages = useMemo(() => {
    return [...safePages].sort((a, b) => {
      let comparison = 0

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title)
      } else if (sortField === "views") {
        comparison = (a.views || 0) - (b.views || 0)
      } else if (sortField === "conversions") {
        comparison = (a.conversions || 0) - (b.conversions || 0)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [safePages, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-2" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />
  }

  const categories = ["homepage", "revenue-management", "progetti", "servizi", "altro"]
  const groupedPages = categories.reduce(
    (acc, category) => {
      acc[category] = sortedPages.filter((page) => page.category === category)
      return acc
    },
    {} as Record<string, LandingPage[]>,
  )

  const DailyChangeIndicator = ({ current, yesterday }: { current: number; yesterday?: number }) => {
    if (yesterday === undefined || yesterday === null) return null

    const diff = current - yesterday
    if (diff > 0) {
      return (
        <span className="inline-flex items-center text-green-600 text-xs ml-2">
          <ArrowUpRight className="h-3 w-3" />+{diff}
        </span>
      )
    } else if (diff < 0) {
      return (
        <span className="inline-flex items-center text-red-600 text-xs ml-2">
          <ArrowDownRight className="h-3 w-3" />
          {diff}
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center text-gray-500 text-xs ml-2">
          <Minus className="h-3 w-3" />0
        </span>
      )
    }
  }

  return (
    <div className="space-y-6" id="landing-pages">
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-semibold text-foreground">Data di Lancio Landing Pages</p>
                <p className="text-2xl font-bold text-primary">15 Dicembre 2025</p>
                <p className="text-sm text-muted-foreground mt-1">{daysOnline} giorni online</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{averageDailyViews}</p>
                <p className="text-sm text-muted-foreground">Visite medie/giorno</p>
              </div>
              <div className="text-center">
                {viewsTrend === "up" && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-lg font-semibold text-green-500">In Crescita</p>
                      <p className="text-sm text-muted-foreground">Trend positivo</p>
                    </div>
                  </div>
                )}
                {viewsTrend === "neutral" && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-lg font-semibold text-yellow-500">Stabile</p>
                      <p className="text-sm text-muted-foreground">Trend neutrale</p>
                    </div>
                  </div>
                )}
                {viewsTrend === "down" && (
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-lg font-semibold text-red-500">Da Migliorare</p>
                      <p className="text-sm text-muted-foreground">Aumenta visibilità</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tutte le Pagine del Sito</h2>
          <p className="text-muted-foreground mt-2">
            Monitora performance di tutte le pagine con confronto giornaliero
          </p>
        </div>
        <div className="flex gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalViews}</p>
                  <p className="text-xs text-muted-foreground">Visite Totali</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalConversions}</p>
                  <p className="text-xs text-muted-foreground">Conversioni</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordina per</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={sortField === "title" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("title")}
            >
              Nome
              <SortIcon field="title" />
            </Button>
            <Button
              variant={sortField === "views" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("views")}
            >
              Visite
              <SortIcon field="views" />
            </Button>
            <Button
              variant={sortField === "conversions" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("conversions")}
            >
              Conversioni
              <SortIcon field="conversions" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const pages = groupedPages[category]
        if (pages.length === 0) return null

        const categoryLabels: Record<string, string> = {
          homepage: "Homepage",
          "revenue-management": "Revenue Management",
          progetti: "Progetti",
          servizi: "Pagine Servizi",
          altro: "Altro",
        }

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{categoryLabels[category] || category}</CardTitle>
              <CardDescription>
                {pages.length} {pages.length === 1 ? "pagina" : "pagine"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{page.title}</h3>
                      <p className="text-sm text-muted-foreground">/{page.slug || ""}</p>
                      {page.project_name && (
                        <p className="text-xs text-muted-foreground mt-1">Progetto: {page.project_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center min-w-[100px]">
                        <p className="text-xs text-muted-foreground mb-1">Ieri</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {page.yesterday_views !== undefined ? page.yesterday_views : "-"}
                        </p>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <p className="text-xs text-muted-foreground mb-1">Visite Totali</p>
                        <div className="flex items-center justify-center">
                          <p className="text-lg font-semibold">{page.views || 0}</p>
                          <DailyChangeIndicator current={page.views || 0} yesterday={page.yesterday_views} />
                        </div>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <p className="text-xs text-muted-foreground mb-1">Conv. Ieri</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {page.yesterday_conversions !== undefined ? page.yesterday_conversions : "-"}
                        </p>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <p className="text-xs text-muted-foreground mb-1">Conv. Totali</p>
                        <div className="flex items-center justify-center">
                          <p className="text-lg font-semibold">{page.conversions || 0}</p>
                          <DailyChangeIndicator
                            current={page.conversions || 0}
                            yesterday={page.yesterday_conversions}
                          />
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visualizza
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
