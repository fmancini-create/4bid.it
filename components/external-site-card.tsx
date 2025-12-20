"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExternalSiteCardProps {
  site: {
    id: string
    name: string
    base_url: string
    description: string | null
    is_active: boolean
    crawl_frequency: string
    last_crawled_at: string | null
    pages_crawled: number
  }
}

export default function ExternalSiteCard({ site }: ExternalSiteCardProps) {
  const [isCrawling, setIsCrawling] = useState(false)
  const { toast } = useToast()

  const handleCrawl = async () => {
    setIsCrawling(true)

    try {
      const response = await fetch("/api/knowledge/crawl-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to crawl site")
      }

      toast({
        title: "Crawl completato!",
        description: `${data.pagesFound} pagine trovate, ${data.knowledgeItemsAdded} informazioni aggiunte.`,
      })

      // Reload page to show updated data
      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Crawl error:", error)
      toast({
        title: "Errore durante il crawl",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCrawling(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
      <Button variant="outline" size="sm" onClick={handleCrawl} disabled={isCrawling || !site.is_active}>
        {isCrawling ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Crawling...
          </>
        ) : (
          "Crawl Ora"
        )}
      </Button>
    </div>
  )
}
