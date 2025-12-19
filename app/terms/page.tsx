import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Termini e Condizioni | 4BID.IT",
  description: "Termini e condizioni di utilizzo del sito 4BID.IT e dei servizi offerti.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://4bid.it/terms",
  },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Termini e Condizioni</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Informazioni Generali</h2>
            <p>
              Il presente documento regola i termini e le condizioni di utilizzo del sito web 4bid.it e dei servizi
              offerti da 4BID.IT S.r.l.
            </p>
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
            <h2 className="text-2xl font-semibold mb-4">2. Accettazione dei Termini</h2>
            <p>
              L'utilizzo del sito web e dei servizi implica l'accettazione integrale dei presenti termini e condizioni.
              Se non si accettano questi termini, si prega di non utilizzare il sito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Servizi Offerti</h2>
            <p>4BID.IT offre servizi di consulenza e sviluppo software specializzati in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Revenue Management per strutture ricettive</li>
              <li>Software personalizzati per la gestione alberghiera</li>
              <li>Analisi dati e ottimizzazione prezzi</li>
              <li>Formazione e supporto strategico</li>
              <li>Sviluppo di progetti digitali innovativi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Utilizzo del Sito</h2>
            <p>L'utente si impegna a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utilizzare il sito in conformità con le leggi applicabili</li>
              <li>Non tentare di accedere a aree riservate senza autorizzazione</li>
              <li>Non interferire con il corretto funzionamento del sito</li>
              <li>Non utilizzare il sito per scopi illeciti o fraudolenti</li>
              <li>Fornire informazioni veritiere quando richieste</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Proprietà Intellettuale</h2>
            <p>
              Tutti i contenuti del sito, inclusi testi, immagini, loghi, software e codice, sono protetti da diritti di
              proprietà intellettuale di 4BID.IT o dei rispettivi titolari. È vietata la riproduzione, distribuzione o
              modifica senza autorizzazione scritta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contratti di Servizio</h2>
            <p>
              I servizi di consulenza e sviluppo software sono regolati da contratti specifici che definiscono termini,
              condizioni, costi e tempistiche. Le condizioni generali qui riportate si applicano in via residuale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitazione di Responsabilità</h2>
            <p>
              4BID.IT si impegna a fornire servizi di qualità ma non può garantire risultati specifici. La società non è
              responsabile per:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Interruzioni temporanee del sito o dei servizi</li>
              <li>Errori o imprecisioni nei contenuti pubblicati</li>
              <li>Danni derivanti dall'uso improprio dei servizi</li>
              <li>Perdite economiche indirette</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Privacy e Trattamento Dati</h2>
            <p>
              Il trattamento dei dati personali è regolato dalla{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              in conformità al GDPR (Regolamento UE 2016/679).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Link Esterni</h2>
            <p>
              Il sito può contenere link a siti web di terze parti. 4BID.IT non è responsabile per il contenuto o le
              pratiche di privacy di tali siti esterni.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Modifiche ai Termini</h2>
            <p>
              4BID.IT si riserva il diritto di modificare i presenti termini in qualsiasi momento. Le modifiche saranno
              efficaci dalla data di pubblicazione sul sito. L'uso continuato del sito dopo le modifiche costituisce
              accettazione dei nuovi termini.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Legge Applicabile e Foro Competente</h2>
            <p>
              I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà competente il foro
              di Pistoia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contatti</h2>
            <p>Per domande sui presenti termini o sui servizi offerti, contattare:</p>
            <p>
              Email: info@4bid.it
              <br />
              PEC: 4bid@pec.it
              <br />
              Tel: +39 0573 1856252
            </p>
            <p className="text-sm text-muted-foreground mt-4">Ultimo aggiornamento: Dicembre 2025</p>
          </section>
        </div>
      </div>
    </main>
  )
}
