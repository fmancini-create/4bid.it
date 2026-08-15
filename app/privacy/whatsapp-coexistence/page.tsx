import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata: Metadata = {
  title: "Privacy Policy WhatsApp Coexistence | 4BID SRL",
  description:
    "Informativa sul trattamento dei dati personali per l'app 4Bid WA Coexistence e i servizi WhatsApp Business di 4BID SRL.",
  alternates: {
    canonical: "https://www.4bid.it/privacy/whatsapp-coexistence",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function WhatsAppCoexistencePrivacyPage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        title="Privacy Policy di 4Bid WA Coexistence"
        description="Informativa sul trattamento dei dati personali per l'integrazione WhatsApp Business di 4BID SRL."
        url="https://www.4bid.it/privacy/whatsapp-coexistence"
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Privacy Policy", url: "https://www.4bid.it/privacy" },
          {
            name: "WhatsApp Coexistence",
            url: "https://www.4bid.it/privacy/whatsapp-coexistence",
          },
        ]}
      />

      <Header />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Privacy Policy", href: "/privacy" },
          { name: "WhatsApp Coexistence", href: "/privacy/whatsapp-coexistence" },
        ]}
      />

      <main className="min-h-screen bg-white pt-24">
        <article className="container mx-auto max-w-4xl px-4 py-12">
          <Link
            href="/privacy"
            className="mb-8 inline-flex items-center gap-2 text-amber-600 transition-colors hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Torna alla Privacy Policy generale
          </Link>

          <header className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
              4Bid WA Coexistence
            </p>
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              Informativa privacy per i servizi WhatsApp Business
            </h1>
            <p className="text-sm text-gray-500">Ultimo aggiornamento: 15 agosto 2026</p>
          </header>

          <div className="max-w-none text-lg leading-8 text-gray-700">
            <section className="mb-10">
              <p>
                La presente informativa descrive come 4 Bid SRL tratta i dati personali nell&apos;ambito
                dell&apos;applicazione <strong>4Bid WA Coexistence</strong> (Meta App ID 936407292081288) e
                dell&apos;integrazione con WhatsApp Business Platform. Integra la{" "}
                <Link href="/privacy" className="font-medium text-amber-700 underline">
                  Privacy Policy generale di 4BID
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Titolare del trattamento</h2>
              <p>
                <strong>4 Bid SRL</strong>
                <br />
                Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI), Italia
                <br />
                Email:{" "}
                <a className="font-medium text-amber-700 underline" href="mailto:info@4bid.it">
                  info@4bid.it
                </a>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Ambito e ruoli privacy</h2>
              <p>
                4 Bid SRL tratta come titolare autonomo i dati necessari a gestire registrazione, sicurezza,
                assistenza e rapporto contrattuale con le aziende che utilizzano il servizio. Quando tratta
                messaggi o dati dei contatti WhatsApp per conto di un&apos;azienda cliente, opera normalmente
                quale responsabile del trattamento sulla base delle istruzioni dell&apos;azienda, che rimane
                titolare del trattamento nei confronti dei propri clienti e contatti.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. Dati che possono essere trattati</h2>
              <p>In funzione delle autorizzazioni concesse e delle funzionalità attivate, possiamo trattare:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  dati dell&apos;azienda e degli amministratori autorizzati, come nome, recapiti professionali
                  e ruolo;
                </li>
                <li>
                  identificativi tecnici dell&apos;account WhatsApp Business, del numero di telefono e delle
                  risorse Meta collegate;
                </li>
                <li>
                  numero di telefono, nome profilo e altri identificativi dei contatti che comunicano con
                  l&apos;azienda tramite WhatsApp;
                </li>
                <li>
                  contenuto dei messaggi e degli eventuali allegati, quando necessario per inviare, ricevere,
                  sincronizzare o gestire la conversazione richiesta dall&apos;azienda;
                </li>
                <li>
                  metadati dei messaggi, come data e ora, stato di invio, consegna, lettura, risposta ed errori
                  tecnici;
                </li>
                <li>
                  log di sicurezza e funzionamento, indirizzo IP, informazioni sul dispositivo e attività
                  amministrative;
                </li>
                <li>dati forniti nelle richieste di assistenza.</li>
              </ul>
              <p className="mt-4">
                4 Bid SRL non acquista né vende elenchi di contatti WhatsApp e non utilizza i contenuti delle
                conversazioni per finalità pubblicitarie proprie.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. Finalità del trattamento</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>collegare e configurare l&apos;account WhatsApp Business autorizzato dall&apos;azienda;</li>
                <li>
                  consentire la coesistenza tra WhatsApp Business App e WhatsApp Business Platform, quando
                  disponibile e attivata;
                </li>
                <li>inviare, ricevere, sincronizzare e mostrare messaggi e relativi stati;</li>
                <li>gestire modelli di messaggio, webhook, notifiche e funzionalità operative richieste;</li>
                <li>fornire assistenza tecnica e risolvere errori;</li>
                <li>proteggere account, sistemi e utenti da abusi, frodi e accessi non autorizzati;</li>
                <li>adempiere a obblighi legali e richieste delle autorità competenti.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Base giuridica</h2>
              <p>Il trattamento si fonda, a seconda dei casi, su:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>esecuzione del contratto o di misure precontrattuali richieste dall&apos;azienda;</li>
                <li>adempimento di obblighi legali;</li>
                <li>
                  legittimo interesse di 4 Bid SRL alla sicurezza, continuità e miglioramento tecnico del
                  servizio;
                </li>
                <li>consenso, quando richiesto dalla normativa applicabile.</li>
              </ul>
              <p className="mt-4">
                L&apos;azienda cliente è responsabile di avere una base giuridica valida per comunicare con i
                propri contatti e di rispettare le regole applicabili ai messaggi di servizio e di marketing.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                6. Origine dei dati e autorizzazioni Meta
              </h2>
              <p>
                I dati possono essere forniti direttamente dall&apos;azienda cliente, dai suoi utenti
                autorizzati, dai contatti che scrivono su WhatsApp oppure da Meta Platforms attraverso le API
                e i webhook autorizzati. L&apos;integrazione accede esclusivamente alle risorse e alle
                autorizzazioni approvate dall&apos;amministratore dell&apos;azienda durante la procedura di
                collegamento.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                7. Destinatari, fornitori e trasferimenti
              </h2>
              <p>
                I dati possono essere trattati da personale autorizzato di 4 Bid SRL e da fornitori tecnici
                necessari all&apos;erogazione del servizio, quali hosting, infrastruttura cloud, sicurezza,
                monitoraggio e assistenza. Meta Platforms e le società del gruppo WhatsApp trattano i dati
                secondo i propri termini e informative. I fornitori sono selezionati e vincolati da obblighi
                di riservatezza e protezione dei dati.
              </p>
              <p className="mt-4">
                Qualora i dati siano trasferiti fuori dallo Spazio Economico Europeo, il trasferimento avviene
                mediante una base giuridica riconosciuta dal GDPR, incluse decisioni di adeguatezza o clausole
                contrattuali standard, ove applicabili.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. Conservazione</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  configurazioni e identificativi dell&apos;account: per la durata del collegamento e del
                  rapporto contrattuale;
                </li>
                <li>
                  contenuti e metadati dei messaggi: per il tempo necessario alla funzione richiesta e secondo
                  le impostazioni concordate con l&apos;azienda cliente;
                </li>
                <li>
                  log tecnici e di sicurezza: di norma fino a 12 mesi, salvo necessità di accertamento,
                  sicurezza o obblighi di legge;
                </li>
                <li>
                  dati amministrativi e contrattuali: per i periodi previsti dalla normativa applicabile.
                </li>
              </ul>
              <p className="mt-4">
                Alla cessazione del servizio i dati vengono cancellati o anonimizzati, salvo quelli che devono
                essere conservati per legge o per la tutela di diritti.
              </p>
            </section>

            <section id="cancellazione-dei-dati" className="mb-10 scroll-mt-28">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                9. Revoca dell&apos;accesso e cancellazione dei dati
              </h2>
              <p>
                L&apos;amministratore dell&apos;azienda può revocare l&apos;accesso dell&apos;app dalle
                impostazioni del proprio account Meta Business. La revoca interrompe i nuovi accessi, ma non
                sostituisce automaticamente una richiesta di cancellazione dei dati già conservati quando
                questa è necessaria.
              </p>
              <p className="mt-4">
                Per richiedere la cancellazione, inviare un&apos;email a{" "}
                <a className="font-medium text-amber-700 underline" href="mailto:info@4bid.it">
                  info@4bid.it
                </a>{" "}
                con oggetto <strong>“Cancellazione dati 4Bid WA Coexistence”</strong>, indicando:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>nome dell&apos;azienda e recapito del richiedente;</li>
                <li>numero WhatsApp Business interessato;</li>
                <li>
                  ID dell&apos;account WhatsApp Business, se disponibile, evitando di inviare password o token
                  di accesso;
                </li>
                <li>ruolo o titolo che autorizza il richiedente ad agire per l&apos;azienda.</li>
              </ul>
              <p className="mt-4">
                Potremo chiedere informazioni aggiuntive per verificare identità e autorizzazione. La
                richiesta sarà gestita entro i termini previsti dalla normativa applicabile. Comunicheremo
                l&apos;esito o gli eventuali dati che devono essere conservati per obbligo di legge.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">10. Diritti degli interessati</h2>
              <p>
                Nei casi previsti dagli articoli 15-22 del GDPR, l&apos;interessato può chiedere accesso,
                rettifica, cancellazione, limitazione, portabilità e opposizione, nonché revocare il consenso
                senza pregiudicare i trattamenti già effettuati. Le richieste possono essere inviate a{" "}
                <a className="font-medium text-amber-700 underline" href="mailto:info@4bid.it">
                  info@4bid.it
                </a>
                .
              </p>
              <p className="mt-4">
                È inoltre possibile presentare reclamo al{" "}
                <a
                  className="font-medium text-amber-700 underline"
                  href="https://www.garanteprivacy.it"
                  rel="noreferrer"
                  target="_blank"
                >
                  Garante per la protezione dei dati personali
                </a>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">11. Sicurezza</h2>
              <p>
                4 Bid SRL adotta misure tecniche e organizzative proporzionate al rischio, incluse gestione
                degli accessi, limitazione dei privilegi, protezione delle credenziali, tracciamento degli
                eventi e procedure di gestione degli incidenti. Gli utenti non devono mai trasmettere token,
                password o codici di verifica tramite email o chat di assistenza.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                12. Modifiche e contatti
              </h2>
              <p>
                La presente informativa può essere aggiornata per adeguarla a modifiche normative o tecniche.
                La data dell&apos;ultimo aggiornamento è riportata all&apos;inizio della pagina. Per domande
                sul trattamento dei dati o sul funzionamento dell&apos;integrazione, scrivere a{" "}
                <a className="font-medium text-amber-700 underline" href="mailto:info@4bid.it">
                  info@4bid.it
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  )
}
