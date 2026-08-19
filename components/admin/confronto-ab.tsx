"use client"

// Riquadro del confronto A/B sull'oggetto, nel pannello DEM.
//
// Mostra i numeri delle due varianti e, soltanto quando ce n'e' abbastanza per
// dirlo, indica quale oggetto apre di piu'. Non applica nulla da solo: la scelta
// di tenere o sostituire l'oggetto resta di chi gestisce la campagna.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FlaskConical } from "lucide-react"
import {
  percentuale,
  esitoConfronto,
  confrontoConStorico,
  numero,
  INVII_MINIMI_PER_VARIANTE,
  type RigaConfrontoAb,
} from "@/lib/dem/ab-oggetto"

type DatiVariante = { inviate: number; aperte: number; clic: number }

export function ConfrontoAb({
  attiva,
  oggettoA,
  oggettoB,
  a,
  b,
  storico,
}: {
  attiva: boolean
  oggettoA: string
  oggettoB: string
  a: DatiVariante
  b: DatiVariante
  /**
   * Email spedite prima che la prova esistesse (variante non assegnata), con
   * l'oggetto di allora.
   *
   * Si mostra in pagina per due motivi. Primo: senza questo numero, "inviate
   * 2.000 + 2.000" contro un totale campagna di 8.000 sembrerebbe un errore di
   * conteggio. Secondo, piu' importante: siccome la prova mette in gara due
   * oggetti NUOVI, questa e' l'unica asticella per sapere se sono un
   * miglioramento e non solo diversi fra loro.
   */
  storico: DatiVariante & { oggetto: string }
}) {
  if (!attiva) return null

  const righe: RigaConfrontoAb[] = (["A", "B"] as const).map((variante) => {
    const d = variante === "A" ? a : b
    return {
      variante,
      oggetto: variante === "A" ? oggettoA : oggettoB,
      inviate: d.inviate,
      aperte: d.aperte,
      clic: d.clic,
      aperturePct: percentuale(d.aperte, d.inviate),
      clicSuApertePct: percentuale(d.clic, d.aperte),
    }
  })

  const esito = esitoConfronto(righe[0], righe[1])

  const aperturaStorico = percentuale(storico.aperte, storico.inviate)
  const contro = confrontoConStorico(righe, { inviate: storico.inviate, aperturePct: aperturaStorico })

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          Prova sull&apos;oggetto (A/B)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row">
          {righe.map((r) => {
            const vince = esito.vincente === r.variante
            return (
              <div
                key={r.variante}
                className={`flex flex-1 flex-col gap-2 rounded-md border p-4 ${
                  vince ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                    {r.variante}
                  </span>
                  {vince && (
                    <span className="text-xs font-semibold text-primary">apre di più</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-foreground">{r.oggetto}</p>
                <p className="text-2xl font-bold text-foreground">
                  {r.aperturePct === null ? "—" : `${numero(r.aperturePct, 1)}%`}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {numero(r.inviate)} inviate · {numero(r.aperte)} aperte · {numero(r.clic)} clic
                  {r.clicSuApertePct !== null && (
                    <> · {numero(r.clicSuApertePct, 1)}% clicca dopo aver aperto</>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{esito.motivo}</p>

        {contro && <p className="text-sm leading-relaxed text-foreground">{contro}</p>}

        {storico.inviate > 0 && (
          <div className="flex flex-col gap-1 rounded-md border border-dashed border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Prima della prova · riferimento
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {storico.oggetto || <span className="italic">oggetto non registrato</span>}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {aperturaStorico === null ? "—" : `${numero(aperturaStorico, 1)}%`} ·{" "}
              {numero(storico.inviate)} inviate · {numero(storico.aperte)} aperte
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Restano fuori dal confronto: sommarle a una delle due varianti falserebbe il paragone,
              perché sono partite in giorni diversi e con un altro testo. La soglia per dichiarare un
              vincente è di {numero(INVII_MINIMI_PER_VARIANTE)} invii per variante.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
