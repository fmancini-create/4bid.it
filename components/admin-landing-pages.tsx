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
  ChevronDown,
  ChevronUp,
} from "lucide-react"

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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

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

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
    )
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
        <span className="inline-flex items-center text-green-600 text-xs">
          <ArrowUpRight className="h-3 w-3" />+{diff}
        </span>
      )
    } else if (diff < 0) {
      return (
        <span className="inline-flex items-center text-red-600 text-xs">
          <ArrowDownRight className="h-3 w-3" />
          {diff}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />0
      </span>
    )
  }

  const categoryLabels: Record<string, string> = {
    homepage: "Homepage",
    "revenue-management": "Revenue Management",
    progetti: "Progetti",
    servizi: "Pagine Servizi",
    altro: "Altro",
  }

  return (
    <div className="space-y-4 sm:space-y-6" id="landing-pages">
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
              <div>
                <p className="text-sm sm:text-lg font-semibold">Lancio Landing Pages</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">15 Dic 2025</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{daysOnline} giorni online</p>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold">{averageDailyViews}</p>
                <p className="text-xs text-muted-foreground">Visite/giorno</p>
              </div>
              <div className="flex items-center gap-2">
                {viewsTrend === "up" && <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-green-500" />}
                {viewsTrend === "neutral" && <TrendingUp className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-500" />}
                {viewsTrend === "down" && <TrendingDown className="h-5 w-5 sm:h-8 sm:w-8 text-red-500" />}
                <div className="hidden sm:block">
                  <p
                    className={`text-sm font-semibold ${
                      viewsTrend === "up"
                        ? "text-green-500"
                        : viewsTrend === "neutral"
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {viewsTrend === "up" ? "In Crescita" : viewsTrend === "neutral" ? "Stabile" : "Da Migliorare"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold">Tutte le Pagine</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Monitora performance con confronto giornaliero</p>
        </div>
        <div className="flex gap-2">
          <Card className="flex-1 sm:flex-none">
            <CardContent className="p-2 sm:pt-6 sm:p-6 flex items-center gap-2">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalViews}</p>
                <p className="text-xs text-muted-foreground">Visite</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 sm:flex-none">
            <CardContent className="p-2 sm:pt-6 sm:p-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalConversions}</p>
                <p className="text-xs text-muted-foreground">Conv.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
        <Button
          variant={sortField === "title" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("title")}
          className="text-xs sm:text-sm shrink-0"
        >
          Nome
          <SortIcon field="title" />
        </Button>
        <Button
          variant={sortField === "views" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("views")}
          className="text-xs sm:text-sm shrink-0"
        >
          Visite
          <SortIcon field="views" />
        </Button>
        <Button
          variant={sortField === "conversions" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("conversions")}
          className="text-xs sm:text-sm shrink-0"
        >
          Conv.
          <SortIcon field="conversions" />
        </Button>
      </div>

      {categories.map((category) => {
        const pages = groupedPages[category]
        if (pages.length === 0) return null
        const isCollapsed = collapsedCategories.has(category)

        return (
          <Card key={category}>
            <CardHeader
              className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base">{categoryLabels[category] || category}</CardTitle>
                  <CardDescription className="text-xs">
                    {pages.length} {pages.length === 1 ? "pagina" : "pagine"}
                  </CardDescription>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="px-3 sm:px-6 pt-0 pb-3 sm:pb-6">
                <div className="space-y-2 sm:space-y-3">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-4"
                    >
                      {/* Title and slug */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{page.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">/{page.slug || ""}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Ieri</p>
                          <p className="text-sm font-medium">
                            {page.yesterday_views !== undefined ? page.yesterday_views : "-"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Visite</p>
                          <div className="flex items-center gap-1">
                            <p className="text-sm sm:text-lg font-semibold">{page.views || 0}</p>
                            <DailyChangeIndicator current={page.views || 0} yesterday={page.yesterday_views} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Conv.</p>
                          <div className="flex items-center gap-1">
                            <p className="text-sm sm:text-lg font-semibold">{page.conversions || 0}</p>
                            <DailyChangeIndicator
                              current={page.conversions || 0}
                              yesterday={page.yesterday_conversions}
                            />
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 bg-transparent"
                        >
                          <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Visualizza</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
