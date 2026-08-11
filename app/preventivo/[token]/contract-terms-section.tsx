"use client"

import { AlertTriangle, ExternalLink, FileText, ScrollText } from "lucide-react"
import { acceptanceDeclaration, type QuoteContractTerms } from "@/lib/quotes/terms"

interface Props {
  terms: QuoteContractTerms | null
  economic: string[]
  paymentTerms?: string | null
}

/** Etichetta della casella di conferma: identica a quella conservata dal server. */
export const acceptanceLabel = acceptanceDeclaration

export default function ContractTermsSection({ terms, economic, paymentTerms }: Props) {
  const progetti = terms?.projects || []
  const mancanti = terms?.failures || []

  return (
    <section aria-labelledby="condizioni-titolo" className="space-y-4">
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="condizioni-titolo" className="text-xl font-semibold">Durata, rinnovo e condizioni economiche</h2>
        </div>
        <ul className="space-y-2">
          {economic.map((riga, indice) => (
            <li key={indice} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{riga}</span>
            </li>
          ))}
        </ul>
        {paymentTerms ? (
          <div className="mt-4 rounded-xl bg-muted/40 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Note aggiuntive di 4BID</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{paymentTerms}</p>
          </div>
        ) : null}
      </div>

      {progetti.length ? (
        <div className="rounded-2xl border bg-card p-6">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-semibold">Condizioni contrattuali dei servizi inclusi</h3>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Ogni servizio ha le proprie condizioni, pubblicate dal servizio stesso e riportate qui integralmente nella versione in vigore al momento di questo preventivo.
          </p>
          <div className="space-y-5">
            {progetti.map(progetto => (
              <article key={progetto.project} className="rounded-xl border">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                  <div>
                    <p className="font-bold">{progetto.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {progetto.title}
                      {progetto.version ? ` · versione del ${progetto.version}` : ""}
                    </p>
                  </div>
                  <a
                    href={progetto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Apri la pagina ufficiale
                    <span className="sr-only"> delle condizioni {progetto.label} (si apre in una nuova scheda)</span>
                  </a>
                </header>
                <div className="max-h-80 overflow-y-auto px-4 py-4" tabIndex={0} role="region" aria-label={`Testo delle condizioni ${progetto.label}`}>
                  {progetto.blocks.map((blocco, indice) =>
                    blocco.type === "heading" ? (
                      <h4 key={indice} className="mb-2 mt-4 text-sm font-bold first:mt-0">{blocco.text}</h4>
                    ) : blocco.type === "item" ? (
                      <p key={indice} className="mb-1 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span aria-hidden="true">·</span>
                        <span>{blocco.text}</span>
                      </p>
                    ) : (
                      <p key={indice} className="mb-2 text-sm leading-relaxed text-muted-foreground">{blocco.text}</p>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {mancanti.length ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="text-sm text-destructive">
            <p className="font-bold">Condizioni non caricate per: {mancanti.map(voce => voce.label).join(", ")}</p>
            <p className="mt-1">
              Puoi consultarle alle pagine ufficiali{" "}
              {mancanti.map((voce, indice) => (
                <span key={voce.project}>
                  {indice > 0 ? ", " : ""}
                  <a href={voce.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{voce.label}</a>
                </span>
              ))}
              . Prima di accettare, chiedi a 4BID una copia scritta.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
