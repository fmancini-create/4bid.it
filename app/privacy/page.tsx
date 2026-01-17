import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft } from "lucide-react"
import Script from "next/script"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata: Metadata = {
  title: "Privacy Policy | 4BID SRL",
  description: "Informativa sulla privacy e trattamento dei dati personali di 4BID SRL",
  alternates: {
    canonical: "https://4bid.it/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        title="Privacy Policy"
        description="Informativa sulla privacy e trattamento dei dati personali di 4BID SRL"
        url="https://4bid.it/privacy"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Privacy Policy", url: "https://4bid.it/privacy" },
        ]}
      />
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

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-sm text-gray-500 mb-8">
              Ultimo aggiornamento:{" "}
              {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Titolare del Trattamento</h2>
              <p>
                Il Titolare del trattamento dei dati personali è:
                <br />
                <strong>4 Bid SRL</strong>
                <br />
                Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)
                <br />
                Email: info@4bid.it
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Tipologie di Dati Raccolti</h2>
              <p>Tra i Dati Personali raccolti da questo sito web, in modo autonomo o tramite terze parti, ci sono:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Dati di utilizzo (pagine visitate, tempo di permanenza, etc.)</li>
                <li>Cookie e dati di navigazione</li>
                <li>Nome, cognome, email e telefono (quando compilati volontariamente nei form)</li>
                <li>Dati aziendali (nome struttura, tipologia, etc.)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Finalità del Trattamento</h2>
              <p>I Dati dell'Utente sono raccolti per le seguenti finalità:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>
                  <strong>Contatto:</strong> rispondere alle richieste inviate tramite i form di contatto
                </li>
                <li>
                  <strong>Statistiche:</strong> analizzare l'utilizzo del sito per migliorare i servizi offerti
                </li>
                <li>
                  <strong>Marketing:</strong> inviare comunicazioni commerciali (solo previo consenso esplicito)
                </li>
                <li>
                  <strong>Servizi:</strong> fornire consulenza e servizi di revenue management
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Base Giuridica del Trattamento</h2>
              <p>Il trattamento dei Dati Personali si basa su:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Consenso dell'interessato</li>
                <li>Esecuzione di un contratto o misure precontrattuali</li>
                <li>Legittimo interesse del Titolare</li>
                <li>Obblighi di legge</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookie</h2>
              <p>
                Questo sito utilizza cookie tecnici e di analisi. I cookie tecnici sono necessari per il funzionamento
                del sito. I cookie di analisi (Google Analytics) vengono utilizzati per raccogliere informazioni
                aggregate sull'utilizzo del sito.
              </p>
              <p className="mt-4">
                L'utente può gestire le preferenze sui cookie attraverso le impostazioni del proprio browser.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Periodo di Conservazione</h2>
              <p>
                I Dati sono trattati e conservati per il tempo richiesto dalle finalità per le quali sono stati
                raccolti:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Dati di contatto: fino a revoca del consenso o per 24 mesi dall'ultimo contatto</li>
                <li>Dati contrattuali: 10 anni dalla cessazione del rapporto</li>
                <li>Cookie di analisi: secondo le policy di Google Analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Diritti dell'Interessato</h2>
              <p>L'Utente può esercitare i seguenti diritti:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>
                  <strong>Accesso:</strong> ottenere conferma dell'esistenza di dati che lo riguardano
                </li>
                <li>
                  <strong>Rettifica:</strong> ottenere la correzione di dati inesatti
                </li>
                <li>
                  <strong>Cancellazione:</strong> ottenere la cancellazione dei dati
                </li>
                <li>
                  <strong>Limitazione:</strong> ottenere la limitazione del trattamento
                </li>
                <li>
                  <strong>Portabilità:</strong> ricevere i dati in formato strutturato
                </li>
                <li>
                  <strong>Opposizione:</strong> opporsi al trattamento per motivi legittimi
                </li>
                <li>
                  <strong>Revoca consenso:</strong> revocare il consenso in qualsiasi momento
                </li>
              </ul>
              <p className="mt-4">
                Per esercitare i propri diritti, l'Utente può inviare una richiesta a: <strong>info@4bid.it</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Sicurezza</h2>
              <p>
                4 Bid SRL adotta misure di sicurezza tecniche e organizzative adeguate per proteggere i Dati Personali
                da accessi non autorizzati, perdita o distruzione.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modifiche alla Privacy Policy</h2>
              <p>
                Il Titolare si riserva il diritto di apportare modifiche alla presente privacy policy in qualunque
                momento. Gli Utenti sono invitati a consultare periodicamente questa pagina.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contatti</h2>
              <p>
                Per qualsiasi domanda relativa alla presente Privacy Policy, contattare:
                <br />
                <strong>4 Bid SRL</strong>
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
