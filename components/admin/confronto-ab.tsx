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
  spediteFuoriProva,
}: {
  attiva: boolean
  oggettoA: string
  oggettoB: string
  a: DatiVariante
  b: DatiVariante
  /**
   * Email spedite prima che la prova esistesse (variante non assegnata).
   * Si dichiara in pagina: senza questo numero, "inviate 2.000 + 2.000" contro un
   * totale campagna di 8.000 sembrerebbe un errore di conteggio.
   */
  spediteFuoriProva: number
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
                  {r.aperturePct === null ? "—" : `${r.aperturePct}%`}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {r.inviate.toLocaleString("it-IT")} inviate · {r.aperte.toLocaleString("it-IT")}{" "}
                  aperte · {r.clic.toLocaleString("it-IT")} clic
                  {r.clicSuApertePct !== null && <> · {r.clicSuApertePct}% clicca dopo aver aperto</>}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{esito.motivo}</p>

        {spediteFuoriProva > 0 && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Altre {spediteFuoriProva.toLocaleString("it-IT")} email sono state spedite prima
            dell&apos;avvio della prova, con il testo precedente: restano fuori dal confronto perché
            sommarle falserebbe il paragone. La soglia per dichiarare un vincente è di{" "}
            {INVII_MINIMI_PER_VARIANTE} invii per variante.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
