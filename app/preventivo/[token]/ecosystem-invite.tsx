import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export default function EcosystemInvite({
  token,
  offersCount,
  selectedCount,
}: {
  token: string
  offersCount: number
  selectedCount: number
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-background to-background shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Ecosistema 4BID</p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">Vuoi completare la soluzione?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Scopri prima cosa fanno HotelAccelerator, Santaddeo, HotelProfitAI e ManuBot; poi scegli soltanto i moduli che servono davvero alla tua struttura.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-background px-3 py-1.5 shadow-sm ring-1 ring-border">4 prodotti spiegati chiaramente</span>
                <span className="rounded-full bg-background px-3 py-1.5 shadow-sm ring-1 ring-border">Moduli compatibili e prezzi</span>
                {offersCount > 0 ? <span className="rounded-full bg-background px-3 py-1.5 shadow-sm ring-1 ring-border">{offersCount} proposte disponibili</span> : null}
                {selectedCount > 0 ? <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">{selectedCount} già aggiunte</span> : null}
              </div>
            </div>
          </div>

          <Link
            href={`/preventivo/${token}/ecosistema`}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            Scopri prodotti e moduli
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
