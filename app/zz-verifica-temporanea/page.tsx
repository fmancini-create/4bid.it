// PAGINA TEMPORANEA DI VERIFICA - da eliminare subito dopo lo scatto.
// Serve solo a guardare a schermo il riquadro del confronto A/B, perche' il
// pannello vero e' protetto da autenticazione.
import { ConfrontoAb } from "@/components/admin/confronto-ab"

export default function Page() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <section>
        <h2 className="mb-2 text-sm font-bold">1. Dati insufficienti (inizio prova)</h2>
        <ConfrontoAb
          attiva
          oggettoA="Il tuo prossimo ospite ha già prenotato il volo"
          oggettoB="Sai quanti voli sono già prenotati verso il tuo aeroporto?"
          a={{ inviate: 120, aperte: 18, clic: 2 }}
          b={{ inviate: 118, aperte: 22, clic: 3 }}
          spediteFuoriProva={4119}
        />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">2. Vincente dichiarato (B apre di più)</h2>
        <ConfrontoAb
          attiva
          oggettoA="Il tuo prossimo ospite ha già prenotato il volo"
          oggettoB="Sai quanti voli sono già prenotati verso il tuo aeroporto?"
          a={{ inviate: 2010, aperte: 304, clic: 34 }}
          b={{ inviate: 1990, aperte: 418, clic: 51 }}
          spediteFuoriProva={4119}
        />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">3. Equivalenti (nessun vincente)</h2>
        <ConfrontoAb
          attiva
          oggettoA="Il tuo prossimo ospite ha già prenotato il volo"
          oggettoB="Il volo è prenotato. La camera no."
          a={{ inviate: 2010, aperte: 304, clic: 34 }}
          b={{ inviate: 1990, aperte: 306, clic: 33 }}
          spediteFuoriProva={0}
        />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">4. Aperture ancora a zero</h2>
        <ConfrontoAb
          attiva
          oggettoA="Oggetto attuale"
          oggettoB="Oggetto nuovo"
          a={{ inviate: 0, aperte: 0, clic: 0 }}
          b={{ inviate: 0, aperte: 0, clic: 0 }}
          spediteFuoriProva={4119}
        />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">5. Prova spenta: non deve comparire nulla sotto</h2>
        <ConfrontoAb
          attiva={false}
          oggettoA="Oggetto attuale"
          oggettoB=""
          a={{ inviate: 0, aperte: 0, clic: 0 }}
          b={{ inviate: 0, aperte: 0, clic: 0 }}
          spediteFuoriProva={0}
        />
        <p className="text-xs text-muted-foreground">(fine pagina)</p>
      </section>
    </main>
  )
}
