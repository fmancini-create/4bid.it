import { Euro, Users, CheckCircle2 } from "lucide-react"

/**
 * Vantaggio economico della consulenza rispetto al revenue manager interno.
 *
 * Sta in un componente condiviso e non copiato nelle singole pagine perché la
 * cifra dei 120.000 € è un dato commerciale: se domani cambia, deve cambiare in
 * un punto solo, altrimenti le pagine iniziano a contraddirsi tra loro.
 */
export function RevenueManagerCostCallout() {
  return (
    <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-lg">
      <div className="flex items-start gap-4 mb-8">
        <Euro className="h-12 w-12 text-primary-blue flex-shrink-0" aria-hidden="true" />
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-balance">
            Un revenue manager davvero bravo costa almeno 120.000 € l&apos;anno
          </h3>
          <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
            È il costo aziendale reale di una figura senior interna: retribuzione, contributi, formazione continua e
            strumenti di lavoro. Una spesa che la maggior parte delle strutture indipendenti non può sostenere da sola.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Revenue manager interno
          </p>
          <p className="text-4xl font-bold text-foreground mb-3">
            120.000 €<span className="text-lg font-medium text-muted-foreground"> / anno</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Costo interamente a carico della tua struttura, indipendentemente dai risultati e dai periodi di bassa
            occupazione.
          </p>
        </div>

        <div className="rounded-xl border-2 border-primary-blue/30 bg-primary-blue/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-blue mb-3">Con 4BID</p>
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-9 w-9 text-primary-blue flex-shrink-0" aria-hidden="true" />
            <p className="text-2xl font-bold text-foreground leading-tight">Lo stesso costo diviso su più strutture</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Il nostro team di revenue manager lavora su un portafoglio di strutture: la spesa di una competenza senior si
            ripartisce, e a te arriva solo la quota che ti riguarda. Lavoriamo sui dati, quindi il modello vale per
            qualsiasi struttura, in Italia come all&apos;estero.
          </p>
        </div>
      </div>

      <div className="border-l-4 border-yellow bg-yellow/10 rounded-r-lg p-5 mb-8">
        <p className="text-foreground font-semibold leading-relaxed text-pretty">
          Il risultato pratico: anche chi non potrebbe mai permettersi un revenue manager dedicato accede alla stessa
          competenza, con lo stesso metodo e gli stessi strumenti delle grandi catene.
        </p>
      </div>

      <ul className="grid sm:grid-cols-2 gap-4">
        {[
          "Nessuna assunzione, nessun costo fisso del personale",
          "Competenza senior disponibile da subito, senza selezione né formazione",
          "Continuità garantita: ferie, malattie e dimissioni non fermano il revenue",
          "Modello performance based: la spesa cresce solo se crescono i ricavi",
          "Nessun vincolo geografico: gestiamo da remoto strutture in tutta Italia e fuori dai confini",
          "Metodo e strumenti pensati per OTA, PMS e domanda internazionale",
        ].map((voce) => (
          <li key={voce} className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-muted-foreground leading-relaxed">{voce}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
