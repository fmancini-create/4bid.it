import {
  AppWindow,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Gauge,
  Layers3,
  LineChart,
  MonitorSmartphone,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

const sections = [
  ["01", "Sintesi", "Buona idea, percezione da aggiornare"],
  ["02", "Audit", "Mappa dell'audit preliminare"],
  ["03", "SEO", "Dove si perde potenziale"],
  ["04", "UX/UI", "Da sito-vetrina a software B2B"],
  ["05", "Conversione", "Un percorso pensato per il decisore"],
  ["06", "Case study", "Da pagina lunga a motore commerciale"],
  ["07", "Area clienti", "Da portale a prodotto moderno"],
  ["08", "Architettura", "Nuova architettura informativa"],
  ["09", "Direzione creativa", "Industrial premium"],
  ["10", "Growth OS", "CRM e performance system"],
  ["11", "App/PWA", "Accesso mobile per tutti"],
  ["12", "Tecnologia", "Architettura tecnica proposta"],
  ["13", "Roadmap", "Piano operativo 90 giorni"],
  ["14", "Proposta", "Cosa portare alla call"],
] as const

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">{children}</p>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{children}</span>
}

export function SmartUniformProposal() {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
      <div className="bg-neutral-950 px-6 py-12 text-white md:px-10 md:py-16">
        <Kicker>4BID · SMARTUNIFORM</Kicker>
        <div className="mt-5 max-w-4xl">
          <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Audit tecnico & proposta evolutiva
          </h2>
          <p className="mt-5 max-w-3xl text-pretty text-base leading-7 text-neutral-300 md:text-lg">
            Sito pubblico, SEO, UX/UI, architettura, app, CRM e strumenti per trasformare SmartUniform da servizio digitale a piattaforma B2B misurabile e scalabile.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Pill>SEO</Pill><Pill>UX/UI</Pill><Pill>App/PWA</Pill><Pill>CRM</Pill><Pill>Performance</Pill>
        </div>
      </div>

      <nav className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sections.map(([n, label]) => (
            <a key={n} href={`#smartuniform-${n}`} className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-red-300 hover:text-red-600">
              {n} · {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-20 px-6 py-10 md:px-10 md:py-14">
        <article id="smartuniform-01" className="scroll-mt-28">
          <Kicker>01 · Sintesi</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Buona idea, percezione da aggiornare</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card title="Cosa funziona già"><ul className="space-y-2"><li>• Autonomia del dipendente</li><li>• Riduzione del lavoro dell'Ufficio Sicurezza</li><li>• Controllo di budget e sprechi</li></ul></Card>
            <Card title="Il problema"><p>Il sito comunica bene il servizio, ma ancora poco la potenza di una piattaforma digitale scalabile per HR, HSE e Operations.</p></Card>
            <Card title="L'opportunità"><p>Posizionare SmartUniform come sistema operativo B2B per governare vestiario, DPI, budget, ordini, resi e performance.</p></Card>
          </div>
        </article>

        <article id="smartuniform-02" className="scroll-mt-28">
          <Kicker>02 · Audit preliminare</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Mappa dell'esperienza attuale</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card title="Sito pubblico"><MonitorSmartphone className="mb-3 size-6 text-red-600" /><p>Home, Chi siamo, Smart Uniform, Clienti, Contatti.</p></Card>
            <Card title="Area clienti"><ShieldCheck className="mb-3 size-6 text-red-600" /><p>Login separato e percezione più tradizionale rispetto al valore del prodotto.</p></Card>
            <Card title="Contenuti"><Layers3 className="mb-3 size-6 text-red-600" /><p>Valore reale presente, ma distribuito in pagine poco orientate a ruoli, settori e intenti di ricerca.</p></Card>
            <Card title="Evoluzione"><Sparkles className="mb-3 size-6 text-red-600" /><p>Nuovo frontend, prodotto moderno e layer CRM/performance.</p></Card>
          </div>
        </article>

        <article id="smartuniform-03" className="scroll-mt-28">
          <Kicker>03 · SEO</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Dove si perde potenziale</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <Card title="Criticità"><ul className="space-y-2"><li>• Pagine troppo generiche per intercettare ricerche verticali</li><li>• Case study non ancora sfruttati come landing SEO</li><li>• Possibile duplicazione tra pagine corporate da validare</li><li>• Dati strutturati, canonical e rich results da verificare</li></ul></Card>
              <Card title="Regola editoriale"><p>Una pagina = un intento chiaro, massimo 1–2 keyword principali, prova concreta e CTA coerente.</p></Card>
            </div>
            <div className="rounded-2xl bg-neutral-950 p-6 text-white">
              <Search className="size-7 text-red-500" />
              <h3 className="mt-4 text-xl font-semibold">Cluster da presidiare</h3>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-neutral-200">
                {[
                  "abbigliamento da lavoro aziendale",
                  "DPI aziendali",
                  "gestione taglie dipendenti",
                  "portale ordini divise aziendali",
                  "kit DPI per mansione",
                  "budget vestiario dipendenti",
                  "magazzino DPI e vestiario",
                ].map((x) => <span key={x} className="rounded-full border border-neutral-700 px-3 py-2">{x}</span>)}
              </div>
            </div>
          </div>
        </article>

        <article id="smartuniform-04" className="scroll-mt-28">
          <Kicker>04 · UX/UI</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Da sito-vetrina a software B2B</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card title="Nuova hero"><p>Messaggio più netto: “Gestisci DPI e abbigliamento aziendale come un processo digitale, non come un magazzino.”</p></Card>
            <Card title="CTA"><p>Doppio percorso: prenota demo + guarda il processo in 90 secondi.</p></Card>
            <Card title="Visual"><p>Più dashboard, workflow, kit, persone reali e mobile. Meno sito istituzionale, più prodotto.</p></Card>
            <Card title="Mobile-first"><p>Interfaccia pensata anche per operatori senza postazione fissa, con accesso semplice da smartphone.</p></Card>
          </div>
        </article>

        <article id="smartuniform-05" className="scroll-mt-28">
          <Kicker>05 · Navigabilità e conversione</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Un percorso pensato per chi decide</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {["Problema", "Soluzione", "Prova", "Azione"].map((x, i) => <div key={x} className="rounded-2xl border border-border p-5"><span className="text-xs font-semibold text-red-600">0{i+1}</span><p className="mt-2 font-semibold">{x}</p></div>)}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card title="Per ruolo"><p>Landing dedicate a HSE, HR, Operations e Procurement.</p></Card>
            <Card title="Per settore"><p>Industria, nautica, logistica, hospitality e altri verticali reali.</p></Card>
            <Card title="Strumenti di conversione"><p>Demo guidata, video breve, calcolatore risparmio, FAQ, case study con dati.</p></Card>
          </div>
        </article>

        <article id="smartuniform-06" className="scroll-mt-28">
          <Kicker>06 · Case study</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Da pagina lunga a motore commerciale</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {["NEXT Yacht Group", "Burgess Norton", "Bluegame", "Sanlorenzo", "Baglietto"].map((x) => <div key={x} className="rounded-2xl border border-border p-4 text-sm font-medium">{x}</div>)}
          </div>
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-900">Formato consigliato</p>
            <p className="mt-2 text-sm leading-6 text-red-800">Problema → Soluzione → KPI prima/dopo → testimonianza → settore/dimensione cliente → CTA demo.</p>
          </div>
        </article>

        <article id="smartuniform-07" className="scroll-mt-28">
          <Kicker>07 · Area clienti</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Da portale a prodotto moderno</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card title="Ruoli"><Users className="mb-3 size-6 text-red-600" /><p>Dipendente, responsabile, HR/HSE, amministratore.</p></Card>
            <Card title="Workflow"><Route className="mb-3 size-6 text-red-600" /><p>Ordine, approvazione, budget, reso, sostituzione.</p></Card>
            <Card title="Dashboard"><Gauge className="mb-3 size-6 text-red-600" /><p>Consumi, storico, disponibilità, anomalie e SLA.</p></Card>
            <Card title="Accesso"><AppWindow className="mb-3 size-6 text-red-600" /><p>Esperienza moderna e responsive, coerente col nuovo brand.</p></Card>
          </div>
        </article>

        <article id="smartuniform-08" className="scroll-mt-28">
          <Kicker>08 · Architettura informativa</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Nuovo sito orientato a ricerca e conversione</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Home", "value proposition, proof, demo"],
              ["Soluzioni per ruolo", "HSE, HR, Operations"],
              ["Soluzioni per settore", "industria, nautica, logistica..."],
              ["Prodotto", "dashboard, ordini, budget, resi"],
              ["Clienti", "case study singoli e misurabili"],
              ["Risorse", "guide, FAQ, benchmark, calcolatore"],
            ].map(([a,b]) => <Card key={a} title={a}><p>{b}</p></Card>)}
          </div>
        </article>

        <article id="smartuniform-09" className="scroll-mt-28">
          <Kicker>09 · Direzione creativa</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Industrial premium</h2>
          <div className="mt-6 rounded-3xl bg-neutral-950 p-8 text-white md:p-10">
            <div className="grid gap-8 md:grid-cols-2">
              <div><p className="text-sm text-red-500">Principio</p><p className="mt-2 text-2xl font-semibold">Meno brochure. Più prodotto, dati e controllo.</p></div>
              <ul className="space-y-3 text-sm leading-6 text-neutral-300"><li>• Nero, bianco e rosso con maggiore respiro</li><li>• Gerarchia tipografica più netta</li><li>• Dashboard e processi come asset visivi</li><li>• Copy orientato a risultati misurabili</li></ul>
            </div>
          </div>
        </article>

        <article id="smartuniform-10" className="scroll-mt-28">
          <Kicker>10 · SmartUniform Growth OS</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">CRM + customer success + performance system</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card title="CRM"><Target className="mb-3 size-6 text-red-600" /><p>Lead, pipeline, demo, follow-up, rinnovi e upsell.</p></Card>
            <Card title="Customer Success"><Users className="mb-3 size-6 text-red-600" /><p>Health score, ticket, resi, SLA, soddisfazione e adozione.</p></Card>
            <Card title="Performance"><BarChart3 className="mb-3 size-6 text-red-600" /><p>Budget, ordini, utilizzo, sprechi, tempi, errori e benchmark.</p></Card>
            <Card title="AI"><Bot className="mb-3 size-6 text-red-600" /><p>Assistente operativo, anomalie, previsioni, rischio churn e opportunità.</p></Card>
          </div>
        </article>

        <article id="smartuniform-11" className="scroll-mt-28">
          <Kicker>11 · App / PWA</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Accesso mobile per tutti</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {["Onboarding e taglie", "Scelta capi", "Approvazione e budget", "Notifiche", "Resi e supporto"].map((x) => <div key={x} className="rounded-2xl border border-border p-5 text-sm font-medium">{x}</div>)}
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground"><strong className="text-foreground">Scelta tecnica:</strong> PWA installabile come prima fase; app native solo se servono funzioni device/store che giustifichino il costo.</div>
        </article>

        <article id="smartuniform-12" className="scroll-mt-28">
          <Kicker>12 · Architettura tecnica</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Una piattaforma componibile</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Card title="Frontend pubblico"><p>SEO, performance, landing, case study e contenuti.</p></Card>
            <Card title="Product/API"><p>Utenti, ruoli, kit, ordini, budget, resi, approvazioni.</p></Card>
            <Card title="Data layer"><p>Eventi, tracking, CRM, BI, audit, customer health.</p></Card>
            <Card title="App/PWA"><p>Esperienza mobile dipendente e manager.</p></Card>
          </div>
          <div className="mt-6 rounded-2xl bg-neutral-950 p-6 text-sm leading-6 text-neutral-300"><strong className="text-white">Prima di progettare:</strong> verificare stack attuale, database, integrazioni, hosting, sicurezza, privacy/GDPR, logistica e flussi reali.</div>
        </article>

        <article id="smartuniform-13" className="scroll-mt-28">
          <Kicker>13 · Roadmap</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">90 giorni per passare dalla visione al prodotto</h2>
          <div className="mt-8 space-y-3">
            {[
              ["0–2 settimane", "Audit tecnico, analytics, SEO, UX e mappa dei flussi"],
              ["3–5 settimane", "Nuovo sito, design system, contenuti e prototipo"],
              ["6–9 settimane", "MVP app/PWA e dashboard area clienti"],
              ["10–12 settimane", "CRM, performance layer, automazioni e KPI"],
            ].map(([t,d]) => <div key={t} className="grid gap-2 rounded-2xl border border-border p-5 md:grid-cols-[160px_1fr]"><p className="font-semibold text-red-600">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>)}
          </div>
        </article>

        <article id="smartuniform-14" className="scroll-mt-28">
          <Kicker>14 · Proposta per la call</Kicker>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Tre blocchi, una sola evoluzione</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card title="1. Audit"><p>SEO, UX/UI, tecnologia, sicurezza, performance, analytics e processi.</p></Card>
            <Card title="2. Redesign pubblico"><p>Nuovo posizionamento, architettura, design system, contenuti e conversione.</p></Card>
            <Card title="3. Evoluzione piattaforma"><p>Area clienti moderna, app/PWA, CRM, customer success e performance system.</p></Card>
          </div>
          <div className="mt-8 rounded-3xl bg-red-600 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-100">Chiusura consigliata</p>
            <p className="mt-3 max-w-4xl text-2xl font-semibold leading-tight md:text-3xl">Partiamo con un audit rapido e un prototipo: in due settimane mostriamo il nuovo posizionamento, la nuova architettura e un MVP navigabile dell'esperienza.</p>
          </div>
        </article>
      </div>
    </section>
  )
}
