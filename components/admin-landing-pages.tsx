"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Eye, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

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

  const categories = ["revenue-management", "progetti", "servizi", "altro"]
  const groupedPages = categories.reduce(
    (acc, category) => {
      acc[category] = sortedPages.filter((page) => page.category === category)
      return acc
    },
    {} as Record<string, LandingPage[]>,
  )

  const totalViews = safePages.reduce((sum, page) => sum + (page.views || 0), 0)
  const totalConversions = safePages.reduce((sum, page) => sum + (page.conversions || 0), 0)

  return (
    <div className="space-y-6" id="landing-pages">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Landing Pages</h2>
          <p className="text-muted-foreground mt-2">Gestisci e monitora tutte le landing pages SEO</p>
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

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">
                {category === "revenue-management" ? "Revenue Management" : category}
              </CardTitle>
              <CardDescription>{pages.length} landing pages</CardDescription>
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
                      <p className="text-sm text-muted-foreground">/{page.slug}</p>
                      {page.project_name && (
                        <p className="text-xs text-muted-foreground mt-1">Progetto: {page.project_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{page.views || 0}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{page.conversions || 0}</p>
                        <p className="text-xs text-muted-foreground">Conv.</p>
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
