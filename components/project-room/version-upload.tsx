"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  documentId: string
  /** Set when an existing version row has no file yet: fills it instead of creating a new one. */
  fillVersionId?: string | null
  fillVersionLabel?: string | null
}

export function VersionUpload({ documentId, fillVersionId, fillVersionLabel }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filling = Boolean(fillVersionId)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    data.set("document_id", documentId)
    if (fillVersionId) data.set("replace_version_id", fillVersionId)

    const file = data.get("file")
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Allega un file PDF.")
      return
    }

    setBusy(true)
    try {
      const response = await fetch("/api/project-room/versions", { method: "POST", body: data })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(payload.error ?? "Caricamento non riuscito.")
        return
      }
      toast.success(
        payload.pageCount ? `Caricato: ${payload.pageCount} pagine rilevate.` : "Documento caricato.",
      )
      setOpen(false)
      setFileName(null)
      form.reset()
      router.refresh()
    } catch {
      toast.error("Caricamento non riuscito. Verifica la connessione.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={filling ? "default" : "outline"} size="sm">
          <Upload className="mr-2 size-4" aria-hidden="true" />
          {filling ? "Carica il PDF" : "Nuova versione"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{filling ? `Carica il file per ${fillVersionLabel}` : "Carica una nuova versione"}</DialogTitle>
            <DialogDescription>
              {filling
                ? "La versione e gia registrata: questo caricamento ne completa il file, senza creare una nuova versione."
                : "La versione precedente non viene sostituita: resta consultabile nello storico."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="version-file">File PDF</Label>
              <Input
                ref={inputRef}
                id="version-file"
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                required
                onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                {fileName ? `Selezionato: ${fileName}` : "Solo PDF, massimo 25 MB."}
              </p>
            </div>

            {filling ? null : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="version-label">
                  Etichetta versione <span className="font-normal text-muted-foreground">(opzionale)</span>
                </Label>
                <Input id="version-label" name="version_label" placeholder="es. v2.0" />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="change-summary">
                Cosa cambia <span className="font-normal text-muted-foreground">(opzionale)</span>
              </Label>
              <Textarea
                id="change-summary"
                name="change_summary"
                rows={3}
                placeholder="Sintesi delle modifiche rispetto alla versione precedente."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Annulla
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {busy ? "Caricamento…" : "Carica"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
