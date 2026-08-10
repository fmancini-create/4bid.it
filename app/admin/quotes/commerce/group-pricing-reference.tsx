"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, AlertTriangle, CheckCircle2, TriangleAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatQuoteAmount } from "@/lib/quotes/types"
import {
  suggestVolumeDiscount,
  evaluateGroupPricing,
  type GroupDrivers,
  type GroupPricingStatus,
} from "@/lib/quotes/group-pricing"

// Pannello di SUPPORTO alla decisione: mostra all'operatore un tetto di prezzo
// consigliato per i preventivi di gruppo, cosi' il totale del gruppo non finisce
// per costare, per unita', quanto o piu' di un piano singolo. Non persiste nulla
// e non blocca il salvataggio: e' un riferimento visivo al momento della stesura.

const STATUS_STYLES: Record<GroupPricingStatus, { box: string; badge: string; Icon: typeof CheckCircle2; text: string }> = {
  ok: { box: "border-emerald-300 bg-emerald-50", badge: "bg-emerald-600 text-white", Icon: CheckCircle2, text: "text-emerald-800" },
  warn: { box: "border-amber-300 bg-amber-50", badge: "bg-amber-500 text-white", Icon: TriangleAlert, text: "text-amber-800" },
  danger: { box: "border-red-300 bg-red-50", badge: "bg-red-600 text-white", Icon: AlertTriangle, text: "text-red-800" },
  idle: { box: "border-border bg-muted/30", badge: "bg-muted text-muted-foreground", Icon: Building2, text: "text-muted-foreground" },
}

export interface GroupPricingReferenceProps {
  /** Totale ricorrente MENSILE gia' configurato nel builder (normalizzato). */
  configuredMonthlyTotal: number
  /** Canone mensile per struttura suggerito dal catalogo (piano piu' economico). */
  suggestedReferenceMonthly: number
}

export default function GroupPricingReference({ configuredMonthlyTotal, suggestedReferenceMonthly }: GroupPricingReferenceProps) {
  // Aperto di default: i suggerimenti di prezzo devono essere subito visibili
  // all'operatore, non nascosti dietro un interruttore da scoprire.
  const [enabled, setEnabled] = useState(true)
  const [drivers, setDrivers] = useState<GroupDrivers>({ structures: 0, rooms: 0, users: 0, months: 12 })
  const [reference, setReference] = useState<number>(0)
  const [referenceTouched, setReferenceTouched] = useState(false)
  const [discountTouched, setDiscountTouched] = useState(false)
  const [discountPct, setDiscountPct] = useState<number>(0)

  // Finche' l'operatore non tocca il riferimento, resta agganciato al catalogo:
  // cosi' il tetto riflette il listino reale invece di un valore inventato.
  useEffect(() => {
    if (!referenceTouched) setReference(suggestedReferenceMonthly)
  }, [suggestedReferenceMonthly, referenceTouched])

  const suggested = useMemo(() => suggestVolumeDiscount(drivers), [drivers])
  // Idem per lo sconto: segue il suggerimento dai driver finche' non lo si forza.
  useEffect(() => {
    if (!discountTouched) setDiscountPct(suggested.pct)
  }, [suggested.pct, discountTouched])

  const result = useMemo(
    () => evaluateGroupPricing({ referencePerStructureMonthly: reference, configuredMonthlyTotal, drivers, discountPct }),
    [reference, configuredMonthlyTotal, drivers, discountPct],
  )

  if (!enabled) {
    return (
      <section className="border rounded-xl p-5 bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <h2 className="font-semibold text-lg">Riferimento tariffa gruppo</h2>
              <p className="text-sm text-muted-foreground">Per preventivi multi-struttura: propone un tetto di prezzo che resta sotto il listino della singola struttura.</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Attiva riferimento tariffa gruppo" />
        </div>
      </section>
    )
  }

  const s = STATUS_STYLES[result.status]
  const nf = (n: number) => formatQuoteAmount(Math.round(n * 100) / 100)

  return (
    <section className="border rounded-xl p-5 bg-card space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">Riferimento tariffa gruppo</h2>
            <p className="text-sm text-muted-foreground">Guida di prezzo per gruppi multi-struttura. Non blocca il salvataggio.</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Disattiva riferimento tariffa gruppo" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label>N. strutture / hotel</Label>
          <Input type="number" min="0" value={drivers.structures || ""} onChange={e => setDrivers(v => ({ ...v, structures: Math.max(0, Number(e.target.value) || 0) }))} placeholder="es. 46" />
        </div>
        <div className="space-y-1.5">
          <Label>N. camere / asset totali</Label>
          <Input type="number" min="0" value={drivers.rooms || ""} onChange={e => setDrivers(v => ({ ...v, rooms: Math.max(0, Number(e.target.value) || 0) }))} placeholder="es. 1600" />
        </div>
        <div className="space-y-1.5">
          <Label>N. utenti</Label>
          <Input type="number" min="0" value={drivers.users || ""} onChange={e => setDrivers(v => ({ ...v, users: Math.max(0, Number(e.target.value) || 0) }))} placeholder="es. 60" />
        </div>
        <div className="space-y-1.5">
          <Label>Durata impegno (mesi)</Label>
          <Input type="number" min="0" value={drivers.months || ""} onChange={e => setDrivers(v => ({ ...v, months: Math.max(0, Number(e.target.value) || 0) }))} placeholder="es. 12" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Canone mensile di riferimento / struttura</Label>
          <Input type="number" min="0" step="0.01" value={reference || ""} onChange={e => { setReferenceTouched(true); setReference(Math.max(0, Number(e.target.value) || 0)) }} placeholder="listino singola struttura" />
          <p className="text-xs text-muted-foreground">{referenceTouched ? "Valore personalizzato." : "Precompilato dal listino pieno del piano base per struttura."} Il listino della singola struttura, prima dello sconto volume.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Sconto volume applicato %</Label>
          <Input type="number" min="0" max="100" step="0.5" value={discountPct || ""} onChange={e => { setDiscountTouched(true); setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value) || 0))) }} placeholder="suggerito dai driver" />
          <p className="text-xs text-muted-foreground">
            Suggerito: <strong>{suggested.pct}%</strong>
            {suggested.breakdown.length ? ` (${suggested.breakdown.map(b => `${b.label} +${b.pct}`).join(", ")})` : ""}
            {discountTouched ? <button type="button" className="ml-2 underline" onClick={() => setDiscountTouched(false)}>usa suggerito</button> : null}
          </p>
        </div>
      </div>

      <div className={`rounded-lg border-2 p-4 space-y-3 ${s.box}`}>
        <div className="flex items-center gap-2">
          <s.Icon className={`h-5 w-5 ${s.text}`} />
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
            {result.status === "ok" ? "Sotto il tetto" : result.status === "warn" ? "Sopra il tetto consigliato" : result.status === "danger" ? "Sopra il listino singolo" : "In attesa di dati"}
          </span>
          <p className={`text-sm font-medium ${s.text}`}>{result.message}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Riferimento gruppo / mese" value={nf(result.referenceMonthlyTotal)} hint={`${nf(result.referencePerStructureMonthly)} × ${drivers.structures || 0} strutture`} />
          <Metric label="Tetto consigliato / mese" value={nf(result.recommendedMaxMonthly)} hint={`sconto volume ${result.discountPct}%`} strong />
          <Metric label="Configurato / mese" value={nf(result.configuredMonthlyTotal)} hint={result.effectiveDiscountPct >= 0 ? `sconto effettivo ${result.effectiveDiscountPct}%` : `${Math.abs(result.effectiveDiscountPct)}% SOPRA il singolo`} tone={result.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-md bg-background/60 px-3 py-2">
            <span className="text-muted-foreground">Per struttura (mese): </span>
            <strong>{nf(result.effectivePerStructureMonthly)}</strong>
            <span className="text-muted-foreground"> vs rif. {nf(result.referencePerStructureMonthly)}</span>
          </div>
          <div className="rounded-md bg-background/60 px-3 py-2">
            <span className="text-muted-foreground">Per camera/asset (mese): </span>
            <strong>{nf(result.effectivePerRoomMonthly)}</strong>
            <span className="text-muted-foreground"> vs rif. {nf(result.referencePerRoomMonthly)}</span>
          </div>
        </div>

        {result.status === "warn" || result.status === "danger" ? (
          <p className={`text-sm ${s.text}`}>
            {result.overCapMonthly > 0
              ? `Riduci di ${nf(result.overCapMonthly)}/mese per rientrare nel tetto consigliato.`
              : ""}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function Metric({ label, value, hint, strong, tone }: { label: string; value: string; hint?: string; strong?: boolean; tone?: GroupPricingStatus }) {
  const toneClass = tone === "danger" ? "text-red-700" : tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-emerald-700" : ""
  return (
    <div className="rounded-md bg-background/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${strong ? "text-primary" : toneClass}`}>{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
