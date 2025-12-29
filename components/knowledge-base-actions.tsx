"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function KnowledgeBaseActions() {
  const router = useRouter()
  const { toast } = useToast()

  // Scrape dialog state
  const [isScrapingDialogOpen, setIsScrapingDialogOpen] = useState(false)
  const [scrapeUrl, setScrapeUrl] = useState("")
  const [scrapeCategory, setScrapeCategory] = useState("website")
  const [isScrapeLoading, setIsScrapeLoading] = useState(false)

  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [manualTitle, setManualTitle] = useState("")
  const [manualContent, setManualContent] = useState("")
  const [manualCategory, setManualCategory] = useState("company")
  const [manualSourceUrl, setManualSourceUrl] = useState("")
  const [manualKeywords, setManualKeywords] = useState("")
  const [isManualLoading, setIsManualLoading] = useState(false)

  const handleScrapeUrl = async () => {
    if (!scrapeUrl) return

    setIsScrapeLoading(true)
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
      setIsScrapeLoading(false)
    }
  }

  const handleManualAdd = async () => {
    if (!manualTitle || !manualContent) {
      toast({
        title: "Campi obbligatori",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive",
      })
      return
    }

    setIsManualLoading(true)
    try {
      const response = await fetch("/api/knowledge/save-from-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          content: manualContent,
          category: manualCategory,
          source: "manual",
          source_url: manualSourceUrl || null,
          keywords: manualKeywords ? manualKeywords.split(",").map((k) => k.trim()) : [],
        }),
      })

      if (response.ok) {
        toast({
          title: "Successo!",
          description: "Informazione aggiunta al knowledge base",
        })
        setIsManualDialogOpen(false)
        setManualTitle("")
        setManualContent("")
        setManualSourceUrl("")
        setManualKeywords("")
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: "Errore durante il salvataggio",
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
      setIsManualLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Scrape URL Dialog */}
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
            <Button onClick={handleScrapeUrl} disabled={isScrapeLoading || !scrapeUrl} className="w-full">
              {isScrapeLoading ? "Scansione in corso..." : "Inizia Scansione"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Manualmente
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Informazione Manualmente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                placeholder="Es: Informazioni su SantAddeo"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="content">Contenuto *</Label>
              <Textarea
                id="content"
                placeholder="Descrizione dettagliata dell'informazione..."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="manual-category">Categoria</Label>
              <Select value={manualCategory} onValueChange={setManualCategory}>
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
            <div>
              <Label htmlFor="source-url">URL Sorgente (opzionale)</Label>
              <Input
                id="source-url"
                type="url"
                placeholder="https://..."
                value={manualSourceUrl}
                onChange={(e) => setManualSourceUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="keywords">Keywords (opzionale, separate da virgola)</Label>
              <Input
                id="keywords"
                placeholder="hotel, revenue management, pricing"
                value={manualKeywords}
                onChange={(e) => setManualKeywords(e.target.value)}
              />
            </div>
            <Button
              onClick={handleManualAdd}
              disabled={isManualLoading || !manualTitle || !manualContent}
              className="w-full"
            >
              {isManualLoading ? "Salvataggio..." : "Aggiungi al Knowledge Base"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
