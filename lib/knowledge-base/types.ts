// Knowledge Base PUBBLICA 4BID — tipi condivisi.
// NB: distinta dalla KB interna AI/RAG (lib/knowledge, app/admin/knowledge-base,
// app/api/knowledge). Questa è la KB editoriale pubblica per SEO/GEO.

import type { EntityKey } from "@/lib/seo/entities"

/** Voce del glossario centrale. Le definizioni sono fattuali e standard di settore. */
export interface GlossaryTerm {
  /** Slug URL-safe, univoco. Es. "revpar". */
  slug: string
  /** Sigla o nome breve mostrato. Es. "RevPAR". */
  term: string
  /** Forma estesa, se è un acronimo. Es. "Revenue Per Available Room". */
  fullName?: string
  /** Definizione breve (1-2 frasi), fattuale. */
  definition: string
  /** Categoria KB di appartenenza (slug). */
  categorySlug: string
  /** Altri termini del glossario correlati (slug). */
  related?: string[]
  /** Entità del Knowledge Graph collegata, se esiste (per about/mentions). */
  entity?: EntityKey
  /** Aliasi/sinonimi che attivano l'auto-link nelle guide. */
  aliases?: string[]
}

/** Sottocategoria: raggruppa le guide dentro una categoria. */
export interface KBSubcategory {
  slug: string
  name: string
  description: string
}

/** Categoria di primo livello della Knowledge Base. */
export interface KBCategory {
  slug: string
  name: string
  /** Titolo SEO esteso. */
  title: string
  /** Introduzione (1-2 paragrafi) usata nella pagina categoria. */
  intro: string
  /** Descrizione breve per card/meta. */
  short: string
  /** Icona lucide-react (nome componente). */
  icon: string
  subcategories: KBSubcategory[]
  /** Entità del Knowledge Graph collegata (per about/mentions). */
  entity?: EntityKey
  /** FAQ a livello categoria. */
  faqs?: { question: string; answer: string }[]
}

/** Passo di una procedura HowTo dentro una guida. */
export interface GuideHowToStep {
  name: string
  text: string
}

/** Sezione di una guida (per Table of Contents e ancore). */
export interface GuideSection {
  /** id ancora (slug). */
  id: string
  /** Titolo mostrato e voce nel TOC. */
  heading: string
}

/**
 * Voce del registro guide. In FASE 5 il CONTENUTO non viene scritto:
 * qui vive solo la STRUTTURA/metadati. Il corpo della guida verrà aggiunto
 * in seguito collegando un componente di contenuto a questo registro.
 */
export interface KBGuide {
  slug: string
  title: string
  /** Meta description / sommario breve. */
  description: string
  categorySlug: string
  subcategorySlug: string
  /** Autore (default: redazione 4BID). */
  author?: string
  /** Parole chiave SEO. */
  keywords?: string[]
  /** Termini del glossario trattati nella guida (slug). */
  glossaryTerms?: string[]
  /** Sezioni per il Table of Contents. */
  sections?: GuideSection[]
  /** FAQ specifiche della guida. */
  faqs?: { question: string; answer: string }[]
  /** Procedura passo-passo (se applicabile) → schema HowTo. */
  howTo?: { name: string; description?: string; steps: GuideHowToStep[] }
  /** Guide correlate esplicite (slug). Se assenti, derivate per categoria. */
  relatedGuides?: string[]
  /** Entità del Knowledge Graph trattata (about). */
  entity?: EntityKey
  /** true quando la guida è pubblicata (ha contenuto). FASE 5: tutte false. */
  published?: boolean
}
