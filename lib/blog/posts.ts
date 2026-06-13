// Motore contenuti Blog/Guide 4BID — data-driven, statico, SEO-oriented.
// Per aggiungere un articolo: aggiungi un oggetto BlogPost all'array `posts`.

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "callout"; variant: "tip" | "warning"; title?: string; text: string }
  | { type: "formula"; label?: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }

export interface FaqItem {
  question: string
  answer: string
}

export interface RelatedLink {
  title: string
  url: string
}

export interface BlogPost {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  category: string
  keywords: string[]
  datePublished: string
  dateModified: string
  readingMinutes: number
  intro: string
  body: ContentBlock[]
  faqs: FaqItem[]
  related: RelatedLink[]
}

export const posts: BlogPost[] = [
  {
    slug: "come-calcolare-revpar-bed-and-breakfast",
    title: "Come calcolare il RevPAR di un B&B (con esempio pratico)",
    metaTitle: "Come Calcolare il RevPAR di un B&B: Formula ed Esempio | 4BID",
    metaDescription:
      "Guida pratica al calcolo del RevPAR per un B&B: formula, esempio numerico passo passo e come usarlo per aumentare i ricavi della tua struttura.",
    excerpt:
      "La formula del RevPAR spiegata con un esempio numerico reale, pensata per chi gestisce un piccolo B&B e vuole capire davvero quanto rende ogni camera.",
    category: "Metriche e KPI",
    keywords: [
      "come calcolare revpar b&b",
      "revpar bed and breakfast",
      "formula revpar",
      "kpi b&b",
      "ricavo per camera disponibile",
    ],
    datePublished: "2026-06-13",
    dateModified: "2026-06-13",
    readingMinutes: 6,
    intro:
      "Il RevPAR è probabilmente la metrica più importante per capire la salute economica di un B&B, eppure molti gestori non lo calcolano. In questa guida vediamo cos'è, come si calcola con un esempio numerico reale e come usarlo per prendere decisioni migliori.",
    body: [
      { type: "heading", text: "Cos'è il RevPAR" },
      {
        type: "paragraph",
        text: "RevPAR è l'acronimo di *Revenue Per Available Room*, ovvero il ricavo medio per camera disponibile. A differenza della tariffa media, il RevPAR tiene conto sia del prezzo a cui vendi le camere sia di quante ne vendi davvero: per questo è l'indicatore più onesto del rendimento reale della tua struttura.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Perché è importante",
        text: "Due B&B con la stessa tariffa media possono avere ricavi molto diversi. Il RevPAR ti dice quale dei due sta davvero sfruttando al meglio le camere disponibili.",
      },
      { type: "heading", text: "La formula del RevPAR" },
      {
        type: "paragraph",
        text: "Esistono due modi equivalenti per calcolarlo. Il primo parte dal ricavo totale delle camere:",
      },
      {
        type: "formula",
        label: "Metodo 1",
        text: "RevPAR = Ricavo totale camere ÷ Numero di camere disponibili",
      },
      {
        type: "paragraph",
        text: "Il secondo metodo parte da due metriche che probabilmente già conosci, l'ADR (tariffa media giornaliera) e il tasso di occupazione:",
      },
      {
        type: "formula",
        label: "Metodo 2",
        text: "RevPAR = ADR × Tasso di occupazione",
      },
      { type: "heading", text: "Esempio pratico passo passo" },
      {
        type: "paragraph",
        text: "Immaginiamo un B&B con **5 camere**. Nel mese di giugno (30 giorni) la disponibilità totale è quindi di 5 × 30 = 150 camere-notte. Supponiamo questi dati:",
      },
      {
        type: "table",
        headers: ["Dato", "Valore"],
        rows: [
          ["Camere disponibili nel mese", "150 camere-notte"],
          ["Camere effettivamente vendute", "108 camere-notte"],
          ["Ricavo totale camere", "9.720 €"],
        ],
      },
      { type: "subheading", text: "Calcolo con il Metodo 1" },
      {
        type: "formula",
        text: "RevPAR = 9.720 € ÷ 150 = 64,80 €",
      },
      { type: "subheading", text: "Calcolo con il Metodo 2" },
      {
        type: "paragraph",
        text: "Prima calcoliamo ADR e occupazione, poi li moltiplichiamo:",
      },
      {
        type: "list",
        items: [
          "ADR = 9.720 € ÷ 108 camere vendute = 90,00 €",
          "Occupazione = 108 ÷ 150 = 72%",
          "RevPAR = 90,00 € × 0,72 = 64,80 €",
        ],
      },
      {
        type: "paragraph",
        text: "Come vedi i due metodi danno lo stesso risultato: **64,80 € di ricavo per ogni camera disponibile**, comprese quelle rimaste vuote.",
      },
      { type: "heading", text: "Come usare il RevPAR per aumentare i ricavi" },
      {
        type: "paragraph",
        text: "Il valore in sé dice poco: il RevPAR diventa utile quando lo confronti nel tempo e ne capisci le leve. Hai solo due modi per farlo crescere:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Alzare l'ADR (vendere a tariffe più alte) senza perdere troppa occupazione.",
          "Aumentare l'occupazione senza svendere le camere.",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Errore da evitare",
        text: "Abbassare i prezzi per riempire le camere può far crollare il RevPAR: se sconti troppo, l'aumento di occupazione non compensa la perdita di tariffa media. Verifica sempre l'effetto sul RevPAR, non solo sull'occupazione.",
      },
      {
        type: "paragraph",
        text: "Confronta il RevPAR di questo giugno con quello dello stesso mese dell'anno scorso (confronto *anno su anno*): è il modo più affidabile per capire se la tua strategia tariffaria sta funzionando, perché neutralizza la stagionalità.",
      },
    ],
    faqs: [
      {
        question: "Qual è un buon valore di RevPAR per un B&B?",
        answer:
          "Non esiste un valore valido per tutti: dipende dalla località, dalla stagione e dal posizionamento. Il riferimento corretto è il tuo stesso RevPAR nello stesso periodo dell'anno precedente e quello dei competitor diretti della tua zona.",
      },
      {
        question: "Il RevPAR include la colazione o i servizi extra?",
        answer:
          "No, il RevPAR classico considera solo il ricavo delle camere. Per misurare il ricavo totale comprensivo di colazione, servizi e altri reparti si usa il TRevPAR (Total Revenue Per Available Room).",
      },
      {
        question: "Devo calcolare il RevPAR ogni giorno?",
        answer:
          "Per un piccolo B&B è sufficiente un calcolo settimanale o mensile, confrontato con lo stesso periodo dell'anno precedente. L'importante è la costanza nel monitoraggio.",
      },
    ],
    related: [
      { title: "ADR e RevPAR: differenze, formule ed esempi", url: "/blog/differenza-adr-revpar" },
      { title: "Guida completa al Revenue Management Hotel", url: "/guida-revenue-management-hotel" },
      { title: "KPI e Metriche per Hotel", url: "/kpi-metriche-hotel" },
    ],
  },
  {
    slug: "differenza-adr-revpar",
    title: "ADR e RevPAR: differenze, formule ed esempi",
    metaTitle: "Differenza tra ADR e RevPAR: Formule ed Esempi | 4BID",
    metaDescription:
      "ADR e RevPAR spiegati in modo semplice: cosa misurano, le formule, un esempio a confronto e quando usare l'uno o l'altro per gestire i ricavi dell'hotel.",
    excerpt:
      "Due metriche spesso confuse ma profondamente diverse. Ecco cosa misurano davvero ADR e RevPAR, con un esempio che mostra perché guardare solo l'ADR può ingannare.",
    category: "Metriche e KPI",
    keywords: [
      "differenza adr revpar",
      "adr hotel",
      "revpar hotel",
      "tariffa media giornaliera",
      "kpi hotel",
    ],
    datePublished: "2026-06-13",
    dateModified: "2026-06-13",
    readingMinutes: 5,
    intro:
      "ADR e RevPAR sono le due metriche più citate nel revenue management alberghiero e anche le più confuse. Capire la differenza è fondamentale: guardare solo l'ADR può darti un'idea completamente sbagliata di come sta andando la tua struttura.",
    body: [
      { type: "heading", text: "Cosa misura l'ADR" },
      {
        type: "paragraph",
        text: "L'ADR (*Average Daily Rate*, tariffa media giornaliera) indica il prezzo medio a cui hai venduto le camere effettivamente occupate. Risponde alla domanda: *quanto ho incassato in media per ogni camera venduta?*",
      },
      { type: "formula", label: "ADR", text: "ADR = Ricavo camere ÷ Camere vendute" },
      { type: "heading", text: "Cosa misura il RevPAR" },
      {
        type: "paragraph",
        text: "Il RevPAR (*Revenue Per Available Room*) indica il ricavo medio per camera disponibile, incluse quelle rimaste vuote. Risponde alla domanda: *quanto sto ricavando da tutta la mia capacità?*",
      },
      { type: "formula", label: "RevPAR", text: "RevPAR = Ricavo camere ÷ Camere disponibili" },
      {
        type: "callout",
        variant: "tip",
        title: "La differenza in una frase",
        text: "L'ADR misura quanto vendi bene le camere occupate; il RevPAR misura quanto sfrutti bene tutta la struttura. Il RevPAR include l'effetto dell'occupazione, l'ADR no.",
      },
      { type: "heading", text: "Esempio a confronto: due hotel a confronto" },
      {
        type: "paragraph",
        text: "Prendiamo due hotel da 20 camere nello stesso giorno. Hanno ADR molto diversi, ma guarda cosa succede al RevPAR:",
      },
      {
        type: "table",
        headers: ["", "Hotel A", "Hotel B"],
        rows: [
          ["Camere disponibili", "20", "20"],
          ["Camere vendute", "10", "16"],
          ["ADR", "140 €", "100 €"],
          ["Ricavo camere", "1.400 €", "1.600 €"],
          ["Occupazione", "50%", "80%"],
          ["RevPAR", "70 €", "80 €"],
        ],
      },
      {
        type: "paragraph",
        text: "L'Hotel A ha un ADR più alto (140 € contro 100 €) e potrebbe sembrare il più performante. Ma l'Hotel B, vendendo più camere, ottiene un **RevPAR superiore** (80 € contro 70 €) e quindi incassa di più. Ecco perché l'ADR da solo inganna.",
      },
      { type: "heading", text: "Quando guardare l'uno e quando l'altro" },
      {
        type: "list",
        items: [
          "Usa l'**ADR** per valutare la tua politica di prezzo e il posizionamento rispetto ai competitor.",
          "Usa il **RevPAR** per valutare la performance complessiva e confrontare periodi diversi.",
          "Guarda **sempre entrambi insieme**: un RevPAR in crescita con ADR in calo significa che stai riempiendo a sconto.",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Attenzione",
        text: "Inseguire un ADR record sacrificando l'occupazione, o un'occupazione del 100% svendendo le camere, sono entrambi errori. L'obiettivo è massimizzare il RevPAR, che bilancia le due cose.",
      },
    ],
    faqs: [
      {
        question: "È meglio avere un ADR alto o un RevPAR alto?",
        answer:
          "Conta il RevPAR, perché rappresenta il ricavo reale su tutta la capacità. Un ADR alto è positivo solo se non fa crollare l'occupazione al punto da ridurre il RevPAR.",
      },
      {
        question: "ADR e tariffa media sono la stessa cosa?",
        answer:
          "Sì, ADR (Average Daily Rate) e tariffa media giornaliera sono sinonimi e indicano il ricavo medio per camera venduta in un dato periodo.",
      },
      {
        question: "Esiste una metrica ancora più completa?",
        answer:
          "Sì, il TRevPAR (Total Revenue Per Available Room) considera tutti i ricavi della struttura, non solo le camere, ed è utile per hotel con ristorante, spa o altri servizi.",
      },
    ],
    related: [
      { title: "Come calcolare il RevPAR di un B&B", url: "/blog/come-calcolare-revpar-bed-and-breakfast" },
      { title: "Ottimizzazione dell'ADR per Hotel", url: "/ottimizzazione-adr-hotel" },
      { title: "KPI e Metriche per Hotel", url: "/kpi-metriche-hotel" },
    ],
  },
  {
    slug: "strategia-tariffaria-agriturismo-esempio",
    title: "Strategia tariffaria per agriturismo: un esempio pratico",
    metaTitle: "Strategia Tariffaria Agriturismo: Esempio Pratico | 4BID",
    metaDescription:
      "Esempio concreto di strategia tariffaria per un agriturismo: tariffe stagionali, soggiorno minimo, last minute e come gestire alta e bassa stagione.",
    excerpt:
      "Un esempio concreto e replicabile di come impostare i prezzi di un agriturismo durante l'anno, tra alta stagione, bassa stagione ed eventi locali.",
    category: "Strategie di prezzo",
    keywords: [
      "strategia tariffaria agriturismo",
      "prezzi agriturismo",
      "tariffe stagionali agriturismo",
      "revenue management agriturismo",
      "soggiorno minimo",
    ],
    datePublished: "2026-06-13",
    dateModified: "2026-06-13",
    readingMinutes: 7,
    intro:
      "Gli agriturismi hanno caratteristiche uniche: forte stagionalità, soggiorni più lunghi e una clientela attratta dall'esperienza più che dal prezzo. Vediamo un esempio concreto di strategia tariffaria pensata proprio per questa tipologia di struttura.",
    body: [
      { type: "heading", text: "Il punto di partenza: conoscere la propria stagionalità" },
      {
        type: "paragraph",
        text: "Prima di fissare qualsiasi prezzo serve dividere l'anno in periodi omogenei di domanda. Per un agriturismo tipico dell'Italia centrale possiamo individuare quattro fasce:",
      },
      {
        type: "table",
        headers: ["Periodo", "Stagione", "Domanda"],
        rows: [
          ["Giugno – Settembre, festività", "Alta stagione", "Molto forte"],
          ["Aprile – Maggio, Ottobre", "Media stagione", "Buona"],
          ["Weekend e ponti fuori stagione", "Picchi brevi", "Variabile"],
          ["Novembre – Marzo (feriali)", "Bassa stagione", "Debole"],
        ],
      },
      { type: "heading", text: "Esempio di griglia tariffaria" },
      {
        type: "paragraph",
        text: "Ipotizziamo una camera doppia con una tariffa di riferimento di 120 € a notte. Una possibile struttura tariffaria differenziata per stagione potrebbe essere:",
      },
      {
        type: "table",
        headers: ["Periodo", "Tariffa notte", "Soggiorno minimo"],
        rows: [
          ["Alta stagione", "150 €", "3 notti"],
          ["Media stagione", "120 €", "2 notti"],
          ["Bassa stagione", "90 €", "Nessuno"],
          ["Eventi locali / ponti", "160 €", "2-3 notti"],
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "Leva del soggiorno minimo",
        text: "Per gli agriturismi il soggiorno minimo (MinLOS) è una leva potente: in alta stagione protegge dai soggiorni brevi poco redditizi, mentre in bassa stagione va eliminato per non scoraggiare le prenotazioni.",
      },
      { type: "heading", text: "Gestire la bassa stagione senza svendere" },
      {
        type: "paragraph",
        text: "L'errore più comune in bassa stagione è abbassare semplicemente i prezzi. Meglio invece aggiungere valore e creare motivi per prenotare:",
      },
      {
        type: "list",
        items: [
          "Pacchetti tematici (degustazione, vendemmia, raccolta olive, esperienze in fattoria).",
          "Offerte 'lunga permanenza' con sconto progressivo dalla terza o quarta notte.",
          "Promozioni mirate per soggiorni infrasettimanali, quando la domanda è più debole.",
          "Collaborazioni con ristoranti, cantine e attività esperienziali della zona.",
        ],
      },
      { type: "heading", text: "Sfruttare gli eventi locali" },
      {
        type: "paragraph",
        text: "Sagre, fiere, eventi enogastronomici e manifestazioni sportive generano picchi di domanda prevedibili. Costruisci un calendario degli eventi della tua zona per i prossimi 12 mesi e alza le tariffe (e il soggiorno minimo) nelle date interessate, con anticipo.",
      },
      {
        type: "callout",
        variant: "warning",
        title: "Last minute con prudenza",
        text: "Le tariffe last minute servono a riempire camere altrimenti invendute, ma se diventano abituali insegnano ai clienti ad aspettare. Usale solo a ridosso della data e mai in modo sistematico in alta stagione.",
      },
      { type: "heading", text: "La regola d'oro: misurare e correggere" },
      {
        type: "paragraph",
        text: "Nessuna griglia tariffaria è perfetta al primo colpo. Imposta i prezzi, monitora l'andamento delle prenotazioni (il *pick-up*) rispetto allo stesso periodo dell'anno precedente e correggi: se ti riempi troppo presto, probabilmente i prezzi sono bassi; se resti vuoto sotto data, vanno riviste tariffe o restrizioni.",
      },
    ],
    faqs: [
      {
        question: "Ogni quanto va aggiornata la strategia tariffaria di un agriturismo?",
        answer:
          "La griglia base si imposta una volta all'anno, ma va rivista mensilmente in base all'andamento delle prenotazioni e agli eventi della zona. In alta stagione conviene un controllo settimanale.",
      },
      {
        question: "Conviene usare tariffe dinamiche anche per un piccolo agriturismo?",
        answer:
          "Sì, anche in forma semplice: bastano poche fasce di prezzo legate a stagione, occupazione ed eventi. Non serve un software complesso per ottenere i primi benefici, ma aiuta a gestire la cosa in modo sistematico.",
      },
      {
        question: "Il soggiorno minimo riduce le prenotazioni?",
        answer:
          "In alta stagione no, perché la domanda è alta e il MinLOS aumenta il ricavo per prenotazione. In bassa stagione invece va tolto, perché rischia di scoraggiare i soggiorni brevi che sono comunque preziosi.",
      },
    ],
    related: [
      { title: "Revenue Management per Agriturismo", url: "/revenue-management-agriturismo" },
      { title: "Strategie di Pricing per Hotel", url: "/strategie-pricing-hotel" },
      { title: "Guida al Pricing Hotel", url: "/guida-pricing-hotel" },
    ],
  },
  {
    slug: "aumentare-prenotazioni-dirette-piccolo-hotel",
    title: "Come aumentare le prenotazioni dirette di un piccolo hotel",
    metaTitle: "Aumentare le Prenotazioni Dirette di un Piccolo Hotel | 4BID",
    metaDescription:
      "Strategie pratiche per aumentare le prenotazioni dirette di un piccolo hotel e ridurre le commissioni OTA: sito, parità tariffaria, incentivi e fidelizzazione.",
    excerpt:
      "Ridurre la dipendenza dalle OTA è possibile anche per una piccola struttura. Ecco le leve concrete per spostare quote di prenotazioni sul canale diretto.",
    category: "Distribuzione",
    keywords: [
      "aumentare prenotazioni dirette hotel",
      "ridurre commissioni ota",
      "prenotazioni dirette piccolo hotel",
      "disintermediazione hotel",
      "booking diretto",
    ],
    datePublished: "2026-06-13",
    dateModified: "2026-06-13",
    readingMinutes: 7,
    intro:
      "Le OTA portano visibilità ma costano commissioni che erodono i margini. Per un piccolo hotel ogni prenotazione diretta in più significa più redditività. Vediamo le leve concrete per aumentarle, senza bisogno di grandi budget.",
    body: [
      { type: "heading", text: "Perché le prenotazioni dirette contano" },
      {
        type: "paragraph",
        text: "Una prenotazione tramite OTA può costare dal 15% al 25% di commissione. Su una camera da 100 € significa 15-25 € persi a notte. Spostare anche solo una parte delle prenotazioni sul canale diretto migliora direttamente il margine, senza dover vendere una camera in più.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Le OTA non sono il nemico",
        text: "Le OTA restano fondamentali per farsi conoscere (il cosiddetto 'effetto vetrina'). L'obiettivo non è eliminarle, ma convertire in diretta i clienti che ti hanno già scoperto.",
      },
      { type: "heading", text: "1. Un sito web che converte" },
      {
        type: "paragraph",
        text: "Il sito è il tuo canale diretto principale. Per trasformare le visite in prenotazioni deve avere alcune caratteristiche di base:",
      },
      {
        type: "list",
        items: [
          "Motore di prenotazione (booking engine) visibile e semplice, utilizzabile da mobile.",
          "Velocità di caricamento elevata, soprattutto su smartphone.",
          "Foto di qualità e descrizioni chiare di camere e servizi.",
          "Pulsante di prenotazione sempre visibile, senza passaggi inutili.",
        ],
      },
      { type: "heading", text: "2. Rispettare la parità tariffaria (anzi, premiare il diretto)" },
      {
        type: "paragraph",
        text: "Se sul tuo sito la stessa camera costa più che sulle OTA, nessuno prenoterà in diretta. La tariffa diretta deve essere **almeno uguale** a quella OTA, e idealmente offrire un piccolo vantaggio esclusivo che le OTA non possono replicare.",
      },
      {
        type: "list",
        items: [
          "Tariffa diretta uguale o migliore di quella pubblicata sulle OTA.",
          "Vantaggi esclusivi: late check-out, upgrade soggetto a disponibilità, colazione inclusa, parcheggio gratuito.",
          "Cancellazione più flessibile sulla tariffa diretta.",
        ],
      },
      { type: "heading", text: "3. Dare un motivo per prenotare in diretta" },
      {
        type: "paragraph",
        text: "Il cliente che ti ha trovato su una OTA spesso cerca il tuo nome su Google prima di prenotare (il fenomeno del *billboard effect*). In quel momento devi convincerlo:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Comunica chiaramente i vantaggi del 'prenota dal sito ufficiale'.",
          "Mostra recensioni positive direttamente sul sito.",
          "Offri un codice sconto per la prima prenotazione diretta o per chi torna.",
          "Rendi semplice contattarti (WhatsApp, telefono, form rapido).",
        ],
      },
      { type: "heading", text: "4. Fidelizzare chi è già stato da te" },
      {
        type: "paragraph",
        text: "Il cliente che ha già soggiornato è il più facile da riportare in diretta, perché si fida. Raccogli (nel rispetto del GDPR) le email dei clienti e mantieni il contatto:",
      },
      {
        type: "list",
        items: [
          "Email di ringraziamento dopo il soggiorno con invito a prenotare la prossima volta dal sito.",
          "Offerte riservate ai clienti di ritorno.",
          "Newsletter con eventi della zona e pacchetti stagionali.",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Misura sempre il canale",
        text: "Per capire se la strategia funziona devi sapere quante prenotazioni arrivano da ogni canale. Monitora la quota diretta nel tempo: è l'unico modo per sapere se stai davvero riducendo la dipendenza dalle OTA.",
      },
    ],
    faqs: [
      {
        question: "Posso offrire una tariffa più bassa sul mio sito rispetto alle OTA?",
        answer:
          "Dipende dai contratti con le OTA, che spesso prevedono clausole di parità. Una strada sicura è mantenere la stessa tariffa pubblica ma aggiungere vantaggi esclusivi al canale diretto (servizi, flessibilità, codici riservati ai clienti registrati).",
      },
      {
        question: "Serve per forza un software costoso per le prenotazioni dirette?",
        answer:
          "No. Esistono booking engine adatti anche a piccole strutture. L'importante è che sia semplice, ottimizzato per mobile e integrato con il tuo gestionale per evitare overbooking.",
      },
      {
        question: "Quanto tempo serve per vedere risultati?",
        answer:
          "Le prime variazioni sulla quota diretta si vedono di solito in qualche mese. È un lavoro continuo: sito, tariffe, recensioni e fidelizzazione agiscono insieme nel tempo.",
      },
    ],
    related: [
      { title: "Strategie per le Prenotazioni Dirette", url: "/strategie-prenotazioni-dirette-hotel" },
      { title: "Guida alle Prenotazioni Dirette Hotel", url: "/guida-prenotazioni-dirette-hotel" },
      { title: "Ottimizzazione dei canali OTA", url: "/ottimizzazione-ota-hotel" },
    ],
  },
]

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1))
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAllPostSlugs(): string[] {
  return posts.map((p) => p.slug)
}
