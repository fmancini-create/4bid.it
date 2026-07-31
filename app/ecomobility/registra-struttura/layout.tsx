import type React from "react"
import type { Metadata } from "next"

/**
 * `page.tsx` di questa cartella e' un componente client ("use client"), e un
 * componente client non puo' esportare `metadata`. Senza questo layout la
 * pagina restava l'unica della sitemap senza canonical: era in elenco per
 * Google ma non dichiarava il proprio indirizzo ufficiale.
 *
 * Il canonical sta QUI e non in `app/ecomobility/layout.tsx` di proposito: un
 * canonical su quel layout verrebbe EREDITATO da tutte le pagine ecomobility,
 * che si dichiarerebbero doppioni l'una dell'altra. E' lo stesso difetto che
 * il layout radice aveva verso l'intero sito.
 */
export const metadata: Metadata = {
  title: "Registra la tua Struttura | 4 bid Ecomobility",
  description:
    "Attiva il noleggio di mobilita' elettrica nella tua struttura ricettiva: nessun investimento iniziale, gestione completa e nuovi ricavi per hotel e agriturismi.",
  alternates: { canonical: "https://www.4bid.it/ecomobility/registra-struttura" },
}

export default function RegistraStrutturaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
