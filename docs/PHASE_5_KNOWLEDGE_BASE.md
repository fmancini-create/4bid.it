# Fase 5 — Knowledge Base & Glossario (SOLA STRUTTURA)

Stato: completata. Nessun contenuto/articolo scritto (per scelta): è stata
costruita solo l'infrastruttura, pronta a popolarsi.

## Principio guida
Tutta la Fase 5 è **additiva** e **type-safe**. Non sono stati toccati DB, auth,
route esistenti, CTA o design globale. La KB pubblica è tenuta **separata** dalla
KB interna AI/RAG già presente (`lib/knowledge`, `app/admin/knowledge-base`,
`app/api/knowledge`): namespace nuovi `lib/knowledge-base/` e route `/knowledge-base`,
`/glossario`.

## Data layer (`lib/knowledge-base/`)
- `types.ts` — tipi condivisi: `GlossaryTerm`, `KBCategory`, `KBSubcategory`,
  `GuideSection`, `KBGuide`.
- `glossary.ts` — **25 termini** del settore (ADR, RevPAR, occupazione, dynamic
  pricing, OTA, PMS, channel manager, BAR, yield, pace, pick-up, TRevPAR, GOPPAR,
  upselling, cross selling, ecc.). Definizioni fattuali e standard, con alias e
  termini correlati.
- `taxonomy.ts` — **9 categorie** con sottocategorie, intro, FAQ e icone. Registro
  guide `GUIDES = []` (VUOTO per scelta: aggiungere una guida la attiva ovunque).
- `index.ts` — helper trasversali: reading time, **auto-link del glossario**,
  costruttori breadcrumb, URL.

## Schema esteso (`components/seo-structured-data.tsx`) — additivo
- Nuovo tipo `CollectionPage` (pagine categoria) e supporto **Speakable**
  (`SpeakableSpecification` con cssSelector) per GEO/lettura vocale.
- Nuova prop `hasParts` → `hasPart` (elenco guide di una categoria).
- Retro-compatibile: senza le nuove prop, nulla cambia per le ~53 pagine esistenti.

## Componenti riutilizzabili (`components/knowledge-base/`)
- `kb-article.tsx` — TEMPLATE master della guida: compone breadcrumb, meta
  (autore, tempo lettura, ultimo aggiornamento via `GuideLastUpdated`), TOC,
  contenuto, glossario richiamato, FAQ, correlati ed emette gli schema
  Article + Breadcrumb + FAQPage + HowTo + Speakable + about/mentions.
- `kb-rich-text.tsx` — paragrafo con **auto-link del glossario**.
- `glossary-term-link.tsx`, `kb-breadcrumb.tsx`, `kb-meta.tsx`,
  `kb-table-of-contents.tsx`, `kb-faq.tsx`, `kb-related-guides.tsx`,
  `kb-cards.tsx`, `kb-icon.tsx`, `kb-search.tsx` (ricerca client-side).

## Route create
- `/knowledge-base` — hub con ricerca + griglia categorie + link al glossario.
- `/knowledge-base/[category]` — pagina categoria: intro, sottocategorie, guide
  (stato "in arrivo" finché vuote), FAQ, schema `CollectionPage`.
- `/knowledge-base/[category]/[slug]` — TEMPLATE guida (usa `KBArticle`).
  `generateStaticParams` ritorna `[]` in Fase 5 → `notFound()` finché non si
  aggiungono guide.
- `/glossario` — hub: ricerca + elenco alfabetico + schema `DefinedTermSet`.
- `/glossario/[slug]` — singolo termine: definizione, categoria, correlati,
  schema `DefinedTerm` + `BreadcrumbList`.

## Integrazione SEO
- `app/sitemap.ts` — aggiunti hub KB, 9 categorie, glossario hub e 25 termini
  (più le guide pubblicate, dinamico). Totale sitemap: ~100 URL.
- `components/footer.tsx` — aggiunti link sitewide "Knowledge Base" e "Glossario".

## Validazione
- `tsc --noEmit`: nessun errore nei file Fase 5.
- HTTP: `/knowledge-base` 200, `/knowledge-base/revenue-management` 200,
  `/knowledge-base/pricing` 200, `/glossario` 200, `/glossario/revpar` 200,
  `/glossario/adr` 200; guida inesistente → **404** (corretto).
- Schema verificati nel reso: `DefinedTermSet` (hub glossario), `DefinedTerm` +
  `inDefinedTermSet` + `BreadcrumbList` (termine), `CollectionPage` +
  `BreadcrumbList` (categoria), ricerca presente su hub KB e glossario.

## Come pubblicare una guida (in futuro)
1. Aggiungere un oggetto `KBGuide` con `published: true` a `GUIDES` in
   `lib/knowledge-base/taxonomy.ts` (slug, categoria, sezioni con `body`, FAQ,
   eventuale `howTo`, `glossaryTerms`, `filePath`).
2. Tutto il resto (route, sitemap, breadcrumb, correlati, schema, auto-link
   glossario) si attiva automaticamente. Nessun'altra modifica necessaria.

## Note / scelte
- **Nessun contenuto inventato**: le definizioni del glossario sono standard di
  settore; le guide non sono state scritte.
- `SearchAction` (sitelinks searchbox globale) resta escluso: richiede un
  endpoint di ricerca a livello sito, non presente. La ricerca KB/glossario è
  invece reale e client-side, interna alle rispettive sezioni.
