"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function KnowledgeBaseActions() {
  const router = useRouter()
  const { toast } = useToast()
  const [isScrapingDialogOpen, setIsScrapingDialogOpen] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState("")
  const [scrapeCategory, setScrapeCategory] = useState("website")
  const [isLoading, setIsLoading] = useState(false)

  const handleScrapeUrl = async () => {
    if (!scrapeUrl) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, category: scrapeCategory }),
      })

      if (response.ok) {
        toast({
          title: "Successo!",
          description: "URL scansionato e aggiunto al knowledge base",
        })
        setIsScrapingDialogOpen(false)
        setScrapeUrl("")
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: "Errore durante la scansione",
          description: error.error || "Si è verificato un errore",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Errore di rete",
        description: "Impossibile contattare il server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={isScrapingDialogOpen} onOpenChange={setIsScrapingDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            Scrape URL
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scrape Pagina Web</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">URL della pagina</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://4bid.it/pagina"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={scrapeCategory} onValueChange={setScrapeCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Azienda</SelectItem>
                  <SelectItem value="project">Progetto</SelectItem>
                  <SelectItem value="service">Servizio</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="technical">Tecnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleScrapeUrl} disabled={isLoading || !scrapeUrl} className="w-full">
              {isLoading ? "Scansione in corso..." : "Inizia Scansione"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Aggiungi Manualmente
      </Button>
    </div>
  )
}
