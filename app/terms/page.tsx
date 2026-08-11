import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft } from "lucide-react"
import Script from "next/script"
import { StructuredData } from "@/components/seo-structured-data"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Termini e Condizioni | 4BID SRL",
  description: "Termini e condizioni di utilizzo dei servizi di 4BID SRL",
  alternates: {
    canonical: "https://www.4bid.it/terms",
  },
}

export default function TermsPage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        title="Termini e Condizioni"
        description="Termini e condizioni di utilizzo dei servizi di 4BID SRL"
        url="https://www.4bid.it/terms"
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Termini e Condizioni", url: "https://www.4bid.it/terms" },
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

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Termini e Condizioni", href: "/terms" },
        ]}
      />

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
                <strong>4BID SRL</strong>
                <br />
                Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)
                <br />
                P.IVA: 06241710489
                <br />
                Email: info@4bid.it
              </p>
              <p className="mt-4">
                L'utilizzo del sito web implica l'accettazione integrale dei presenti Termini e Condizioni.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Servizi Offerti</h2>
              <p>4 BID SRL offre i seguenti servizi:</p>
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
                proprietà esclusiva di 4 BID SRL o dei rispettivi titolari e sono protetti dalle leggi italiane e
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
              <p>4 BID SRL si impegna a mantenere il sito aggiornato e funzionante, ma non garantisce:</p>
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
                4 BID SRL non sarà responsabile per danni diretti, indiretti, incidentali o consequenziali derivanti
                dall'utilizzo o dall'impossibilità di utilizzare il sito web, inclusi ma non limitati a: perdita di
                dati, interruzione dell'attività, perdita di profitti.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Continuità del Servizio, Manutenzione e Aggiornamenti
              </h2>
              <p>
                I servizi e i software di 4 BID SRL sono forniti &laquo;secondo disponibilit&agrave;&raquo;. 4 BID SRL si
                impegna a garantire la massima continuit&agrave; e affidabilit&agrave;, ma non garantisce che il
                funzionamento sia ininterrotto o del tutto esente da errori.
              </p>
              <p className="mt-4">
                Il Cliente prende atto e accetta che il servizio possa essere temporaneamente sospeso, rallentato o
                interrotto per attivit&agrave; di manutenzione ordinaria o straordinaria, aggiornamenti, migrazioni,
                interventi di sicurezza o miglioramenti tecnici. Ove possibile tali attivit&agrave; sono comunicate con
                ragionevole preavviso; quelle urgenti o legate alla sicurezza possono essere eseguite senza preavviso.
              </p>
              <p className="mt-4">
                4 BID SRL non &egrave; responsabile per malfunzionamenti, indisponibilit&agrave;, perdita di dati, cali di
                prestazioni o danni, diretti o indiretti, derivanti da:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>aggiornamenti, manutenzione o evoluzioni dei propri sistemi;</li>
                <li>
                  guasti, sospensioni, limitazioni o modifiche di servizi, API o infrastrutture di terze parti (a titolo
                  esemplificativo: hosting, connettivit&agrave;, PMS, channel manager, gateway di pagamento, provider di
                  messaggistica e fornitori cloud);
                </li>
                <li>
                  cause di forza maggiore o eventi comunque non imputabili a 4 BID SRL, inclusi guasti di rete, attacchi
                  informatici, interruzioni di energia elettrica ed eventi naturali;
                </li>
                <li>uso improprio, errato o non conforme del servizio da parte del Cliente o di terzi.</li>
              </ul>
              <p className="mt-4">
                Le interruzioni o i disservizi riconducibili alle attivit&agrave; e alle cause sopra indicate non danno
                diritto a rimborsi, indennizzi, riduzioni del canone o risoluzione anticipata del contratto. In ogni
                caso, ove una responsabilit&agrave; di 4 BID SRL dovesse essere accertata, essa sar&agrave; limitata
                all'importo effettivamente corrisposto dal Cliente per il servizio interessato nei 3 (tre) mesi
                precedenti l'evento, restando esclusi danni indiretti, mancati guadagni e perdite di opportunit&agrave;.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Durata, Rinnovo Automatico e Disdetta degli Abbonamenti
              </h2>
              <p>
                I servizi in abbonamento si rinnovano automaticamente alla scadenza del periodo scelto. La disdetta del
                rinnovo va comunicata per iscritto, senza penali, entro i seguenti termini:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>
                  <strong>Abbonamenti mensili:</strong> almeno 7 giorni prima della scadenza.
                </li>
                <li>
                  <strong>Abbonamenti annuali:</strong> almeno 30 giorni prima della normale scadenza.
                </li>
              </ul>
              <p className="mt-4">
                In assenza di disdetta entro i termini indicati, il servizio si rinnova automaticamente per un ulteriore
                periodo pari a quello scelto. In ogni caso il servizio resta attivo fino al termine del periodo
                gi&agrave; pagato.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Link a Siti Esterni</h2>
              <p>
                Il sito potrebbe contenere link a siti web di terze parti. 4 BID SRL non ha alcun controllo su tali siti
                e non è responsabile dei loro contenuti, delle loro politiche sulla privacy o delle loro pratiche.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Progetti in Sviluppo</h2>
              <p>
                I progetti presentati nella sezione "Progetti in Sviluppo" (MANUBOT, SANTADDEO, HOTEL ACCELERATOR, etc.)
                sono soggetti a continuo sviluppo. Le funzionalità, le tempistiche e le caratteristiche descritte
                possono variare. Le percentuali di avanzamento sono indicative.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Proposte di Investimento</h2>
              <p>
                Le informazioni relative ai progetti e alle opportunità di investimento presenti sul sito hanno
                carattere puramente informativo e non costituiscono offerta al pubblico di strumenti finanziari. Ogni
                eventuale collaborazione o investimento sarà oggetto di specifici accordi contrattuali.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Livelli di Servizio (SLA) e Impegni sui Progetti
              </h2>
              <p>
                I tempi indicati nelle pagine commerciali e nelle proposte (a titolo esemplificativo: risposta entro 24
                ore, primo contatto o avvio del progetto, setup o attivazione in 48 ore, supporto post-lancio) sono
                <strong> impegni obiettivo</strong> riferiti ai giorni lavorativi e calcolati dalla ricezione di tutte le
                informazioni, credenziali e materiali necessari da parte del Cliente.
              </p>
              <p className="mt-4">
                Tali tempi non costituiscono termini essenziali ai sensi dell'art. 1457 c.c. e possono variare in
                funzione della complessit&agrave; del progetto, della disponibilit&agrave; di servizi e API di terze
                parti e di cause non imputabili a 4 BID SRL (cfr. art. 7). Eventuali SLA vincolanti, con relative
                penali o indennizzi, si applicano solo se espressamente previsti e quantificati nel contratto o nella
                proposta economica sottoscritta dal Cliente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Assenza di Garanzia di Risultato</h2>
              <p>
                Le stime di performance, ritorno sull'investimento (ROI), incrementi di fatturato o di occupazione
                eventualmente riportate nelle pagine del sito o nel materiale commerciale hanno finalit&agrave;
                illustrative e si basano su risultati medi osservati con altri clienti. Esse
                <strong> non costituiscono una garanzia di risultato</strong>.
              </p>
              <p className="mt-4">
                I risultati effettivi dipendono da numerosi fattori esterni al controllo di 4 BID SRL (tra cui mercato,
                stagionalit&agrave;, posizionamento della struttura, prezzi e scelte gestionali del Cliente,
                applicazione delle indicazioni fornite). Salvo diverso accordo scritto e specifico, il pagamento dei
                corrispettivi non &egrave; subordinato al raggiungimento di un determinato risultato e non d&agrave;
                diritto a rimborsi in caso di mancato conseguimento delle stime.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Modifiche ai Termini</h2>
              <p>
                4 BID SRL si riserva il diritto di modificare i presenti Termini e Condizioni in qualsiasi momento. Le
                modifiche saranno efficaci dalla data di pubblicazione sul sito. L'uso continuato del sito dopo la
                pubblicazione delle modifiche costituisce accettazione delle stesse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Legge Applicabile e Foro Competente</h2>
              <p>
                I presenti Termini e Condizioni sono regolati dalla legge italiana. Per qualsiasi controversia derivante
                dall'interpretazione o esecuzione dei presenti termini sarà competente in via esclusiva il Foro di
                Firenze.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contatti</h2>
              <p>
                Per qualsiasi domanda relativa ai presenti Termini e Condizioni, contattare:
                <br />
                <strong>4 BID SRL</strong>
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
