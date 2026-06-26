# Audit SEO + GEO + Schema.org + Knowledge Graph + EEAT — 4BID.IT

> Documento di sola analisi. Nessun file di codice, route, layout, design o
> database e' stato modificato. Tutte le raccomandazioni sono in attesa di
> approvazione prima di qualsiasi intervento.
>
> Dominio analizzato: `https://www.4bid.it` · Stack: Next.js App Router · Lingua: IT
> Data audit: 26/06/2026

---

## 1. STATO ATTUALE

### 1.1 SEO Tecnica — cosa c'e' gia' (buono)

| Area | Stato | Dettaglio |
|---|---|---|
| `robots.txt` | OK | `app/robots.ts` dinamico: allow `/`, disallow `/admin/`, `/api/`, asset `_next`; regola dedicata Googlebot; `host` e `sitemap` dichiarati. Esiste anche `public/robots.txt` statico (potenziale doppione — vedi problemi). |
| `sitemap.xml` | OK | `app/sitemap.ts` genera ~75 URL: homepage, blog index + post dinamici, 3 guide, ~31 landing, 7 progetti, 4 ecomobility, hub soluzioni, eventi, volantini, legal. |
| Canonical | OK | `metadataBase` impostato; canonical presente sia nel root layout sia nelle singole landing e nei blog post (`alternates.canonical`). |
| Meta robots | OK | `index/follow` + direttive `googleBot` (`max-image-preview:large`, `max-snippet:-1`, `max-video-preview:-1`). |
| Metadata per pagina | OK | ~60 pagine pubbliche con `export const metadata` (title/description/keywords/canonical/OG dedicati). |
| Open Graph (base) | PARZIALE | OG `title/description/type/locale/siteName/url` presenti a livello globale e per-pagina. **Manca `og:image`.** |
| Heading | OK (campione) | Le pagine hanno un solo `<h1>`, gerarchia `h2/h3` coerente (verificato su blog post e landing). |
| URL / slug | OK | Slug descrittivi, keyword-rich, in italiano, senza parametri sporchi. |
| Immagini | OK | ~18 pagine usano `next/image` (lazy/responsive nativi); solo 2 `<img>` raw, entrambe con `alt`. |
| ALT testuali | OK (campione) | Nessuna `<img>` priva di `alt` rilevata; icone decorative con `aria-hidden`. |
| Analytics/Tag | OK | GTM + GA4 + Yandex Metrika (con consenso cookie), iniettati solo in produzione. |
| Static rendering | OK | Blog `force-static` + `generateStaticParams` → ottimo per crawling e CWV. |

### 1.2 Dati strutturati (Schema.org) — cosa c'e' gia'

Componente centrale: `components/seo-structured-data.tsx` (`StructuredData` + `PageSEO`),
usato in ~53 pagine pubbliche. Emette sempre, in ogni pagina che lo include:

- `Organization` (completo: nome, P.IVA `IT06241710489`, indirizzo San Casciano in Val di Pesa, `foundingDate`, `sameAs` LinkedIn/Facebook/Instagram, `areaServed` Italia, `contactPoint`)
- `WebSite`
- Schema principale variabile per `type`: `Service` (default), `Article`, `WebPage`, `SoftwareApplication`, `Product`, `LocalBusiness`, `FAQPage`
- `BreadcrumbList` (quando passati i breadcrumb)
- `FAQPage` (quando passate le FAQ — presente su blog e diverse landing)

Tipi effettivamente generati: `Organization`, `WebSite`, `Service`, `WebPage`,
`Article`, `SoftwareApplication`, `Offer`, `Brand`, `ItemList`, `BreadcrumbList`,
`FAQPage`, `Question`/`Answer`, `ContactPoint`, `PostalAddress`, `ImageObject`, `Country`.

### 1.3 GEO / EEAT — sintesi

Il sito e' gia' molto "AI-friendly" per la base tecnica: HTML statico, contenuti
testuali ricchi, FAQ strutturate, entita' Organization solida e coerente, blog
con articoli evergreen e risorse correlate (internal linking semantico). Questo
lo rende gia' citabile da motori generativi. Mancano pero' i segnali di
**autorevolezza personale** (autori/esperti), le **prove sociali strutturate**
(recensioni/rating) e alcuni schemi che i motori generativi premiano (HowTo,
Person, ProfessionalService).

---

## 2. PROBLEMI TROVATI

### 2.1 SEO Tecnica

1. **`og:image` assente a livello globale e per-pagina.** Nel root layout
   `openGraph` non ha `images`; le landing non definiscono un'immagine OG. Le
   condivisioni social e molte preview AI mostrano un box senza immagine. Lo
   schema usa solo il logo come `ImageObject`.
2. **Twitter Card assente.** Nessun blocco `twitter` (`card`, `title`,
   `image`, `site`) nel metadata. Su X/Twitter e su alcuni aggregatori la card
   non e' ricca.
3. **Doppio robots (potenziale conflitto).** Coesistono `app/robots.ts`
   (dinamico) e `public/robots.txt` (statico). In Next App Router il file
   statico in `public/` puo' avere precedenza sulla route generata, rendendo
   ambiguo quale venga servito. Va tenuto un solo robots come fonte di verita'.
4. **Sitemap statica e parzialmente hardcoded.** L'elenco landing/progetti e'
   scritto a mano in `app/sitemap.ts`: a ogni nuova pagina creata c'e' il
   rischio di dimenticarla in sitemap (gia' oggi pagine utility come
   `sfondo-call` sono — correttamente — escluse, ma il processo e' manuale e
   fragile). Inoltre `lastModified` e' `new Date()` (sempre "oggi") per le
   pagine statiche → segnale di freschezza non veritiero.
5. **Nessuna sitemap immagini / video / hreflang.** Assenti (l'hreflang non
   serve: sito monolingua IT; le sitemap immagini/video sono un nice-to-have).
6. **Core Web Vitals non misurati in questo audit** (richiede ambiente di
   produzione). Da verificare LCP della hero, peso immagini e third-party
   scripts (GTM+GA+Yandex+chat AI) che possono incidere su INP/TBT.

### 2.2 Schema.org / GEO

7. **`Person` / founder assente.** L'`Organization` non dichiara `founder`
   ne' figure di riferimento. Forte impatto su EEAT (Expertise/Experience) e
   su Knowledge Graph (entita' persone collegate al brand).
8. **`Review` e `AggregateRating` assenti.** Esiste una pagina "Parlano di
   noi" ma le testimonianze/citazioni non sono modellate come schema → niente
   rich result "stelle" ne' segnale di reputazione per le AI.
9. **`HowTo` assente** nonostante le pagine "guida-*" (guida revenue
   management, guida pricing, guida prenotazioni dirette) siano contenuti
   procedurali ideali per HowTo + per le risposte step-by-step delle AI.
10. **`ProfessionalService` / `LocalBusiness` non attivati** per l'attivita' di
    consulenza (il tipo `LocalBusiness` esiste nel componente ma non risulta
    usato come pagina business locale con `geo`, `openingHours`, `priceRange`).
11. **`SoftwareApplication` senza `AggregateRating` ne' `Review`** sulle
    pagine prodotto (Santaddeo, Manubot, ecc.): le AI non hanno segnale di
    popolarita'/valutazione del software.
12. **Nessuno `@id` / grafo collegato.** Gli schemi sono emessi come blocchi
    JSON-LD indipendenti senza `@id` condivisi che leghino esplicitamente
    `Organization` ⇄ `WebSite` ⇄ `WebPage` ⇄ `Product`. Un grafo `@graph` con
    `@id` rende l'interpretazione delle entita' molto piu' robusta per Google
    Knowledge Graph e per i motori generativi.
13. **`SearchAction` (sitelinks searchbox) assente** nello schema `WebSite`.
14. **`Speakable` assente** (opzionale, utile per voice/AI).

### 2.3 EEAT

- **Experience**: nessun case study/risultati attribuiti a persone reali;
  testimonianze non strutturate.
- **Expertise**: nessun autore con bio/credenziali sugli articoli del blog
  (gli `Article` hanno `author` = Organization, non `Person`).
- **Authoritativeness**: `sameAs` social presente (bene), ma manca il
  collegamento a profili autore, menzioni stampa strutturate, e
  `AggregateRating`.
- **Trustworthiness**: P.IVA, indirizzo, contatti e pagine legali
  (privacy/terms) presenti (bene). Manca pagina/ं schema autore e recensioni
  verificabili.

---

## 3. PRIORITA'

### PRIORITA' ALTA (massimo impatto, basso rischio)

- A1. Aggiungere `og:image` (default globale + override per pagine chiave) usando
  asset reali esistenti in `public/` (es. `4bid-colorful-logo.jpg`,
  `logo-santaddeo.png`). *Nessuna immagine inventata.*
- A2. Aggiungere `twitter` card (summary_large_image) nel metadata.
- A3. Consolidare il robots: scegliere SOLO `app/robots.ts` ed eliminare il
  doppione `public/robots.txt` (o viceversa) per evitare ambiguita'.
- A4. Introdurre `Person` (founder/team) nell'`Organization` e collegare gli
  `Article` a un `author` di tipo `Person` con bio. (EEAT)
- A5. Aggiungere `AggregateRating` + `Review` (basati su testimonianze REALI e
  verificabili della pagina "Parlano di noi"); **nessun dato inventato.**

### PRIORITA' MEDIA

- M1. Migrare i blocchi JSON-LD a un unico `@graph` con `@id` condivisi
  (Organization ⇄ WebSite ⇄ WebPage ⇄ Product/Service).
- M2. Aggiungere `HowTo` alle pagine guida (`guida-*`).
- M3. `SearchAction`/sitelinks searchbox nello schema `WebSite`.
- M4. Attivare `ProfessionalService`/`LocalBusiness` con `geo`,
  `openingHours`, `priceRange` per la sede di San Casciano.
- M5. Rendere la sitemap piu' robusta: generazione (semi)automatica delle route
  statiche e `lastModified` realistico (data di build/aggiornamento contenuto).
- M6. `SoftwareApplication` delle pagine prodotto con `AggregateRating`/`Review`
  reali.

### PRIORITA' BASSA

- B1. Sitemap immagini e video.
- B2. `Speakable` sulle FAQ/answer.
- B3. Audit Core Web Vitals in produzione e ottimizzazione third-party scripts.
- B4. Pulizia hreflang nelle pagine ecomobility (sito monolingua: rimuovere o
  formalizzare se in futuro multilingua).

---

## 4. FILE CHE DOVRANNO ESSERE MODIFICATI (proposta — NON ancora toccati)

| Intervento | File previsti |
|---|---|
| A1 OG image globale | `app/layout.tsx` (metadata.openGraph.images) |
| A1 OG image per pagina | landing in `app/*/page.tsx`, `app/blog/[slug]/page.tsx` (generateMetadata) |
| A2 Twitter Card | `app/layout.tsx` + pagine chiave |
| A3 Robots unico | rimozione `public/robots.txt` **oppure** `app/robots.ts` (da decidere insieme) |
| A4 Person/founder + author | `components/seo-structured-data.tsx`, `lib/blog/posts.ts` (campo author), `app/blog/[slug]/page.tsx` |
| A5 Review/AggregateRating | `components/seo-structured-data.tsx`, `app/parlano-di-noi/page.tsx` |
| M1 `@graph` con `@id` | `components/seo-structured-data.tsx` |
| M2 HowTo | `app/guida-*/page.tsx`, `components/seo-structured-data.tsx` (nuovo tipo) |
| M3 SearchAction | `components/seo-structured-data.tsx` |
| M4 ProfessionalService | `components/seo-structured-data.tsx`, homepage |
| M5 Sitemap robusta | `app/sitemap.ts` |
| M6 Software rating | `app/progetti/*/page.tsx`, `components/seo-structured-data.tsx` |
| B1 Sitemap immagini/video | nuova route `app/sitemap-images.xml` (o estensione) |

> Nota: il componente `components/seo-structured-data.tsx` e' il punto di leva
> principale — molte migliorie si concentrano li' e si propagano a tutte le
> pagine che gia' lo usano.

---

## 5. BENEFICI ATTESI

- **Condivisioni social/AI con anteprima ricca** (A1/A2): maggiore CTR da
  social, Slack, WhatsApp, X e migliori "card" nelle risposte AI.
- **Rich result Google** (A5/M2/M6): stelle recensioni, HowTo e FAQ in SERP →
  piu' spazio e CTR.
- **Knowledge Graph piu' forte** (A4/M1): entita' brand + persone collegate,
  interpretazione piu' affidabile da Google e dai motori generativi → maggiore
  probabilita' di essere **citati come fonte** da ChatGPT/Gemini/Perplexity.
- **EEAT** (A4/A5/M4): segnali di esperienza, competenza, autorevolezza e
  affidabilita' piu' espliciti → ranking e fiducia.
- **Manutenibilita' SEO** (M5): meno rischio di pagine fuori sitemap o segnali
  di freschezza falsati.

---

## 6. RISCHI

- **JSON-LD non conforme** se mal strutturato → warning in Search Console /
  Rich Results Test. Mitigazione: validare ogni schema dopo la modifica.
- **`@graph` refactor** (M1): tocca un componente usato in ~53 pagine → rischio
  di regressione diffusa. Mitigazione: modifica incrementale + test su poche
  pagine prima del rollout.
- **Review/AggregateRating con dati non reali** → violazione linee guida Google
  (penalizzazione) e contrario alla regola interna "dati certi, mai inventati".
  Mitigazione: usare SOLO testimonianze reali e verificabili.
- **Rimozione robots sbagliata** (A3) → rischio di deindicizzazione se si
  elimina/erra la regola attiva. Mitigazione: confermare quale dei due file
  viene effettivamente servito in produzione prima di rimuovere l'altro.
- **OG image**: usare esclusivamente asset reali in `public/` (regola di
  progetto: nessuna immagine/logo inventato per i brand).

---

## 7. PIANO DI IMPLEMENTAZIONE (in ordine di priorita')

**Fase 1 — Quick win social/AI + robots (ALTA)**
1. A3: verificare in produzione quale robots e' servito → consolidare su uno solo.
2. A1: `og:image` default nel root layout (asset reale) + override su homepage,
   pagine prodotto e blog.
3. A2: Twitter Card `summary_large_image`.

**Fase 2 — EEAT e prove sociali (ALTA)**
4. A4: aggiungere `founder`/`Person` all'Organization; campo `author` (Person)
   nei post del blog e nello schema `Article`.
5. A5: modellare `Review` + `AggregateRating` dalle testimonianze REALI della
   pagina "Parlano di noi".

**Fase 3 — Grafo entita' e schemi avanzati (MEDIA)**
6. M1: refactor a `@graph` con `@id` condivisi (incrementale, con validazione).
7. M2: `HowTo` sulle guide. M3: `SearchAction`. M4: `ProfessionalService`.
   M6: rating software sulle pagine progetto.

**Fase 4 — Robustezza e rifiniture (MEDIA/BASSA)**
8. M5: sitemap (semi)automatica + `lastModified` reale.
9. B1 sitemap immagini/video, B2 Speakable, B3 audit CWV in produzione, B4
   pulizia hreflang ecomobility.

**Validazione trasversale (ad ogni fase):** Google Rich Results Test +
Search Console (Miglioramenti) + Schema Markup Validator; controllo preview OG
con un debugger social.

---

## 8. AI READINESS — PUNTEGGI (0–100)

| Area | Punteggio | Note sintetiche |
|---|---:|---|
| Google SEO (tecnica) | **82** | Base solida: robots, sitemap, canonical, metadata, HTML statico. Penalizzano OG image e doppio robots. |
| Google AI Overview | **74** | Buoni contenuti + FAQ; mancano HowTo, autori e rating per maggiore citabilita'. |
| ChatGPT (search) | **72** | HTML statico e testo ricco aiutano; manca autorevolezza personale e prove sociali. |
| Gemini | **73** | Entita' Organization forte; beneficerebbe del grafo `@id` e di Person. |
| Claude | **71** | Contenuto leggibile e strutturato; pochi segnali di autorevolezza. |
| Perplexity | **75** | Citabilita' discreta grazie a FAQ e blog evergreen; mancano fonti/autori espliciti. |
| Copilot | **70** | Dipende da Bing: OG/Twitter + schemi avanzati darebbero spinta. |
| Knowledge Graph | **66** | Organization completa e `sameAs` presenti; mancano founder/Person e `@id` collegati. |
| Entity SEO | **68** | Entita' brand chiara; relazioni fra entita' (persone, prodotti, recensioni) da rafforzare. |
| Schema.org | **70** | Buona copertura base (Org, Service, FAQ, Breadcrumb, Software); mancano Person, Review, AggregateRating, HowTo, grafo `@id`. |
| EEAT | **60** | Trust ok (P.IVA, indirizzo, legal); Experience/Expertise/Authority deboli senza autori e recensioni. |

**Media complessiva AI Readiness: ~71/100** — base tecnica matura, il margine
di crescita maggiore e' su EEAT, entita'/grafo e schemi avanzati (HowTo,
Review, Person).

---

> FINE AUDIT. In attesa di approvazione: nessuna modifica verra' effettuata
> finche' non indicherai quali interventi (per fase o per singolo punto)
> autorizzi.
