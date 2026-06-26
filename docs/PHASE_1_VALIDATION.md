# Validazione Fase 1 — SEO/GEO

> Report di sola verifica. **Nessuna modifica al codice** è stata effettuata.
> Data: 26/06/2026 · Ambiente: dev server locale (porta 3000) + ispezione statica.

## Esito sintetico

| # | Controllo | Esito |
|---|-----------|:-----:|
| 1 | `/robots.txt` generato da `app/robots.ts` | PASS |
| 2 | Presenza corretta di `/llms.txt` in robots | PASS |
| 3 | Assenza conflitto con `public/robots.txt` | PASS |
| 4 | `/sitemap.xml` raggiungibile | PASS |
| 5 | `og:image` correttamente valorizzata | PASS |
| 6 | Twitter Card correttamente valorizzata | PASS |
| 7 | JSON-LD `@graph` valido | PASS |
| 8 | Presenza di `@id` stabili | PASS |
| 9 | Collegamento Organization → Person | PASS |
| 10 | Collegamento Person → Organization | PASS |
| 11 | Assenza di errori TypeScript (file Fase 1) | PASS |
| 12 | Assenza di errori build | PASS |
| 13 | Nessuna regressione su sitemap/metadata/canonical | PASS |

**Risultato complessivo: 13/13 PASS.**

---

## Dettaglio per controllo

### 1. `/robots.txt` generato da `app/robots.ts`
`GET http://localhost:3000/robots.txt` → 200, contenuto generato dinamicamente.
Include le regole per `*`, `Googlebot` e i 7 crawler AI.

### 2. `/llms.txt` in robots
`Allow: /llms.txt` presente nella regola `*` e in tutte le regole dei crawler AI.
File reale `public/llms.txt` presente (6.402 byte).

### 3. Assenza conflitto con `public/robots.txt`
`public/robots.txt` **non esiste più** (Glob: nessun file). Unica fonte di verità:
`app/robots.ts`. Nessun conflitto possibile.

### 4. `/sitemap.xml` raggiungibile
`GET /sitemap.xml` → 200, XML valido, **61 URL** (`<loc>`), con `lastmod`,
`changefreq`, `priority`. Primo URL: `https://www.4bid.it`.

### 5. `og:image`
- Home `/`: `<meta property="og:image" content="https://www.4bid.it/og-image-4bid.jpg"/>` presente.
- Asset reale `public/og-image-4bid.jpg` presente (27.442 byte, 1024×1024).
- Definito in `app/layout.tsx` con width/height/alt.

### 6. Twitter Card
`<meta name="twitter:card" content="summary_large_image"/>` presente su home e
pagine interne; `twitter:image` punta a `og-image-4bid.jpg`.

### 7. JSON-LD `@graph` valido
Script `id="structured-data-entities"` con `"@context":"https://schema.org"` e
`"@graph": [...]` renderizzato nell'HTML. Contiene 3 nodi: `WebSite`,
`Organization`, `Person`. JSON serializzato correttamente (nessun errore di parse).

### 8. `@id` stabili
- `https://www.4bid.it/#website`
- `https://www.4bid.it/#organization`
- `https://www.4bid.it/#person`

### 9. Organization → Person
`Organization.founder` = `{"@id":"https://www.4bid.it/#person"}` — verificato
nell'HTML reso.

### 10. Person → Organization
`Person.worksFor` = `{"@id":"https://www.4bid.it/#organization"}` — verificato.
Person: `name: "Filippo Mancini"`, `jobTitle: "Founder & CEO"`,
`image: /filippo.jpg` (asset reale presente, 23.337 byte),
`sameAs: ["https://www.linkedin.com/in/fimancini/"]`.

### 11. Errori TypeScript (file Fase 1)
`tsc --noEmit` su `app/robots.ts`, `app/layout.tsx`,
`components/seo-structured-data.tsx`: **0 errori**.

### 12. Errori build
`next.config` ha `typescript.ignoreBuildErrors: true`. I file Fase 1 sono
comunque puliti, quindi non introducono errori. Build non bloccato.

### 13. Nessuna regressione
- Canonical home invariato (`https://www.4bid.it`).
- Metadata title/description/keywords invariati.
- Sitemap invariata (61 URL, stessa struttura).
- `mainSchema`, `faqSchema`, `breadcrumbSchema` di `StructuredData` invariati:
  il nuovo `@graph` è **additivo**, non sostituisce gli schemi per-pagina.

---

## Problemi rilevati

**Nessun problema bloccante.** Osservazioni minori (NON Fase 1):

- **37 errori TypeScript preesistenti** nel repo, in file estranei alla Fase 1
  (es. `app/admin/business-plan/...`, `app/admin/ecomobility/page.tsx`,
  `app/adr-hotel-come-aumentarlo/page.tsx`). Mascherati da `ignoreBuildErrors:true`.
  Non introdotti dalla Fase 1; segnalati solo per igiene del codice.

---

## File verificati

- `app/robots.ts` (modificato Fase 1)
- `app/layout.tsx` (modificato Fase 1)
- `components/seo-structured-data.tsx` (modificato Fase 1)
- `public/robots.txt` (eliminato — confermato assente)
- `public/llms.txt`, `public/og-image-4bid.jpg`, `public/filippo.jpg` (asset reali)
- `app/sitemap.ts` (output verificato a runtime)
- `next.config.*` (config build verificata)

## Endpoint testati a runtime

- `GET /` → 200
- `GET /robots.txt` → 200
- `GET /sitemap.xml` → 200 (61 URL)
- `GET /come-aumentare-ricavi-hotel` → 200 (JSON-LD + meta verificati)

---

## Raccomandazioni

1. **Validazione esterna post-deploy**: passare la home nel
   [Rich Results Test](https://search.google.com/test/rich-results) e nello
   Schema Markup Validator per conferma lato Google.
2. **Anteprime social**: verificare la card con il LinkedIn Post Inspector e il
   debugger di Facebook dopo il deploy (forzare il refresh della cache OG).
3. **`@graph` per-entità**: valutare in Fase 2 l'aggiunta di `Review`/
   `AggregateRating` (solo recensioni reali) e `HowTo` per gli articoli guida.
4. **Igiene TS (opzionale)**: pianificare la bonifica dei 37 errori preesistenti
   per poter eventualmente disattivare `ignoreBuildErrors`.
5. **Sanity check sitemap**: i 61 URL del runtime locale vanno confrontati con le
   route effettivamente pubbliche dopo il deploy in produzione.
