import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function EcosystemInvite({
  token,
  offersCount,
  selectedCount,
}: {
  token: string
  offersCount: number
  selectedCount: number
}) {
  if (offersCount <= 0) return null

  return (
    <aside className="fixed bottom-5 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-emerald-300 bg-background/95 p-4 shadow-xl backdrop-blur sm:left-5 sm:right-auto sm:mx-0 sm:w-[360px]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Scopri l&apos;ecosistema 4BID</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Esplora gli altri prodotti e tutte le loro funzionalità. Puoi aggiungere al preventivo le proposte preparate per te.
          </p>
          {selectedCount > 0 ? <p className="mt-1 text-xs font-semibold text-emerald-700">Hai già aggiunto {selectedCount} {selectedCount === 1 ? "soluzione" : "soluzioni"}.</p> : null}
          <Link href={`/preventivo/${token}/ecosistema`} className="mt-3 inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
            Scopri e amplia il preventivo
          </Link>
        </div>
      </div>
    </aside>
  )
}
