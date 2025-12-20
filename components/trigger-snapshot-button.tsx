"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function TriggerSnapshotButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTriggerSnapshot = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/trigger-snapshot", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Snapshot Salvato",
          description: "I dati di oggi sono stati salvati. Ricarica la pagina per vedere gli aggiornamenti.",
        })
        // Ricarica la pagina dopo 1 secondo
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast({
          title: "Errore",
          description: data.error || "Impossibile salvare lo snapshot",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore di connessione",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleTriggerSnapshot} disabled={isLoading} size="sm" className="mt-2">
      {isLoading ? "Salvataggio..." : "Salva Snapshot Ora"}
    </Button>
  )
}
