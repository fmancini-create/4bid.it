"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, ExternalLink, Globe2, MapPin, RefreshCw, Search, ServerCog, Store } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Fornitore = { nome: string; tipo: string; affidabilita: number | null; prova: string | null }

type Riga = {
  id: string
  nome: string
  citta: string | null
  regione: string | null
  sito: string | null
  stato: string | null
  esaminata_il: string | null
  fornitori: Fornitore[]
}

type Riepilogo = {
  copertura: {
    totali: number
    esaminate: number
    senza_sito: number
    esaminabili: number
    da_esaminare: number
    con_gestionale: number
    irraggiungibili: number
  }
  fornitori: { provider_name: string; technology_type: string; strutture: number }[]
  host_da_riconoscere: number
}

const NUM = new Intl.NumberFormat("it-IT")

function ScrittaStato({ stato }: { stato: string | null }) {
  if (stato === "detected") return <Badge variant="default">gestionale rilevato</Badge>
  if (stato === "unreachable") return <Badge variant="destructive">sito non raggiunto</Badge>
  return <Badge variant="secondary">nessun gestionale riconosciuto</Badge>
}

export default function CensimentoDashboard() {
  const [dati, setDati] = useState<{ riepilogo: Riepilogo; righe: Riga[]; totale: number; pagina: number } | null>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [fornitore, setFornitore] = useState("__tutti__")
  const [ricerca, setRicerca] = useState("")
  const [ricercaApplicata, setRicercaApplicata] = useState("")
  const [pagina, setPagina] = useState(1)

  const carica = useCallback(async () => {
    setCaricamento(true)
    try {
      const p = new URLSearchParams({ pagina: String(pagina) })
      if (fornitore !== "__tutti__") p.set("fornitore", fornitore)
      if (ricercaApplicata) p.set("ricerca", ricercaApplicata)
      const res = await fetch(`/api/admin/censimento-strutture?${p}`, { cache: "no-store" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Errore di lettura")
      setDati(await res.json())
    } catch (e) {
      // L'esito si dichiara: un pannello che resta muto quando la lettura
      // fallisce fa credere che il censimento non abbia trovato nulla.
      toast.error(e instanceof Error ? e.message : "Impossibile leggere il censimento")
    } finally {
      setCaricamento(false)
    }
  }, [fornitore, ricercaApplicata, pagina])

  useEffect(() => {
    void carica()
  }, [carica])

  const cop = dati?.riepilogo.copertura
  const percentuale = useMemo(() => {
    if (!cop || !cop.esaminabili) return 0
    // Denominatore = le strutture che HANNO un sito. Usare il totale direbbe
    // una copertura piu' bassa del vero, contando come "da fare" 7.587
    // strutture che non hanno un sito da esaminare.
    return (cop.esaminate / cop.esaminabili) * 100
  }, [cop])

  const pagine = dati ? Math.max(1, Math.ceil(dati.totale / 50)) : 1

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ServerCog className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium uppercase tracking-wide">Censimento</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Quali gestionali usano le strutture italiane
          </h1>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Ogni riga e&apos; il risultato della lettura del sito della struttura: il gestionale viene riconosciuto dal
            dominio del fornitore che il sito interroga davvero.
          </p>
        </header>

        {/* ELEMENTO PORTANTE: la copertura. Sta in cima e da sola, perche' senza
            di essa ogni numero sotto verrebbe letto come una quota di mercato. */}
        <Card className="mt-8 border-2">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Il censimento e&apos; appena iniziato: questi non sono dati di mercato.</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  I conteggi per gestionale qui sotto valgono <strong>solo sulle strutture gia&apos; esaminate</strong>.
                  Non sono quote di mercato e non vanno usati per stimare la diffusione di un fornitore.
                </p>
              </div>
            </div>

            {cop ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-2xl font-semibold text-foreground">{NUM.format(cop.esaminate)}</span>{" "}
                    esaminate su <strong className="text-foreground">{NUM.format(cop.esaminabili)}</strong> con un sito
                    web
                  </p>
                  <p className="font-mono text-2xl font-semibold tabular-nums">{percentuale.toFixed(2)}%</p>
                </div>
                <Progress value={percentuale} aria-label={`Copertura del censimento: ${percentuale.toFixed(2)}%`} />
                <dl className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
                  {[
                    ["In anagrafica", cop.totali],
                    ["Senza sito web", cop.senza_sito],
                    ["Ancora da esaminare", cop.da_esaminare],
                    ["Sito non raggiunto", cop.irraggiungibili],
                  ].map(([etichetta, valore]) => (
                    <div key={String(etichetta)} className="flex flex-col gap-1">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{etichetta}</dt>
                      <dd className="font-mono text-lg font-medium tabular-nums">{NUM.format(Number(valore))}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {dati && dati.riepilogo.fornitori.length > 0 ? (
          <section className="mt-8" aria-labelledby="titolo-fornitori">
            <h2 id="titolo-fornitori" className="text-lg font-semibold">
              Gestionali riconosciuti finora
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {dati.riepilogo.fornitori.map((f) => (
                <button
                  key={f.provider_name}
                  type="button"
                  onClick={() => {
                    setFornitore(f.provider_name)
                    setPagina(1)
                  }}
                  className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">{f.provider_name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{NUM.format(f.strutture)}</span>
                </button>
              ))}
            </div>
            {dati.riepilogo.host_da_riconoscere > 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Ci sono <strong className="text-foreground">{dati.riepilogo.host_da_riconoscere}</strong> servizi di
                prenotazione visti sui siti ma non ancora attribuiti a un fornitore: finche&apos; restano qui, quelle
                strutture risultano &laquo;nessun gestionale riconosciuto&raquo; anche se ne hanno uno.
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-8" aria-labelledby="titolo-elenco">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="titolo-elenco" className="text-lg font-semibold">
              Strutture esaminate
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setRicercaApplicata(ricerca)
                  setPagina(1)
                }}
                className="flex gap-2"
              >
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={ricerca}
                    onChange={(e) => setRicerca(e.target.value)}
                    placeholder="Nome, citta&apos; o sito"
                    className="pl-8 sm:w-56"
                    aria-label="Cerca fra le strutture esaminate"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Cerca
                </Button>
              </form>
              <Select
                value={fornitore}
                onValueChange={(v) => {
                  setFornitore(v)
                  setPagina(1)
                }}
              >
                <SelectTrigger className="sm:w-60" aria-label="Filtra per gestionale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__tutti__">Tutti gli esiti</SelectItem>
                  <SelectItem value="__nessuno__">Nessun gestionale riconosciuto</SelectItem>
                  <SelectItem value="__irraggiungibili__">Sito non raggiunto</SelectItem>
                  {dati?.riepilogo.fornitori.map((f) => (
                    <SelectItem key={f.provider_name} value={f.provider_name}>
                      {f.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => void carica()} disabled={caricamento}>
                <RefreshCw className={`h-4 w-4 ${caricamento ? "animate-spin" : ""}`} aria-hidden="true" />
                <span className="sr-only">Ricarica</span>
              </Button>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
            {caricamento
              ? "Lettura in corso..."
              : `${NUM.format(dati?.totale ?? 0)} strutture corrispondono al filtro scelto`}
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {!caricamento && dati?.righe.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Nessuna struttura corrisponde al filtro scelto.
                </CardContent>
              </Card>
            ) : null}

            {dati?.righe.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="font-medium">{r.nome}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {r.citta ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {r.citta}
                          {r.regione ? `, ${r.regione}` : ""}
                        </span>
                      ) : null}
                      {r.sito ? (
                        <a
                          href={r.sito}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                        >
                          <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate">{r.sito.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                    <ScrittaStato stato={r.stato} />
                    {r.fornitori.map((f) => (
                      <div key={`${r.id}-${f.nome}`} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{f.nome}</span>
                        {/* La PROVA accanto al nome: un rilevamento senza l'indirizzo
                            che lo dimostra non e' verificabile da chi legge. */}
                        {f.prova ? (
                          <a
                            href={f.prova}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-muted-foreground underline underline-offset-2 hover:text-foreground"
                          >
                            prova
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagine > 1 ? (
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>
                Precedente
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {pagina} di {pagine}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagina((p) => Math.min(pagine, p + 1))}
                disabled={pagina >= pagine}
              >
                Successiva
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
