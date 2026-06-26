# Fase 4 — HowTo Schema sulle Guide (M2) + Breadcrumb

> Intervento di sola aggiunta schema/SEO. Nessuna modifica a DB, auth, route
> esistenti, CTA, design, layout, colori o testi visibili.
> Data: 26/06/2026

---

## Cosa è stato fatto

### M2 — HowTo Schema sulle 3 guide
Aggiunto lo schema `HowTo` (Schema.org) alle pagine guida che contengono una
procedura "Come Funziona: 5 Step". **Gli step dello schema sono i passi REALI
già pubblicati nelle pagine** (titolo + descrizione presi 1:1 dal contenuto
esistente) — nessun dato inventato.

| Pagina | HowTo `name` | Step |
|---|---|---|
| `/guida-revenue-management-hotel` | Come implementare il Revenue Management in hotel: 5 step | Raccolta dati · Analisi del mercato · Segmentazione clientela · Definizione strategia tariffaria · Monitoraggio e ottimizzazione |
| `/guida-pricing-hotel` | Come definire una strategia di pricing per hotel: 5 step | Analisi dei costi · Definizione della BAR · Segmentazione tariffaria · Regole di variazione · Test e ottimizzazione |
| `/guida-prenotazioni-dirette-hotel` | Come aumentare le prenotazioni dirette in hotel: 5 step | Analisi del channel mix · Ottimizzazione del sito web · Implementazione booking engine · Strategia di marketing diretto · Misurazione e ottimizzazione |

### Breadcrumb sulle guide
Le 3 guide non avevano `BreadcrumbList`: aggiunto (Home > Guida …) per coerenza
con il resto del sito e per la navigazione strutturata in SERP.

---

## File modificati (tutti additivi)

| File | Modifica |
|---|---|
| `components/seo-structured-data.tsx` | Nuove interfacce `HowToStep`/`HowToData`, prop `howTo` opzionale, generazione `howToSchema` (`@type: HowTo` + `HowToStep`), emissione `<Script id="structured-data-howto">`. Retro-compatibile: senza la prop nulla cambia. |
| `app/guida-revenue-management-hotel/page.tsx` | Prop `howTo` (5 step reali) + `breadcrumbs`. |
| `app/guida-pricing-hotel/page.tsx` | Prop `howTo` (5 step reali) + `breadcrumbs`. |
| `app/guida-prenotazioni-dirette-hotel/page.tsx` | Prop `howTo` (5 step reali) + `breadcrumbs`. |

---

## Verifica

- **TypeScript**: nessun errore sui file toccati (`tsc --noEmit`).
- **HTTP**: le 3 guide rispondono 200.
- **Nota dev server**: le guide sono `force-static`; in dev viene servito l'HTML
  pre-buildato, quindi il nuovo JSON-LD non è visibile finché non si rigenera la
  build. La logica è verificata nel sorgente e verrà emessa in produzione al
  deploy. **Validare post-deploy** con Google Rich Results Test (tipo HowTo).
- **Dati reali**: tutti i 15 step provengono dal contenuto già pubblicato nelle
  pagine. Nessun valore inventato.

---

## Voci dell'audit NON implementate (e perché)

| Punto | Stato | Motivo |
|---|---|---|
| M3 SearchAction (sitelinks searchbox) | **Escluso** | Il sito non ha una ricerca interna funzionante. Dichiarare un `SearchAction` senza endpoint reale è un segnale fuorviante (sconsigliato da Google). Da fare solo se in futuro si aggiunge la ricerca. |
| M4 ProfessionalService (geo/openingHours/priceRange) | **Da confermare** | Richiede dati reali e certi: orari di apertura e fascia di prezzo della consulenza. Non disponibili/non inventabili. |
| A5 Review / AggregateRating | **Da confermare** | Richiede testimonianze reali e verificabili (con autore e contenuto) dalla pagina "Parlano di noi". Da raccogliere prima di modellarle, per non violare le linee guida Google e la regola interna "dati certi, mai inventati". |
| M6 SoftwareApplication rating sui prodotti | **Da confermare** | Stesso vincolo: servono valutazioni reali del software. |

---

## Prossimi passi consigliati

1. **M4 / A5 / M6**: fornire i dati reali (orari + priceRange consulenza;
   testimonianze verificabili; eventuali rating software) → poi li modello.
2. Validazione post-deploy degli HowTo con Rich Results Test.
3. Restano le rifiniture di Fase 5 (B1 sitemap immagini, B2 Speakable, B3 audit
   Core Web Vitals in produzione, M5 sitemap con `lastModified` reale).
