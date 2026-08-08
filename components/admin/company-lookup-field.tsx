"use client"

import { useState } from "react"
import { Loader2, Search, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface CompanyLookupData {
  denominazione: string | null
  partitaIva: string | null
  codiceFiscale: string | null
  indirizzo: string | null
  cap: string | null
  citta: string | null
  provincia: string | null
  regione: string | null
  statoAttivita: string | null
  formaGiuridica: string | null
  ateco: string | null
  atecoDescrizione: string | null
  rea: string | null
  cciaa: string | null
  dataIscrizione: string | null
  pec: string | null
  codiceSdi: string | null
  cessata: boolean
}

/** Indirizzo su una riga, saltando i pezzi che il registro non fornisce. */
export function formatCompanyAddress(d: CompanyLookupData): string {
  const riga1 = d.indirizzo?.trim()
  const riga2 = [d.cap, d.citta, d.provincia ? `(${d.provincia})` : null].filter(Boolean).join(" ")
  return [riga1, riga2].filter(Boolean).join(" - ")
}

/**
 * I dati di fatturazione tenuti SEPARATI, come li chiede il modulo che il
 * cliente compila per accettare il preventivo.
 *
 * Il registro fornisce via, CAP, citta' e provincia gia' distinti: unirli in
 * una sola riga e basta significa buttarli via e costringere il cliente a
 * riscriverli a mano, con il rischio di sbagliare proprio i dati che poi
 * finiscono in fattura.
 */
export function companyToBillingDetails(d: CompanyLookupData): Record<string, string> {
  const campi: Record<string, string> = {
    company: d.denominazione || "",
    vat: d.partitaIva || "",
    tax_code: d.codiceFiscale || "",
    address: d.indirizzo || "",
    zip: d.cap || "",
    city: d.citta || "",
    province: d.provincia || "",
    sdi_code: d.codiceSdi || "",
    pec: d.pec || "",
  }
  // Le chiavi vuote non si salvano: un valore vuoto memorizzato sembrerebbe
  // un dato gia' verificato e assente, invece che un dato mai ottenuto.
  return Object.fromEntries(Object.entries(campi).filter(([, v]) => v.trim() !== ""))
}

export default function CompanyLookupField({
  value,
  onValueChange,
  onApply,
  label = "P.IVA / CF",
}: {
  value: string
  onValueChange: (v: string) => void
  onApply: (data: CompanyLookupData) => void
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [risultato, setRisultato] = useState<CompanyLookupData | null>(null)

  const controlla = async () => {
    if (loading) return
    setLoading(true)
    setErrore(null)
    setRisultato(null)
    try {
      const res = await fetch("/api/company-lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vat: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrore(data.error || "Controllo non riuscito.")
        return
      }
      setRisultato(data.data)
    } catch {
      setErrore("Controllo non riuscito: connessione assente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            // Invio nel campo non deve inviare il modulo del preventivo:
            // qui significa "controlla".
            if (e.key === "Enter") {
              e.preventDefault()
              controlla()
            }
          }}
          placeholder="es. 12485671007"
        />
        <Button
          type="button"
          variant="outline"
          onClick={controlla}
          disabled={loading || !value.trim()}
          className="shrink-0 bg-transparent"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2">Controlla</span>
        </Button>
      </div>

      {errore && (
        <p className="text-xs text-destructive flex items-start gap-1.5 pt-1">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{errore}</span>
        </p>
      )}

      {risultato && (
        <div className="mt-2 rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{risultato.denominazione || "Denominazione non disponibile"}</p>
              <p className="text-xs text-muted-foreground">
                {[risultato.formaGiuridica, risultato.partitaIva && `P.IVA ${risultato.partitaIva}`]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            </div>
            {risultato.cessata ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                {risultato.statoAttivita || "Non attiva"}
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Attiva
              </span>
            )}
          </div>

          <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {formatCompanyAddress(risultato) && (
              <div className="sm:col-span-2">
                <dt className="inline text-muted-foreground">Sede: </dt>
                <dd className="inline">{formatCompanyAddress(risultato)}</dd>
              </div>
            )}
            {risultato.codiceFiscale && (
              <div>
                <dt className="inline text-muted-foreground">Codice fiscale: </dt>
                <dd className="inline">{risultato.codiceFiscale}</dd>
              </div>
            )}
            {risultato.ateco && (
              <div>
                <dt className="inline text-muted-foreground">ATECO: </dt>
                <dd className="inline">
                  {risultato.ateco}
                  {risultato.atecoDescrizione ? ` - ${risultato.atecoDescrizione}` : ""}
                </dd>
              </div>
            )}
            {risultato.rea && (
              <div>
                <dt className="inline text-muted-foreground">REA: </dt>
                <dd className="inline">
                  {risultato.cciaa ? `${risultato.cciaa} ` : ""}
                  {risultato.rea}
                </dd>
              </div>
            )}
            {risultato.pec && (
              <div>
                <dt className="inline text-muted-foreground">PEC: </dt>
                <dd className="inline">{risultato.pec}</dd>
              </div>
            )}
            {risultato.codiceSdi && (
              <div>
                <dt className="inline text-muted-foreground">Codice SDI: </dt>
                <dd className="inline">{risultato.codiceSdi}</dd>
              </div>
            )}
          </dl>

          {risultato.cessata && (
            <p className="text-xs text-destructive">
              Questa azienda non risulta attiva. Verifica prima di intestarle un preventivo.
            </p>
          )}

          <Button type="button" size="sm" onClick={() => onApply(risultato)}>
            Compila i campi del preventivo
          </Button>
        </div>
      )}
    </div>
  )
}
