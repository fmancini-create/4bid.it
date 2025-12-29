import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft } from "lucide-react"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Termini e Condizioni | 4 Bid SRL",
  description: "Termini e condizioni di utilizzo dei servizi di 4 Bid SRL",
}

export default function TermsPage() {
  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-S6YEEXE4C3');
        `}
      </Script>

      <Header />
      <main className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-600 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Termini e Condizioni</h1>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-sm text-gray-500 mb-8">
              Ultimo aggiornamento:{" "}
              {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Informazioni Generali</h2>
              <p>
                Il presente sito web è gestito da:
                <br />
                <strong>4 Bid SRL</strong>
                <br />
                Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)
                <br />
                P.IVA: [Inserire P.IVA]
                <br />
                Email: info@4bid.it
              </p>
              <p className="mt-4">
                L'utilizzo del sito web implica l'accettazione integrale dei presenti Termini e Condizioni.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Servizi Offerti</h2>
              <p>4 Bid SRL offre i seguenti servizi:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Consulenza in Revenue Management per strutture ricettive</li>
                <li>Analisi e ottimizzazione delle tariffe alberghiere</li>
                <li>Sviluppo di software e piattaforme tecnologiche per il settore hospitality</li>
                <li>Formazione e supporto in ambito revenue management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Proprietà Intellettuale</h2>
              <p>
                Tutti i contenuti presenti sul sito (testi, immagini, loghi, grafica, software, database) sono di
                proprietà esclusiva di 4 Bid SRL o dei rispettivi titolari e sono protetti dalle leggi italiane e
                internazionali sul diritto d'autore e sulla proprietà intellettuale.
              </p>
              <p className="mt-4">
                È vietata qualsiasi riproduzione, distribuzione, modifica o utilizzo non autorizzato dei contenuti.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Utilizzo del Sito</h2>
              <p>L'Utente si impegna a:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Utilizzare il sito in modo lecito e conforme alle presenti condizioni</li>
                <li>Non tentare di accedere a sezioni non autorizzate del sito</li>
                <li>Non utilizzare software automatici per accedere al sito</li>
                <li>Non diffondere contenuti illegali, offensivi o diffamatori</li>
                <li>Fornire dati veritieri nei form di contatto</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Esclusione di Garanzie</h2>
              <p>4 Bid SRL si impegna a mantenere il sito aggiornato e funzionante, ma non garantisce:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>La disponibilità continua e ininterrotta del servizio</li>
                <li>L'assenza di errori o virus</li>
                <li>L'accuratezza e completezza delle informazioni pubblicate</li>
              </ul>
              <p className="mt-4">
                I contenuti del sito hanno finalità puramente informative e non costituiscono consulenza professionale
                specifica.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitazione di Responsabilità</h2>
              <p>
                4 Bid SRL non sarà responsabile per danni diretti, indiretti, incidentali o consequenziali derivanti
                dall'utilizzo o dall'impossibilità di utilizzare il sito web, inclusi ma non limitati a: perdita di
                dati, interruzione dell'attività, perdita di profitti.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Link a Siti Esterni</h2>
              <p>
                Il sito potrebbe contenere link a siti web di terze parti. 4 Bid SRL non ha alcun controllo su tali siti
                e non è responsabile dei loro contenuti, delle loro politiche sulla privacy o delle loro pratiche.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Progetti in Sviluppo</h2>
              <p>
                I progetti presentati nella sezione "Progetti in Sviluppo" (MANUBOT, SANTADDEO, HOTEL ACCELERATOR, etc.)
                sono soggetti a continuo sviluppo. Le funzionalità, le tempistiche e le caratteristiche descritte
                possono variare. Le percentuali di avanzamento sono indicative.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Proposte di Investimento</h2>
              <p>
                Le informazioni relative ai progetti e alle opportunità di investimento presenti sul sito hanno
                carattere puramente informativo e non costituiscono offerta al pubblico di strumenti finanziari. Ogni
                eventuale collaborazione o investimento sarà oggetto di specifici accordi contrattuali.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modifiche ai Termini</h2>
              <p>
                4 Bid SRL si riserva il diritto di modificare i presenti Termini e Condizioni in qualsiasi momento. Le
                modifiche saranno efficaci dalla data di pubblicazione sul sito. L'uso continuato del sito dopo la
                pubblicazione delle modifiche costituisce accettazione delle stesse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Legge Applicabile e Foro Competente</h2>
              <p>
                I presenti Termini e Condizioni sono regolati dalla legge italiana. Per qualsiasi controversia derivante
                dall'interpretazione o esecuzione dei presenti termini sarà competente in via esclusiva il Foro di
                Firenze.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contatti</h2>
              <p>
                Per qualsiasi domanda relativa ai presenti Termini e Condizioni, contattare:
                <br />
                <strong>4 Bid SRL</strong>
                <br />
                Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)
                <br />
                Email: info@4bid.it
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
