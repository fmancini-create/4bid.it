import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | 4BID.IT",
  description: "Informativa sulla privacy di 4BID.IT - Come trattiamo e proteggiamo i tuoi dati personali.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://4bid.it/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Titolare del Trattamento</h2>
            <p>
              4BID.IT S.r.l.
              <br />
              Via Boccherini, 22 - 51100 Pistoia (PT)
              <br />
              P.IVA: 01984640974
              <br />
              Email: info@4bid.it
              <br />
              PEC: 4bid@pec.it
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Dati Raccolti</h2>
            <p>I dati personali raccolti attraverso il nostro sito web includono:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nome e cognome</li>
              <li>Indirizzo email</li>
              <li>Numero di telefono (se fornito)</li>
              <li>Dati di navigazione (attraverso cookie tecnici e analitici)</li>
              <li>Informazioni fornite volontariamente tramite form di contatto</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Finalità del Trattamento</h2>
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Rispondere alle richieste di informazioni e contatto</li>
              <li>Fornire i servizi richiesti</li>
              <li>Migliorare l'esperienza utente sul sito</li>
              <li>Analisi statistiche anonime del traffico web</li>
              <li>Adempimenti di obblighi legali e contrattuali</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Base Giuridica</h2>
            <p>
              Il trattamento dei dati si basa sul consenso dell'interessato, sull'esecuzione di un contratto,
              sull'adempimento di obblighi legali e sul legittimo interesse del titolare.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cookie e Tecnologie di Tracciamento</h2>
            <p>
              Il sito utilizza cookie tecnici necessari al funzionamento e cookie analitici (Google Analytics, Yandex
              Metrika) solo previo consenso dell'utente. È possibile gestire le preferenze sui cookie attraverso il
              banner di consenso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Conservazione dei Dati</h2>
            <p>
              I dati personali sono conservati per il tempo necessario alle finalità per cui sono stati raccolti e
              comunque non oltre i termini previsti dalla normativa vigente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Diritti dell'Interessato</h2>
            <p>Ai sensi del GDPR (Regolamento UE 2016/679), l'interessato ha diritto di:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accedere ai propri dati personali</li>
              <li>Richiedere la rettifica o la cancellazione</li>
              <li>Limitare il trattamento</li>
              <li>Opporsi al trattamento</li>
              <li>Richiedere la portabilità dei dati</li>
              <li>Revocare il consenso in qualsiasi momento</li>
              <li>Proporre reclamo all'Autorità Garante</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Sicurezza</h2>
            <p>
              4BID.IT adotta misure di sicurezza tecniche e organizzative adeguate per proteggere i dati personali da
              accessi non autorizzati, perdita, distruzione o divulgazione.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Modifiche</h2>
            <p>
              Questa Privacy Policy può essere aggiornata periodicamente. La versione più recente è sempre disponibile
              su questa pagina.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Ultimo aggiornamento: Dicembre 2025</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contatti</h2>
            <p>
              Per esercitare i propri diritti o per qualsiasi informazione relativa al trattamento dei dati personali, è
              possibile contattare il Titolare agli indirizzi indicati sopra.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
