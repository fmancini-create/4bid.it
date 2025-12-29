"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface KnowledgeItemActionsProps {
  item: {
    id: string
    title: string
    content: string
    category: string
    source_url?: string
    keywords?: string[]
    priority: number
    is_active: boolean
  }
}

export default function KnowledgeItemActions({ item }: KnowledgeItemActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: item.title,
    content: item.content,
    category: item.category,
    source_url: item.source_url || "",
    keywords: item.keywords?.join(", ") || "",
    priority: item.priority.toString(),
  })

  const handleToggleActive = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/knowledge/update/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      })

      if (!response.ok) throw new Error("Failed to toggle item")

      toast({
        title: "Successo",
        description: `Informazione ${item.is_active ? "disattivata" : "attivata"} correttamente`,
      })

      // Reload page to reflect changes
      window.location.reload()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile modificare lo stato dell'informazione",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Errore",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/knowledge/update/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          source_url: formData.source_url || null,
          keywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          priority: Number.parseInt(formData.priority) || 0,
        }),
      })

      if (!response.ok) throw new Error("Failed to update item")

      toast({
        title: "Successo",
        description: "Informazione aggiornata correttamente",
      })

      setIsEditOpen(false)
      window.location.reload()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'informazione",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)} disabled={isLoading}>
          Modifica
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggleActive} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : item.is_active ? "Disattiva" : "Attiva"}
        </Button>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Informazione</DialogTitle>
            <DialogDescription>Aggiorna i dettagli dell'informazione nel knowledge base</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titolo *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Es: Come funziona 4BID.IT"
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Contenuto *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Descrizione dettagliata..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Categoria</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Es: prodotti, servizi, pricing"
              />
            </div>

            <div>
              <Label htmlFor="edit-url">URL Sorgente (opzionale)</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="edit-keywords">Keywords (separate da virgola)</Label>
              <Input
                id="edit-keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="prodotto, servizio, hotel, AI"
              />
            </div>

            <div>
              <Label htmlFor="edit-priority">Priorità (0-10)</Label>
              <Input
                id="edit-priority"
                type="number"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              Annulla
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
