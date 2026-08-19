// PAGINA TEMPORANEA di verifica: viene eliminata subito dopo lo scatto.
// Serve a guardare con gli occhi il corpo dell'email e il riquadro A/B nelle
// situazioni che contano, invece di fidarsi del verde delle prove.
import { ConfrontoAb } from "@/components/admin/confronto-ab"
import { AIR_MARKET_PRESET, OGGETTO_A, OGGETTO_B, OGGETTO_STORICO } from "@/lib/dem/air-market-template"

const STORICO_VERO = { oggetto: OGGETTO_STORICO, inviate: 4119, aperte: 624, clic: 68 }

export default function Page() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <section>
        <h1 className="mb-1 text-lg font-bold">Corpo dell&apos;email (nuovo)</h1>
        <p className="mb-3 text-sm text-muted-foreground">
          Oggetto A: {OGGETTO_A} — Oggetto B: {OGGETTO_B}
        </p>
        <iframe
          title="Anteprima email Air Market"
          srcDoc={AIR_MARKET_PRESET.html}
          className="h-[760px] w-full rounded-md border border-border"
        />
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-semibold">1. Prova appena avviata (nessun confronto)</p>
          <ConfrontoAb
            attiva
            oggettoA={OGGETTO_A}
            oggettoB={OGGETTO_B}
            a={{ inviate: 120, aperte: 18, clic: 2 }}
            b={{ inviate: 118, aperte: 15, clic: 1 }}
            storico={STORICO_VERO}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">2. A vince e supera lo storico</p>
          <ConfrontoAb
            attiva
            oggettoA={OGGETTO_A}
            oggettoB={OGGETTO_B}
            a={{ inviate: 2000, aperte: 400, clic: 44 }}
            b={{ inviate: 2000, aperte: 300, clic: 30 }}
            storico={STORICO_VERO}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">3. Entrambe sotto lo storico</p>
          <ConfrontoAb
            attiva
            oggettoA={OGGETTO_A}
            oggettoB={OGGETTO_B}
            a={{ inviate: 2000, aperte: 200, clic: 20 }}
            b={{ inviate: 2000, aperte: 180, clic: 18 }}
            storico={STORICO_VERO}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">4. Storico senza oggetto registrato</p>
          <ConfrontoAb
            attiva
            oggettoA={OGGETTO_A}
            oggettoB={OGGETTO_B}
            a={{ inviate: 2000, aperte: 310, clic: 30 }}
            b={{ inviate: 2000, aperte: 280, clic: 28 }}
            storico={{ oggetto: "", inviate: 4119, aperte: 624, clic: 68 }}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">5. Prova spenta: non deve comparire nulla</p>
          <ConfrontoAb
            attiva={false}
            oggettoA={OGGETTO_A}
            oggettoB=""
            a={{ inviate: 0, aperte: 0, clic: 0 }}
            b={{ inviate: 0, aperte: 0, clic: 0 }}
            storico={STORICO_VERO}
          />
        </div>
      </section>
    </main>
  )
}
