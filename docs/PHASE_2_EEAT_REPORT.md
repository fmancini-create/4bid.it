# Fase 2 — EEAT & Autorevolezza — Report

Data: 26/06/2026
Branch: v0/4bidsrl-ec2be2ee

Obiettivo: rafforzare Experience, Expertise, Authoritativeness e Trustworthiness
di 4BID **senza** modificare design, layout, database, autenticazione, route
esistenti, CTA esistenti, e senza eliminare pagine o componenti.

---

## File creati

| File | Scopo |
|------|-------|
| `app/chi-siamo/page.tsx` | Pagina istituzionale "Chi siamo": missione, visione, competenze, prodotti, filosofia, approccio. Schema AboutPage + FAQPage + BreadcrumbList. |
| `app/metodo-4bid/page.tsx` | Pagina "Il Metodo 4BID": cos'è, come funziona (5 ambiti integrati), perché nasce dall'esperienza, confronto con la consulenza tradizionale, collegamento ai prodotti. Schema Article + FAQPage + BreadcrumbList. |
| `app/filippo-mancini/page.tsx` | Pagina del fondatore: bio sobria, aree di competenza, prodotti ideati, visione. Schema AboutPage + Person (via @graph) + FAQPage + BreadcrumbList. |
| `docs/PHASE_2_EEAT_REPORT.md` | Questo report. |

## File modificati (solo SEO/schema, nessun impatto su design/funzionalità)

| File | Modifica |
|------|----------|
| `components/seo-structured-data.tsx` | Aggiunto `"AboutPage"` all'union dei tipi e al relativo handling (date + `mainEntityOfPage`), trattato come WebPage. Mantenuti gli `@id` stabili della Fase 1 (`#organization`, `#person`, `#website`). |
| `app/sitemap.ts` | Aggiunto gruppo `eeatPages` con i 3 nuovi URL (priority 0.8) e incluso nel return. |
| `components/footer.tsx` | Aggiunte 3 voci di testo nella lista "Link Veloci" esistente (Chi Siamo → `/chi-siamo`, Metodo 4BID, Filippo Mancini), stile identico. La voce "Chi Siamo" ora punta alla pagina dedicata anziché all'ancora `/#about`. |

---

## Cosa è stato fatto

- 3 nuove pagine informative sobrie e autorevoli, coerenti con il design esistente
  (componenti `Header`/`Footer`, token `primary-blue`/`muted`/`card`, container e
  spaziature già in uso). Nessun nuovo colore, font o pattern di layout.
- Metadata completi per ogni pagina: `title`, `description`, `keywords`,
  `canonical`, OpenGraph e Twitter Card (immagine reale `/og-image-4bid.jpg`;
  per il founder `/filippo.jpg`).
- Structured Data per ogni pagina: schema principale (AboutPage/Article) +
  FAQPage + BreadcrumbList + il grafo entità Organization/Person/WebSite con gli
  `@id` della Fase 1. La Person "Filippo Mancini" risulta collegata
  all'Organization come founder.
- 6-7 FAQ reali e sobrie per pagina, con FAQPage JSON-LD.
- Link interni contestuali: ogni pagina collega le altre due, i 4 prodotti
  (`/progetti/santaddeo`, `/progetti/hotel-accelerator`, `/progetti/hotelprofit-ai`,
  `/progetti/manubot`) e le pagine Revenue (`/consulenza-revenue-management-hotel`,
  `/come-aumentare-ricavi-hotel`, `/soluzioni-revenue-management`). Collegamento
  sitewide dal footer (presente anche in home).

## Benefici SEO

- 3 nuove pagine indicizzabili e presenti in sitemap, con metadata e canonical corretti.
- BreadcrumbList migliora la comprensione della gerarchia e i rich result.
- Internal linking che de-orfanizza le pagine istituzionali e distribuisce
  autorità verso prodotti e landing Revenue.
- Og/Twitter Card per anteprime social di qualità.

## Benefici GEO (AI / motori generativi)

- Entità "4BID" e "Filippo Mancini" descritte in modo esplicito e collegate via
  `@id`: i motori AI possono riconoscere chi è l'azienda, chi l'ha fondata e
  quali prodotti ha creato.
- FAQ in linguaggio naturale = contenuto facilmente citabile da ChatGPT,
  Gemini, Perplexity, Claude.
- Pagina dedicata al fondatore = fonte autorevole sull'entità Person.

## Benefici EEAT

- **Experience**: esperienza diretta nella gestione alberghiera (Villa I Barronci) esplicitata.
- **Expertise**: competenze su revenue management e AI descritte e collegate ai prodotti.
- **Authoritativeness**: pagina founder + Person schema + `sameAs` LinkedIn.
- **Trustworthiness**: dati societari reali (sede, P.IVA), nessun claim inventato, tono sobrio.

## Rischi

- Bassi. Modifiche additive; nessuna route/CTA/DB/auth toccati.
- Unico cambiamento su elemento esistente: il link footer "Chi Siamo" ora punta a
  `/chi-siamo` invece di `/#about` (miglioria, non regressione).
- Lo schema `AboutPage` è additivo e retrocompatibile con gli usi esistenti di `StructuredData`.

## Test effettuati

- TypeScript (`tsc --noEmit`): nessun errore sui file della Fase 2.
- Runtime: `/chi-siamo`, `/metodo-4bid`, `/filippo-mancini` → HTTP 200.
- Metadata: title, canonical, og:title, twitter:card presenti su tutte e 3.
- JSON-LD: FAQPage (1), BreadcrumbList (1), @graph con Person/Organization (1) e
  "Filippo Mancini" presenti su tutte e 3.
- Sitemap: le 3 pagine presenti in `/sitemap.xml`.
- Footer: i 3 link presenti e visibili anche in home.
- Anti-claim: nessun numero/percentuale/€ inventato nelle nuove pagine.

## Attività residue / possibili estensioni (non incluse, su approvazione)

- Aggiungere un link contestuale dal corpo della home alle nuove pagine
  (richiederebbe la modifica di un componente della home: non fatto per non
  toccare il design principale).
- Aggiungere `ProfilePage` come tipo dedicato per `/filippo-mancini` (oggi
  AboutPage + Person nel @graph).
- Eventuale immagine OG dedicata per ciascuna pagina (oggi si usa l'asset reale comune).
- Verifica esterna post-deploy con Google Rich Results Test e Schema.org Validator.
