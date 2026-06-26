# SEO / GEO / Schema.org / EEAT — Audit completo

**Progetto:** 4bid.it (branch `4bid`)
**Data audit:** 26/06/2026
**Tipo analisi:** Sola lettura — nessun file è stato modificato, nessun codice/route/DB/layout/design è stato toccato.
**Team simulato:** Senior Technical SEO · GEO Specialist · Google Search Quality Engineer · AI Search Engineer · Schema.org Specialist · EEAT Specialist

> **AVVISO IMPORTANTE (lettura onesta dello stato reale).**
> Il branch clonato in questo workspace **non contiene il sito 4bid.it di produzione**.
> Contiene esclusivamente lo **scaffold di default di v0**:
> - `app/layout.tsx` con metadata generici (`title: "v0 App"`, `description: "Created with v0"`)
> - `app/page.tsx` con il placeholder "Your v0 generation will show here."
> - `app/globals.css`, `components/ui/button.tsx`, `lib/utils.ts`
> - `public/` con solo icone e immagini placeholder (`placeholder-logo`, `placeholder-user`, ecc.)
> - **Nessuna** route reale, **nessun** contenuto, **nessun** `robots.txt`, **nessuna** sitemap, **nessun** JSON-LD.
>
> Di conseguenza l'audit valuta lo stato **così com'è nel repository**. I punteggi sono bassi non perché 4bid.it "online" sia scarso, ma perché in questo codebase il sito è di fatto vuoto. Se il sito reale vive su un altro branch/progetto, va clonato qui per un audit fedele. Quanto segue vale come **baseline + piano di costruzione** SEO/GEO partendo da zero.

---

## 1. Stato attuale

### 1.1 SEO Tecnica

| Elemento | Stato | Note |
|---|---|---|
| `robots.txt` | ❌ Assente | Nessun `app/robots.ts` né `public/robots.txt`. |
| `sitemap.xml` | ❌ Assente | Nessun `app/sitemap.ts`. |
| Sitemap immagini | ❌ Assente | — |
| Sitemap video | ❌ Assente | — |
| Sitemap / hreflang | ❌ Assente | Nessuna gestione multilingua. `<html lang="en">` mentre il brand è IT. |
| Canonical | ❌ Assente | Nessun `alternates.canonical`, nessun `metadataBase`. |
| Meta robots | ❌ Assente | Nessuna direttiva index/follow esplicita. |
| `noindex` | ⚠️ N/D | Non impostato (default = indicizzabile, ma senza contenuto). |
| Redirect | ❌ Nessuno | Nessuna regola in `next.config.mjs` (host canonico www vs non-www non gestito). |
| Status code | ⚠️ | Solo `/` (200) + 404 di default. Nessuna pagina reale. |
| Breadcrumb | ❌ Assente | Nessun componente né markup. |
| Heading H1–H6 | ❌ Assente | La home non ha `<h1>`. Solo un `<p>` placeholder. |
| Struttura heading | ❌ Assente | Gerarchia inesistente. |
| URL / slug | ⚠️ | Esiste solo `/`. Nessuna struttura informativa. |
| Link interni | ❌ Assenti | Nessun link, nessuna navigazione. |
| Anchor text | ❌ N/D | — |
| Pagine orfane | ⚠️ N/D | Non applicabile (sito a pagina unica vuota). |
| Thin content | ❌ Critico | La home è di fatto un placeholder: zero contenuto testuale utile. |
| Duplicazioni | ✅ Nessuna | Non c'è abbastanza contenuto per duplicare. |
| Core Web Vitals | ⚠️ | Pagina leggerissima ma vuota: metriche irrilevanti finché non c'è contenuto reale. |
| Lazy loading | ❌ N/D | Nessuna immagine di contenuto. |
| Preload | ❌ Assente | Nessun preload di font/hero critici (i font Google sono gestiti da `next/font`, ok di base). |
| Cache | ⚠️ Default | Nessuna strategia esplicita (`cacheLife`, headers). |
| Compressione | ✅ Default Vercel | Brotli/gzip gestiti da piattaforma. |
| Immagini | ❌ | `images.unoptimized: true` in `next.config.mjs` → ottimizzazione Next disattivata. Solo placeholder. |
| ALT | ❌ N/D | L'unico SVG è `aria-hidden`. Nessuna immagine di contenuto con alt. |
| Open Graph | ❌ Assente | Nessun `openGraph` nei metadata, nessuna `og:image`. |
| Twitter Cards | ❌ Assente | Nessun `twitter` card. |

### 1.2 GEO (Generative Engine Optimization)

Capacità del sito di essere usato come **fonte citabile** da ChatGPT, Gemini, Claude, Perplexity, Google AI Overview, Copilot.

| Fattore | Stato |
|---|---|
| Chiarezza semantica | ❌ Nessun contenuto da interpretare. |
| Leggibilità AI | ❌ Nessun testo strutturato. |
| Entity SEO | ❌ Entità "4bid" non definita da nessuna parte (né title, né schema, né testo). |
| Knowledge Graph readiness | ❌ Nessun segnale di entità (sameAs, Organization, founder…). |
| JSON-LD | ❌ Totalmente assente. |
| Struttura FAQ | ❌ Assente. |
| Autorevolezza | ❌ Nessun segnale (autori, fonti, link). |
| EEAT | ❌ Assente (vedi §EEAT). |
| Citabilità | ❌ Nulla da citare. |
| Contenuti strutturati | ❌ Assenti. |
| Pagine guida / evergreen | ❌ Assenti. |
| Relazioni semantiche fra entità | ❌ Assenti. |

### 1.3 Schema.org — inventario

Tutti i tipi richiesti risultano **ASSENTI**. Nessun JSON-LD né microdata nel codice.

| Tipo | Presente |
|---|---|
| Organization / Corporation | ❌ |
| Person | ❌ |
| LocalBusiness / ProfessionalService | ❌ |
| SoftwareApplication | ❌ |
| Product / Offer | ❌ |
| FAQPage | ❌ |
| Review / AggregateRating | ❌ |
| BreadcrumbList | ❌ |
| Article / BlogPosting | ❌ |
| HowTo | ❌ |
| WebSite + SearchAction | ❌ |
| WebPage | ❌ |
| ImageObject / VideoObject | ❌ |
| ContactPoint | ❌ |
| CreativeWork | ❌ |
| Speakable | ❌ |

### 1.4 Knowledge Graph

Il sito **non è interpretabile come entità**. Mancano: definizione del marchio, fondatore, prodotti/servizi (4bid offre — da memoria di progetto — soluzioni per hotel: SANTADDEO, HotelProfitAI, Manubot, DEM, ecc., ma **nessuna** di queste è dichiarata nel codice), collegamenti `sameAs` (LinkedIn, social, P.IVA), citazioni esterne, struttura semantica.

### 1.5 EEAT

| Pilastro | Stato | Cosa manca |
|---|---|---|
| **Experience** | ❌ | Nessun case study, risultati cliente, anni di attività, esperienze reali documentate. |
| **Expertise** | ❌ | Nessuna pagina autore/team, competenze, certificazioni, contenuti tecnici. |
| **Authoritativeness** | ❌ | Nessun "parlano di noi", premi, partner, backlink, menzioni stampa, P.IVA/ragione sociale. |
| **Trustworthiness** | ❌ | Nessuna pagina contatti, privacy policy, termini, HTTPS dichiarato, indirizzo, recensioni. |

---

## 2. Problemi trovati (sintesi)

1. **Metadata generici di default** (`"v0 App"` / `"Created with v0"`) — danno un segnale di sito non configurato.
2. **`generator: 'v0.app'`** ancora presente.
3. **`<html lang="en">`** su brand italiano → mismatch lingua.
4. **Nessun `metadataBase`** → OG/canonical non risolvibili in URL assoluti.
5. **Nessun `robots.txt` / `sitemap.xml`** → crawl e discovery non guidati.
6. **Nessun contenuto reale**: home placeholder, zero H1, zero copy → thin content totale.
7. **Nessun JSON-LD** → invisibile a Knowledge Graph e motori generativi.
8. **Nessun Open Graph / Twitter Card** → condivisioni social senza preview.
9. **`images.unoptimized: true`** → niente ottimizzazione/responsive/AVIF-WebP per le immagini.
10. **`typescript.ignoreBuildErrors: true`** → rischio di errori silenziati (qualità/manutenibilità).
11. **Nessuna gestione host canonico** (www vs non-www, http→https) a livello redirect.
12. **Nessuna struttura informativa**: niente pagine prodotto/servizio, contatti, about, blog.
13. **EEAT a zero**: nessun segnale di fiducia, autorevolezza, esperienza.
14. **GEO a zero**: nessun contenuto strutturato, FAQ, entità o citabilità per le AI.

---

## 3. Priorità

### 🔴 ALTA (fondamenta — senza queste il sito è invisibile)
- Sostituire i metadata generici con quelli reali di 4bid + `metadataBase`, canonical, OG, Twitter.
- Correggere `<html lang="it">` (e impostare hreflang se multilingua).
- Aggiungere `app/robots.ts` e `app/sitemap.ts`.
- Costruire i **contenuti reali** della home con gerarchia H1–H6 e copy descrittivo dell'azienda e dei prodotti.
- Aggiungere JSON-LD `Organization` + `WebSite` (con `SearchAction` se c'è ricerca).
- Pagine essenziali EEAT: Contatti, Chi siamo, Privacy/Termini.

### 🟡 MEDIA (qualità e visibilità avanzata)
- JSON-LD `SoftwareApplication`/`ProfessionalService`/`Product`/`Offer` per ogni prodotto 4bid.
- `BreadcrumbList` + componente breadcrumb.
- Sezione/blog con `Article`/`BlogPosting` per contenuti evergreen e citabilità GEO.
- `FAQPage` con domande reali sui prodotti/servizi.
- Open Graph image dedicata (usare gli asset reali del brand, non placeholder).
- Riattivare ottimizzazione immagini (rimuovere `unoptimized: true`) + ALT descrittivi + lazy loading.
- `ContactPoint`, `sameAs` (social/LinkedIn), P.IVA e ragione sociale per Knowledge Graph.

### 🟢 BASSA (rifinitura e ottimizzazione spinta)
- Sitemap immagini/video se si pubblicano media.
- `HowTo`, `Review`/`AggregateRating`, `VideoObject`, `Speakable`.
- Tuning Core Web Vitals (preload hero/font critici, `cacheLife`).
- Rimuovere `typescript.ignoreBuildErrors` e bonificare eventuali errori.
- Headers di sicurezza/cache espliciti.

---

## 4. File che dovranno essere modificati / creati

> Elenco indicativo per la fase di implementazione (NON ancora eseguita).

**Da modificare:**
- `app/layout.tsx` — metadata reali, `metadataBase`, `openGraph`, `twitter`, `alternates.canonical`, `lang="it"`, rimozione `generator`.
- `app/page.tsx` — contenuto reale con H1 e struttura heading.
- `next.config.mjs` — rimozione `images.unoptimized`, eventuali `redirects()` host canonico, rivedere `ignoreBuildErrors`.

**Da creare:**
- `app/robots.ts`
- `app/sitemap.ts`
- `components/seo/json-ld.tsx` (Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList…)
- `components/seo/breadcrumbs.tsx`
- `app/(marketing)/chi-siamo/page.tsx`
- `app/(marketing)/contatti/page.tsx`
- `app/(marketing)/prodotti/[slug]/page.tsx` (o pagine dedicate per SANTADDEO / HotelProfitAI / Manubot / DEM)
- `app/privacy/page.tsx`, `app/termini/page.tsx`
- `app/blog/...` (opzionale, per contenuti evergreen/GEO)
- `public/og-image.*` (asset reale del brand)

---

## 5. Benefici attesi

- **Indicizzazione corretta**: robots + sitemap + canonical → Google scopre e indicizza le pagine giuste.
- **CTR e branding**: title/description reali + OG/Twitter → migliori anteprime in SERP e social.
- **Knowledge Graph**: `Organization` + `sameAs` + contatti → 4bid riconosciuta come entità.
- **GEO / AI citabilità**: contenuti strutturati + FAQ + Article + JSON-LD → maggiore probabilità di essere citati da ChatGPT, Gemini, Claude, Perplexity, AI Overview, Copilot.
- **EEAT**: pagine di fiducia e autorevolezza → ranking e affidabilità percepita più alti.
- **Performance**: immagini ottimizzate + preload → Core Web Vitals migliori.

---

## 6. Rischi

- **Lingua/hreflang errati**: impostare hreflang senza versioni reali tradotte può generare errori in Search Console. Procedere solo se esiste il multilingua.
- **JSON-LD non veritiero**: dichiarare `AggregateRating`/`Review` senza recensioni reali viola le linee guida Google → possibili azioni manuali. Inserire solo dati **reali e certi** (coerente con la regola di progetto: mai inventare dati/KPI).
- **Asset placeholder**: usare `placeholder-logo`/immagini inventate per OG viola la regola di progetto → usare **solo** asset reali del brand 4bid.
- **Redirect host**: una regola www/non-www errata può creare loop o catene di redirect. Testare prima.
- **Rimozione `ignoreBuildErrors`**: potrebbe far emergere errori TS che bloccano il build → bonificare in modo controllato.
- **Contenuti Manubot vs SANTADDEO**: NON mescolare le funzionalità dei due prodotti nei contenuti (regola di progetto). Stessa attenzione per qualsiasi pagina prodotto 4bid.

---

## 7. Piano di implementazione (in ordine di priorità)

**Fase 1 — Fondamenta tecniche (ALTA)**
1. `app/layout.tsx`: metadata reali 4bid, `metadataBase`, canonical, OG, Twitter, `lang="it"`, rimozione `generator`.
2. `app/robots.ts` + `app/sitemap.ts`.
3. Contenuto reale home con H1–H6 e copy descrittivo.
4. JSON-LD `Organization` + `WebSite`.

**Fase 2 — Trust & struttura (ALTA/MEDIA)**
5. Pagine Chi siamo, Contatti, Privacy, Termini (EEAT).
6. `BreadcrumbList` + componente breadcrumb.
7. Pagine prodotto/servizio con JSON-LD `SoftwareApplication`/`ProfessionalService`/`Product`/`Offer`.

**Fase 3 — Contenuti GEO (MEDIA)**
8. `FAQPage` con domande reali.
9. Blog/guide evergreen con `Article`/`BlogPosting` e relazioni semantiche fra entità.
10. OG image dedicata (asset reale), ALT, riattivazione ottimizzazione immagini.

**Fase 4 — Rifinitura (BASSA)**
11. Sitemap immagini/video, `HowTo`, `VideoObject`, `Speakable`, `Review`/`AggregateRating` (solo se dati reali).
12. Core Web Vitals tuning, headers, rimozione `ignoreBuildErrors`.

---

## 8. AI Readiness Score (stato attuale del repository)

> Punteggi sullo **stato del codice clonato** (scaffold vuoto), non sul brand. Saliranno drasticamente dopo la Fase 1–2.

| Area | Punteggio /100 |
|---|---|
| Google SEO | 8 |
| Google AI Overview | 3 |
| ChatGPT | 3 |
| Gemini | 3 |
| Claude | 3 |
| Perplexity | 3 |
| Copilot | 3 |
| Knowledge Graph | 2 |
| Entity SEO | 2 |
| Schema.org | 0 |
| EEAT | 2 |

**Media complessiva: ~3/100** — coerente con uno scaffold senza contenuti né metadati reali.

---

## ✅ Prossimo passo

**Nessuna modifica è stata effettuata.** In attesa della tua approvazione prima di toccare qualsiasi file.

Indicami inoltre:
1. Se il **sito 4bid.it reale** esiste su un altro branch/progetto da clonare qui (così l'audit diventa fedele al codice di produzione).
2. Da quale **fase** vuoi che parta l'implementazione una volta approvata.
