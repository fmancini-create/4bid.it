"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Eye, TrendingUp } from "lucide-react"

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

export default function AdminLandingPages({ landingPages }: AdminLandingPagesProps) {
  const categories = ["revenue-management", "progetti", "servizi", "altro"]

  const groupedPages = categories.reduce(
    (acc, category) => {
      acc[category] = landingPages.filter((page) => page.category === category)
      return acc
    },
    {} as Record<string, LandingPage[]>,
  )

  const totalViews = landingPages.reduce((sum, page) => sum + (page.views || 0), 0)
  const totalConversions = landingPages.reduce((sum, page) => sum + (page.conversions || 0), 0)

  return (
    <div className="space-y-6">
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
