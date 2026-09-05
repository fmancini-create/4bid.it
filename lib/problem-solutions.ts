// Fonte dati UNICA della mappa "problema della struttura -> soluzione 4BID".
// Usata da:
//  - components/problem-solution-finder.tsx (selettore interattivo, client)
//  - app/problemi-hotel-soluzioni/page.tsx (pagina dedicata: elenco statico
//    reso lato server, quindi leggibile dai motori di ricerca senza JS)
// Tenere qui i testi: duplicarli nella pagina significherebbe farli divergere.

export type SolutionKind = "piattaforma" | "consulenza" | "su-misura"

export type ProblemCategoryId =
  | "revenue-pricing"
  | "vendite-distribuzione"
  | "marketing-ospiti"
  | "controllo-finanza"
  | "operativita-staff"
  | "tecnologia-dati"

export type ProblemCategory = {
  id: ProblemCategoryId
  label: string
  shortLabel: string
  description: string
}

export type Solution = {
  id: string
  name: string
  kind: SolutionKind
  claim: string
  /** Pagina interna 4BID (link interno: conta per la SEO) */
  href: string
  /** Sito del prodotto, quando esiste (esterno) */
  externalUrl?: string
}

export type Problem = {
  id: string
  label: string
  /** Motivo mostrato nella scheda soluzione: "Risponde a: ..." */
  short: string
  category: ProblemCategoryId
  /** Sinonimi e ricerche frequenti usati dal motore del selettore. */
  keywords?: string[]
  /** id delle soluzioni che risolvono questo problema */
  solutions: string[]
}

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  {
    id: "revenue-pricing",
    label: "Revenue & Prezzi",
    shortLabel: "Revenue",
    description:
      "Prezzi, occupazione, pickup, forecast, domanda, competitor e regole di vendita: tutto ciò che decide quanto e quando vendere una camera.",
  },
  {
    id: "vendite-distribuzione",
    label: "Vendite & Distribuzione",
    shortLabel: "Vendite",
    description:
      "Prenotazioni dirette, OTA, CRM commerciale, preventivi, prospect e nuovi ricavi: come trasformare più richieste in fatturato.",
  },
  {
    id: "marketing-ospiti",
    label: "Marketing & Ospiti",
    shortLabel: "Marketing",
    description:
      "Sito, SEO, reputazione, email, social e comunicazioni con gli ospiti: farti trovare, scegliere e ricordare.",
  },
  {
    id: "controllo-finanza",
    label: "Controllo & Finanza",
    shortLabel: "Controllo",
    description:
      "Margini, cassa, budget, fatture, centri di costo, scadenze e bilancio: capire dove guadagni e dove perdi denaro.",
  },
  {
    id: "operativita-staff",
    label: "Operatività & Staff",
    shortLabel: "Operatività",
    description:
      "Manutenzioni, asset, fornitori, housekeeping, biancheria, minibar, turni e comunicazione interna: meno caos operativo ogni giorno.",
  },
  {
    id: "tecnologia-dati",
    label: "Tecnologia & Automazioni",
    shortLabel: "Tecnologia",
    description:
      "Software scollegati, PMS, dati duplicati, multi-struttura, accessi e processi su misura: far lavorare i sistemi al posto tuo.",
  },
]

export const KIND_LABEL: Record<SolutionKind, string> = {
  piattaforma: "Piattaforma",
  consulenza: "Consulenza",
  "su-misura": "Su misura",
}

export const KIND_STYLE: Record<SolutionKind, string> = {
  piattaforma: "bg-[#5B9BD5]/10 text-[#3A7AB2]",
  consulenza: "bg-[#F4B942]/15 text-[#946A00]",
  "su-misura": "bg-emerald-100 text-emerald-700",
}

export const SOLUTIONS: Solution[] = [
  {
    id: "santaddeo",
    name: "SANTADDEO",
    kind: "piattaforma",
    claim:
      "Revenue management intelligente per pricing, KPI, forecast e lettura della domanda, con raccomandazioni motivate giorno per giorno.",
    href: "/progetti/santaddeo",
    externalUrl: "https://santaddeo.com",
  },
  {
    id: "hotelprofit-ai",
    name: "HOTELPROFIT AI",
    kind: "piattaforma",
    claim:
      "Controllo di gestione per costi, margini, fatture, scadenze, centri di costo, budget e lettura economico-finanziaria della struttura.",
    href: "/progetti/hotelprofit-ai",
    externalUrl: "https://hotelprofitai.com",
  },
  {
    id: "hotel-accelerator",
    name: "HOTEL ACCELERATOR",
    kind: "piattaforma",
    claim:
      "CRM, sito, inbox omnicanale e strumenti commerciali in un unico ambiente per organizzare contatti, comunicazioni e vendite dirette.",
    href: "/progetti/hotel-accelerator",
    externalUrl: "https://www.hotelaccelerator.com",
  },
  {
    id: "manubot",
    name: "MANUBOT",
    kind: "piattaforma",
    claim:
      "Interventi, manutenzioni programmate, asset e QR, fornitori e housekeeping coordinati anche via WhatsApp e Telegram.",
    href: "/progetti/manubot",
    externalUrl: "https://www.manubot.it",
  },
  {
    id: "ecomobility",
    name: "4BID ECOMOBILITY",
    kind: "piattaforma",
    claim:
      "Noleggio di mobilità elettrica in struttura: un servizio in più per gli ospiti e una nuova fonte di ricavo.",
    href: "/ecomobility/noleggio-mobilita-elettrica-hotel",
  },
  {
    id: "consulenza-revenue",
    name: "Consulenza di revenue management",
    kind: "consulenza",
    claim:
      "Un revenue manager al tuo fianco per strategia tariffaria, distribuzione, forecast e obiettivi di fatturato.",
    href: "/consulenza-revenue-management-hotel",
  },
  {
    id: "distribuzione",
    name: "Ottimizzazione OTA e canali",
    kind: "consulenza",
    claim:
      "Riequilibriamo il mix distributivo per ridurre commissioni e dipendenza dai portali.",
    href: "/ottimizzazione-ota-hotel",
  },
  {
    id: "dirette",
    name: "Strategie di vendita diretta",
    kind: "consulenza",
    claim:
      "Booking engine, offerte e percorsi di prenotazione pensati per vendere dal tuo sito.",
    href: "/strategie-prenotazioni-dirette-hotel",
  },
  {
    id: "webmarketing",
    name: "Web marketing per hotel",
    kind: "consulenza",
    claim:
      "Immagine online, contenuti e campagne per farti trovare e scegliere prima dei concorrenti.",
    href: "/webmarketing-hotel-prenotazioni",
  },
  {
    id: "forecast",
    name: "Forecast e budgeting",
    kind: "consulenza",
    claim:
      "Costruiamo budget e previsioni affidabili per pianificare stagioni, prezzi, costi e investimenti.",
    href: "/forecast-budgeting-hotel",
  },
  {
    id: "formazione",
    name: "Formazione del tuo team",
    kind: "consulenza",
    claim:
      "Percorsi pratici di revenue management e organizzazione per rendere più autonomo il personale della struttura.",
    href: "/formazione-revenue-management-hotel",
  },
  {
    id: "consulenza-personalizzata",
    name: "Consulenza personalizzata",
    kind: "consulenza",
    claim:
      "Analizziamo la struttura e mettiamo in fila priorità commerciali, economiche e organizzative con un piano concreto.",
    href: "/consulenza-personalizzata-hotel",
  },
  {
    id: "catene",
    name: "Gestione multi-struttura",
    kind: "consulenza",
    claim:
      "Metodo e strumenti per governare più strutture o un gruppo con dati confrontabili e processi coerenti.",
    href: "/revenue-management-catene-hotel",
  },
  {
    id: "su-misura",
    name: "Progetto su misura",
    kind: "su-misura",
    claim:
      "Quando i software standard non bastano, sviluppiamo la soluzione che ti serve e la integriamo con i sistemi esistenti.",
    href: "/preventivi-progetti-personalizzati-hotel",
  },
]

export const PROBLEMS: Problem[] = [
  // Revenue & Prezzi
  {
    id: "prezzi",
    label: "Non so a che prezzo vendere le camere: decido ancora troppo a intuito",
    short: "prezzi decisi a intuito",
    category: "revenue-pricing",
    keywords: ["prezzo camera", "tariffe hotel", "dynamic pricing", "rms", "revenue management"],
    solutions: ["santaddeo", "consulenza-revenue"],
  },
  {
    id: "kpi",
    label: "Non riesco a leggere bene RevPAR, ADR, occupazione e gli altri KPI dell'hotel",
    short: "KPI revenue poco chiari",
    category: "revenue-pricing",
    keywords: ["revpar", "adr", "occupazione", "kpi hotel"],
    solutions: ["santaddeo", "hotelprofit-ai", "consulenza-revenue"],
  },
  {
    id: "pickup",
    label: "Non capisco se il pickup delle prenotazioni sta accelerando o rallentando",
    short: "pickup prenotazioni non monitorato",
    category: "revenue-pricing",
    keywords: ["pickup", "pace", "ritmo prenotazioni", "booking pace"],
    solutions: ["santaddeo", "consulenza-revenue"],
  },
  {
    id: "forecast-domanda",
    label: "Faccio fatica a prevedere occupazione e domanda delle prossime settimane o mesi",
    short: "forecast di domanda poco affidabile",
    category: "revenue-pricing",
    keywords: ["forecast hotel", "previsione occupazione", "domanda futura"],
    solutions: ["santaddeo", "forecast", "consulenza-revenue"],
  },
  {
    id: "competitor-rate",
    label: "Controllo i prezzi dei competitor a mano e non so quanto dovrebbero influenzare le mie tariffe",
    short: "prezzi competitor controllati a mano",
    category: "revenue-pricing",
    keywords: ["competitor", "benchmark", "comp set", "prezzi concorrenza"],
    solutions: ["santaddeo", "consulenza-revenue"],
  },
  {
    id: "regole-vendita",
    label: "Non so quando usare soggiorno minimo, stop sale o altre restrizioni di vendita",
    short: "restrizioni di vendita gestite senza metodo",
    category: "revenue-pricing",
    keywords: ["minlos", "minimum stay", "stop sale", "cta", "ctd", "restrizioni hotel"],
    solutions: ["santaddeo", "consulenza-revenue", "distribuzione"],
  },
  {
    id: "eventi-domanda",
    label: "Scopro troppo tardi eventi e picchi di domanda che potrebbero cambiare i prezzi",
    short: "eventi e picchi di domanda intercettati tardi",
    category: "revenue-pricing",
    keywords: ["eventi", "calendario domanda", "fiere", "concerti", "demand intelligence"],
    solutions: ["santaddeo", "consulenza-revenue"],
  },
  {
    id: "autopilot-prezzi",
    label: "Vorrei automatizzare le variazioni di prezzo senza perdere controllo sulle decisioni",
    short: "pricing da automatizzare con controllo",
    category: "revenue-pricing",
    keywords: ["autopilot", "prezzi automatici", "automazione revenue", "rms automatico"],
    solutions: ["santaddeo", "consulenza-revenue"],
  },

  // Vendite & Distribuzione
  {
    id: "ota",
    label: "Dipendo troppo da Booking, Expedia e dalle OTA e pago troppe commissioni",
    short: "troppa dipendenza dalle OTA",
    category: "vendite-distribuzione",
    keywords: ["booking", "expedia", "ota", "commissioni", "disintermediazione"],
    solutions: ["distribuzione", "hotel-accelerator", "consulenza-revenue"],
  },
  {
    id: "dirette",
    label: "Ricevo poche prenotazioni dirette dal mio sito",
    short: "poche prenotazioni dirette",
    category: "vendite-distribuzione",
    keywords: ["prenotazioni dirette", "direct booking", "booking engine", "sito hotel"],
    solutions: ["hotel-accelerator", "dirette", "webmarketing"],
  },
  {
    id: "conversione-preventivi",
    label: "Ricevo richieste e preventivi, ma troppe trattative non diventano prenotazioni",
    short: "preventivi che convertono poco",
    category: "vendite-distribuzione",
    keywords: ["preventivi hotel", "conversione richieste", "lead", "vendite hotel"],
    solutions: ["hotel-accelerator", "dirette", "consulenza-personalizzata"],
  },
  {
    id: "lead-followup",
    label: "Perdo lead e opportunità perché follow-up, richiami e prossime azioni non sono organizzati",
    short: "follow-up commerciali non organizzati",
    category: "vendite-distribuzione",
    keywords: ["follow up", "crm", "pipeline", "richiamare cliente", "opportunita"],
    solutions: ["hotel-accelerator", "consulenza-personalizzata"],
  },
  {
    id: "crm-contatti",
    label: "Contatti, aziende, agenzie e ospiti sono sparsi tra Excel, rubriche e software diversi",
    short: "contatti commerciali sparsi",
    category: "vendite-distribuzione",
    keywords: ["crm hotel", "contatti", "aziende", "agenzie", "guest crm"],
    solutions: ["hotel-accelerator", "su-misura"],
  },
  {
    id: "b2b-prospecting",
    label: "Vorrei trovare e organizzare nuovi prospect B2B, aziende e agenzie da contattare",
    short: "prospecting B2B da strutturare",
    category: "vendite-distribuzione",
    keywords: ["prospect", "b2b", "aziende", "agenzie", "scout", "lead generation"],
    solutions: ["hotel-accelerator", "consulenza-personalizzata"],
  },
  {
    id: "canali-distribuzione",
    label: "Non so quali canali di vendita mi rendono davvero e quali stanno solo spostando prenotazioni",
    short: "mix distributivo poco chiaro",
    category: "vendite-distribuzione",
    keywords: ["distribuzione hotel", "channel mix", "ota", "canale diretto"],
    solutions: ["distribuzione", "consulenza-revenue", "hotelprofit-ai"],
  },
  {
    id: "extra",
    label: "Vorrei offrire servizi extra agli ospiti e creare nuovi ricavi oltre alla camera",
    short: "nuovi ricavi dai servizi extra",
    category: "vendite-distribuzione",
    keywords: ["ancillary revenue", "upselling", "servizi extra", "noleggio", "ebike", "mobilita elettrica"],
    solutions: ["ecomobility", "consulenza-personalizzata"],
  },

  // Marketing & Ospiti
  {
    id: "richieste-ospiti",
    label: "Richieste degli ospiti sono sparse tra email, WhatsApp, Telegram, social e telefono",
    short: "richieste ospiti sparse su troppi canali",
    category: "marketing-ospiti",
    keywords: ["inbox omnicanale", "whatsapp hotel", "telegram", "messaggi ospiti", "email"],
    solutions: ["hotel-accelerator", "manubot"],
  },
  {
    id: "caselle-email",
    label: "Gestiamo più caselle email e facciamo fatica a capire cosa è stato letto, inviato o risolto",
    short: "più caselle email difficili da coordinare",
    category: "marketing-ospiti",
    keywords: ["gmail", "posta inviata", "inbox", "caselle email", "email hotel"],
    solutions: ["hotel-accelerator"],
  },
  {
    id: "risposte-ripetitive",
    label: "Il team perde troppo tempo a rispondere ogni giorno alle stesse domande degli ospiti",
    short: "troppe risposte ripetitive agli ospiti",
    category: "marketing-ospiti",
    keywords: ["risposte automatiche", "ai", "faq", "assistenza ospiti", "chat hotel"],
    solutions: ["hotel-accelerator", "consulenza-personalizzata"],
  },
  {
    id: "reputazione",
    label: "Recensioni e reputazione online non sono monitorate o valorizzate abbastanza",
    short: "reputazione online da migliorare",
    category: "marketing-ospiti",
    keywords: ["recensioni hotel", "reputazione", "google reviews", "tripadvisor"],
    solutions: ["hotel-accelerator", "webmarketing"],
  },
  {
    id: "immagine",
    label: "Sito e immagine online sono datati rispetto ai concorrenti",
    short: "immagine online datata",
    category: "marketing-ospiti",
    keywords: ["sito hotel", "restyling", "website", "immagine online"],
    solutions: ["webmarketing", "hotel-accelerator"],
  },
  {
    id: "seo-visibilita",
    label: "Il mio hotel si trova poco su Google per le ricerche che fanno davvero i potenziali ospiti",
    short: "visibilità organica su Google insufficiente",
    category: "marketing-ospiti",
    keywords: ["seo hotel", "google", "posizionamento", "visibilita sito"],
    solutions: ["webmarketing", "hotel-accelerator"],
  },
  {
    id: "email-marketing",
    label: "Ho tanti contatti ma non li uso bene per campagne, ritorni e prenotazioni future",
    short: "database ospiti poco sfruttato",
    category: "marketing-ospiti",
    keywords: ["email marketing", "newsletter", "crm", "database ospiti", "retention"],
    solutions: ["hotel-accelerator", "webmarketing"],
  },
  {
    id: "social-marketing",
    label: "Pubblicare e seguire i canali social richiede troppo tempo e manca una strategia coerente",
    short: "social gestiti senza strategia coerente",
    category: "marketing-ospiti",
    keywords: ["instagram hotel", "facebook hotel", "social media", "contenuti"],
    solutions: ["webmarketing", "hotel-accelerator"],
  },

  // Controllo & Finanza
  {
    id: "margini",
    label: "Fatturo ma non so quanto guadagno davvero: costi e margini sono poco chiari",
    short: "margini non chiari",
    category: "controllo-finanza",
    keywords: ["margine hotel", "profitto", "controllo gestione", "redditivita"],
    solutions: ["hotelprofit-ai", "consulenza-personalizzata"],
  },
  {
    id: "cassa",
    label: "Non ho una visione chiara di cassa, incassi e pagamenti futuri",
    short: "cassa e pagamenti senza visibilità",
    category: "controllo-finanza",
    keywords: ["cash flow", "cassa", "incassi", "pagamenti", "tesoreria"],
    solutions: ["hotelprofit-ai", "forecast"],
  },
  {
    id: "budget",
    label: "Non riesco a pianificare l'anno: budget e previsioni economiche restano approssimativi",
    short: "budget economico approssimativo",
    category: "controllo-finanza",
    keywords: ["budget hotel", "forecast economico", "previsioni", "budgeting"],
    solutions: ["forecast", "hotelprofit-ai"],
  },
  {
    id: "fatture-import",
    label: "Perdo tempo a importare e controllare fatture attive e passive da sistemi diversi",
    short: "fatture importate e controllate a mano",
    category: "controllo-finanza",
    keywords: ["fatture", "fatture in cloud", "documenti passivi", "documenti attivi", "contabilita"],
    solutions: ["hotelprofit-ai", "su-misura"],
  },
  {
    id: "classificazione-spese",
    label: "Classifico spese e fatture a mano e rischio categorie incoerenti tra un mese e l'altro",
    short: "classificazione spese manuale",
    category: "controllo-finanza",
    keywords: ["classificazione fatture", "categorizzazione", "fornitori", "spese"],
    solutions: ["hotelprofit-ai"],
  },
  {
    id: "centri-costo",
    label: "Non so con precisione quanto costa e quanto rende ogni reparto o centro di costo",
    short: "redditività per reparto non misurata",
    category: "controllo-finanza",
    keywords: ["centri di costo", "reparti", "spa", "ristorante", "housekeeping", "contabilita analitica"],
    solutions: ["hotelprofit-ai", "consulenza-personalizzata"],
  },
  {
    id: "scadenziario",
    label: "Scadenze fornitori e pagamenti da fare sono sparse tra agenda, email e fogli Excel",
    short: "scadenziario fornitori frammentato",
    category: "controllo-finanza",
    keywords: ["scadenziario", "fornitori", "pagamenti", "debiti", "scadenze"],
    solutions: ["hotelprofit-ai"],
  },
  {
    id: "bilancio-piano-conti",
    label: "Bilancio, piano dei conti e dati gestionali non parlano la stessa lingua",
    short: "bilancio e gestione non riconciliati",
    category: "controllo-finanza",
    keywords: ["bilancio", "piano dei conti", "conti", "pdf bilancio", "mapping contabile"],
    solutions: ["hotelprofit-ai", "consulenza-personalizzata"],
  },
  {
    id: "acquisti",
    label: "Non riesco a individuare subito acquisti e costi che stanno andando fuori controllo",
    short: "acquisti e costi anomali poco visibili",
    category: "controllo-finanza",
    keywords: ["acquisti", "costi", "fornitori", "spese anomale", "controllo costi"],
    solutions: ["hotelprofit-ai", "consulenza-personalizzata"],
  },

  // Operatività & Staff
  {
    id: "manutenzioni",
    label: "Guasti e manutenzioni vengono segnalati a voce e alcune richieste si perdono",
    short: "manutenzioni gestite a voce",
    category: "operativita-staff",
    keywords: ["manutenzione hotel", "guasti", "ticket", "interventi", "manutentore"],
    solutions: ["manubot"],
  },
  {
    id: "manutenzione-programmata",
    label: "Le manutenzioni preventive e programmate dipendono ancora dalla memoria delle persone",
    short: "manutenzione preventiva non strutturata",
    category: "operativita-staff",
    keywords: ["manutenzione preventiva", "manutenzione programmata", "scadenze tecniche", "cmms"],
    solutions: ["manubot"],
  },
  {
    id: "asset-qr",
    label: "Non ho uno storico semplice di impianti e attrezzature, né un QR per aprire subito la loro scheda",
    short: "asset e storico manutenzioni non tracciati",
    category: "operativita-staff",
    keywords: ["asset", "qr code", "impianti", "attrezzature", "storico manutenzione"],
    solutions: ["manubot"],
  },
  {
    id: "fornitori-preventivi",
    label: "Coordinare fornitori, richieste di intervento e preventivi tecnici richiede troppe telefonate",
    short: "fornitori e preventivi tecnici difficili da coordinare",
    category: "operativita-staff",
    keywords: ["fornitori manutenzione", "preventivi", "tecnici", "quote"],
    solutions: ["manubot", "consulenza-personalizzata"],
  },
  {
    id: "compliance",
    label: "Scadenze, controlli e adempimenti tecnici rischiano di essere gestiti in modo disordinato",
    short: "compliance e scadenze tecniche da organizzare",
    category: "operativita-staff",
    keywords: ["compliance", "adempimenti", "controlli periodici", "scadenze manutenzione"],
    solutions: ["manubot", "consulenza-personalizzata"],
  },
  {
    id: "housekeeping",
    label: "Housekeeping, camere da controllare e attività della governante sono difficili da coordinare in tempo reale",
    short: "housekeeping difficile da coordinare",
    category: "operativita-staff",
    keywords: ["housekeeping", "governante", "camere", "pulizie hotel", "room check"],
    solutions: ["manubot"],
  },
  {
    id: "biancheria",
    label: "Consumi, consegne, scarti e giacenze di biancheria non sono sotto controllo",
    short: "biancheria e lavanderia poco controllate",
    category: "operativita-staff",
    keywords: ["biancheria", "lavanderia", "linen", "consegne", "scarti"],
    solutions: ["manubot", "hotelprofit-ai"],
  },
  {
    id: "minibar-roomcheck",
    label: "Controlli camera e minibar vengono annotati a mano e i dati arrivano tardi",
    short: "room check e minibar gestiti a mano",
    category: "operativita-staff",
    keywords: ["minibar", "room check", "controllo camera", "housekeeping"],
    solutions: ["manubot"],
  },
  {
    id: "staff-comunicazione",
    label: "La comunicazione con lo staff è caotica: non è chiaro chi deve fare cosa e entro quando",
    short: "comunicazione con lo staff caotica",
    category: "operativita-staff",
    keywords: ["staff", "task", "whatsapp", "telegram", "assegnazioni"],
    solutions: ["manubot", "hotel-accelerator"],
  },
  {
    id: "turni-presenze",
    label: "Turni, presenze, assenze e timbrature del personale richiedono troppi passaggi manuali",
    short: "turni e presenze troppo manuali",
    category: "operativita-staff",
    keywords: ["hr hotel", "turni", "presenze", "timbrature", "assenze", "geofence"],
    solutions: ["hotel-accelerator", "consulenza-personalizzata"],
  },
  {
    id: "personale",
    label: "Faccio fatica a organizzare, trovare e trattenere personale qualificato",
    short: "organizzazione e reperimento del personale difficili",
    category: "operativita-staff",
    keywords: ["personale hotel", "staff", "organizzazione", "recruiting"],
    solutions: ["consulenza-personalizzata"],
  },
  {
    id: "formazione",
    label: "Il mio team non è abbastanza autonomo su revenue, dati e processi operativi",
    short: "team da rendere più autonomo",
    category: "operativita-staff",
    keywords: ["formazione hotel", "training", "revenue", "staff"],
    solutions: ["formazione", "consulenza-revenue", "consulenza-personalizzata"],
  },

  // Tecnologia & Automazioni
  {
    id: "strumenti",
    label: "Uso troppi strumenti scollegati e ricopio gli stessi dati più volte",
    short: "strumenti scollegati e dati duplicati",
    category: "tecnologia-dati",
    keywords: ["integrazioni", "software hotel", "dati duplicati", "excel", "api"],
    solutions: ["hotel-accelerator", "su-misura"],
  },
  {
    id: "multi",
    label: "Gestisco più strutture e non riesco a confrontare dati, performance e processi con lo stesso metodo",
    short: "più strutture difficili da confrontare",
    category: "tecnologia-dati",
    keywords: ["multi hotel", "catena", "gruppo alberghiero", "multi property"],
    solutions: ["catene", "hotelprofit-ai", "santaddeo", "hotel-accelerator"],
  },
  {
    id: "pms-accesso",
    label: "Passo continuamente dal gestionale PMS agli altri strumenti e perdo tempo tra finestre e accessi",
    short: "PMS e strumenti separati rallentano il lavoro",
    category: "tecnologia-dati",
    keywords: ["pms", "gestionale hotel", "integrazione pms", "single workspace"],
    solutions: ["hotel-accelerator", "su-misura"],
  },
  {
    id: "dati-manuali",
    label: "Import, export e aggiornamenti manuali rendono i dati vecchi proprio quando devo decidere",
    short: "dati aggiornati troppo manualmente",
    category: "tecnologia-dati",
    keywords: ["sync", "sincronizzazione", "api", "import export", "automazione dati"],
    solutions: ["su-misura", "hotel-accelerator", "hotelprofit-ai", "santaddeo"],
  },
  {
    id: "dashboard-unica",
    label: "Per capire come sta andando l'hotel devo aprire troppe dashboard e ricostruire il quadro a mano",
    short: "troppe dashboard separate",
    category: "tecnologia-dati",
    keywords: ["dashboard hotel", "kpi", "dati", "controllo", "report"],
    solutions: ["hotel-accelerator", "hotelprofit-ai", "santaddeo", "su-misura"],
  },
  {
    id: "suite-login",
    label: "Vorrei che i diversi software della struttura condividessero utenti e accessi senza account duplicati",
    short: "utenti e accessi duplicati tra software",
    category: "tecnologia-dati",
    keywords: ["sso", "single sign on", "utenti", "login", "suite"],
    solutions: ["hotel-accelerator", "su-misura"],
  },
  {
    id: "integrazioni",
    label: "Ho già software che funzionano, ma non comunicano tra loro come servirebbe al mio processo",
    short: "integrazioni tra software mancanti",
    category: "tecnologia-dati",
    keywords: ["api", "integrazione", "pms", "crm", "contabilita", "webhook"],
    solutions: ["su-misura", "hotel-accelerator"],
  },
  {
    id: "software-standard",
    label: "I software standard non coprono il mio caso: mi serve qualcosa costruito sul mio processo",
    short: "serve una soluzione dedicata",
    category: "tecnologia-dati",
    keywords: ["software su misura", "sviluppo", "saas", "app personalizzata"],
    solutions: ["su-misura", "consulenza-personalizzata"],
  },
  {
    id: "report-condivisione",
    label: "Vorrei report chiari e condivisibili senza ricostruire ogni volta numeri e tabelle a mano",
    short: "report gestionali da ricostruire a mano",
    category: "tecnologia-dati",
    keywords: ["report hotel", "stampa", "pdf", "dashboard", "condivisione dati"],
    solutions: ["hotelprofit-ai", "santaddeo", "su-misura"],
  },
]

/** Soluzioni che risolvono un problema, nell'ordine stabile di SOLUTIONS. */
export function getSolutionsForProblem(problem: Problem): Solution[] {
  return SOLUTIONS.filter((s) => problem.solutions.includes(s.id))
}

/** Problemi risolti da una soluzione, nell'ordine stabile di PROBLEMS. */
export function getProblemsForSolution(solutionId: string): Problem[] {
  return PROBLEMS.filter((p) => p.solutions.includes(solutionId))
}

/** Problemi di una macro-area, nell'ordine editoriale di PROBLEMS. */
export function getProblemsForCategory(categoryId: ProblemCategoryId): Problem[] {
  return PROBLEMS.filter((p) => p.category === categoryId)
}
