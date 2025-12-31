/**
 * Server component that displays the last updated date for a guide page.
 * Uses git commit date if available, otherwise falls back to deploy date.
 */

import { getLastUpdatedISOForFile } from "@/lib/git-last-updated"

interface GuideLastUpdatedProps {
  filePath: string
}

function formatDateItalian(isoString: string): string {
  const months = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ]

  const date = new Date(isoString)
  // Use Europe/Rome timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }
  const parts = new Intl.DateTimeFormat("it-IT", options).formatToParts(date)

  const day = parts.find((p) => p.type === "day")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const year = parts.find((p) => p.type === "year")?.value

  const monthIndex = month ? Number.parseInt(month, 10) - 1 : 0
  return `${day} ${months[monthIndex]} ${year}`
}

export function GuideLastUpdated({ filePath }: GuideLastUpdatedProps) {
  const gitDate = getLastUpdatedISOForFile(filePath)

  if (gitDate) {
    return <p className="text-sm text-muted-foreground mb-6">Ultimo aggiornamento: {formatDateItalian(gitDate)}</p>
  }

  // Fallback: use build/deploy time
  const deployDate = new Date().toISOString()
  return <p className="text-sm text-muted-foreground mb-6">Ultimo deploy: {formatDateItalian(deployDate)}</p>
}
