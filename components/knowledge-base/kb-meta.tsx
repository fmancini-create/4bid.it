import { User, Clock } from "lucide-react"
import { GuideLastUpdated } from "@/components/guide-last-updated"
import { KB_DEFAULT_AUTHOR } from "@/lib/knowledge-base"

/**
 * Riga meta della guida: autore, tempo di lettura e ultimo aggiornamento.
 * L'ultimo aggiornamento riusa GuideLastUpdated (data reale dal commit git).
 */
export function KBMeta({
  author = KB_DEFAULT_AUTHOR,
  readingTime,
  filePath,
}: {
  author?: string
  readingTime: string
  filePath: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <User className="h-4 w-4" aria-hidden="true" />
        {author}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" aria-hidden="true" />
        {readingTime}
      </span>
      <GuideLastUpdated filePath={filePath} />
    </div>
  )
}
