"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: site.name,
    base_url: site.base_url,
    description: site.description || "",
    crawl_frequency: site.crawl_frequency,
    is_active: site.is_active,
  })
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

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/knowledge/external-sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update site")
      }

      toast({
        title: "Sito aggiornato!",
        description: "Le modifiche sono state salvate con successo.",
      })

      setIsEditOpen(false)
      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Update error:", error)
      toast({
        title: "Errore durante il salvataggio",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setFormData({
      name: site.name,
      base_url: site.base_url,
      description: site.description || "",
      crawl_frequency: site.crawl_frequency,
      is_active: site.is_active,
    })
    setIsEditOpen(true)
  }

  return (
    <>
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
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
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
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifica Sito Esterno</DialogTitle>
            <DialogDescription>Modifica le informazioni del sito da crawlare</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Sito</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es: SantAddeo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL Base</Label>
              <Input
                id="url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://esempio.it"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrizione del sito..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequenza Crawl</Label>
              <Select
                value={formData.crawl_frequency}
                onValueChange={(value) => setFormData({ ...formData, crawl_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="monthly">Mensile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Sito Attivo</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva Modifiche"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
