# Fase 3 - Entity SEO & Knowledge Graph - Report

Data: 26/06/2026
Branch: v0/4bidsrl-ec2be2ee

## Obiettivo

Rafforzare l'Entity SEO collegando le entità del sito (Organization, Person,
prodotti, concetti) in una rete coerente di relazioni leggibili da motori di
ricerca e motori AI (GEO), tramite:
1. relazioni schema `about` / `mentions` / `isPartOf` collegate via `@id`;
2. breadcrumb strutturati sulle pagine prodotto;
3. linking interno contestuale ("Approfondimenti correlati").

Nessuna modifica a database, autenticazione, route esistenti, CTA, colori,
font o layout. Tutte le modifiche sono additive e retro-compatibili.

## File creati

| File | Ruolo |
|------|-------|
| `lib/seo/entities.ts` | Registro unico delle entità (4bid, metodo-4bid, filippo-mancini, santaddeo, hotel-accelerator, hotelprofitai, manubot) con relazioni reciproche e generatore di riferimenti schema (`about`/`mentions` via `@id`). |
| `components/entity-links.tsx` | Sezione visibile "Approfondimenti correlati" (varianti `default` e `dark`), coerente coi token esistenti. |

## File modificati (additivi)

| File | Modifica |
|------|----------|
| `components/seo-structured-data.tsx` | Nuove prop opzionali `about` / `mentions`; aggiunta `isPartOf` (→ `#website`) per WebPage/Article/AboutPage/Service. `@id` spostati in cima alla funzione. Nessuna modifica al comportamento esistente. |
| `app/chi-siamo/page.tsx` | `about`/`mentions` + sezione EntityLinks. |
| `app/metodo-4bid/page.tsx` | `about`/`mentions` + sezione EntityLinks. |
| `app/filippo-mancini/page.tsx` | `about`/`mentions` + sezione EntityLinks. |
| `app/progetti/santaddeo/page.tsx` | breadcrumb + `about`/`mentions` + sezione EntityLinks. |
| `app/progetti/hotel-accelerator/page.tsx` | breadcrumb + `about`/`mentions` + sezione EntityLinks (variante dark). |
| `app/progetti/hotelprofit-ai/page.tsx` | breadcrumb + `about`/`mentions` + sezione EntityLinks. |
| `app/progetti/manubot/page.tsx` | breadcrumb + `about`/`mentions` + sezione EntityLinks. |

## Esiti dei controlli

| # | Controllo | Esito |
|---|-----------|-------|
| 1 | TypeScript sui file Fase 3 | PASS (0 errori nuovi) |
| 2 | HTTP 200 su tutte le 7 pagine | PASS |
| 3 | `isPartOf` → `#website` reso | PASS (7/7) |
| 4 | `about` collegato via `@id`/`@type` | PASS (verificato chi-siamo → `#organization`, santaddeo → `SoftwareApplication`) |
| 5 | `mentions` reso | PASS (es. chi-siamo → `#person`, santaddeo → `Thing` Dynamic Pricing) |
| 6 | `BreadcrumbList` su pagine prodotto | PASS (4/4) |
| 7 | Sezione "Approfondimenti correlati" visibile | PASS (7/7) |

Nota: i conteggi grep iniziali per `about`/`mentions` risultavano 0 a causa
dell'escaping `\"` nel JSON-LD in streaming; la verifica con pattern corretto
ha confermato la presenza e la correttezza dei nodi.

## Vincoli rispettati

- Nessuna modifica a DB, auth, route esistenti, CTA, design globale.
- Solo entità e relazioni reali e verificabili (prodotti realmente esistenti,
  founder reale, concetti effettivamente trattati).
- Modifiche schema retro-compatibili: le pagine che non passano `about`/`mentions`
  continuano a funzionare identiche.

## Validazione esterna consigliata (post-deploy)

1. Google Rich Results Test sulle 7 URL.
2. Schema.org Validator per confermare la risoluzione degli `@id` nel grafo.
3. Verifica breadcrumb nella SERP (Search Console → Miglioramenti → Breadcrumb).
