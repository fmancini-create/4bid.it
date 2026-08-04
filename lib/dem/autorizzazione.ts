import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SUPER_ADMIN_EMAIL } from "@/lib/admin-config"

/**
 * Guardia di autorizzazione per le rotte DEM.
 *
 * PERCHE' ESISTE (incidente del 03/08/2026, provato in locale):
 * le rotte sotto /api/dem/ non erano protette da nessuna parte.
 *
 *   - `proxy.ts` ha una lista ADMIN_API_ROUTES, ma serve SOLO a saltare il
 *     rate limiting: non esegue alcun controllo di sessione sulle API. La
 *     guardia con `getUser()` nel proxy copre le PAGINE (/admin, /area-riservata),
 *     non le rotte /api/*.
 *   - Misurato senza alcun cookie: `GET /api/dem/campaigns` -> 200 con id,
 *     oggetto e template HTML di tutte le campagne; `POST /api/dem/send` ->
 *     "Campagna non trovata", cioe' la richiesta veniva ELABORATA.
 *
 * Catena di attacco completa: leggere gli id da /campaigns e passarli a /send
 * per far partire un invio a 27.000 indirizzi.
 *
 * REGOLA IMPARATA: un 400 "non trovato" prova che sei passato dall'autorizzazione,
 * non che sei stato fermato. Per giudicare se una rotta e' protetta serve un 401
 * o 403, non un errore di validazione.
 *
 * Restituisce `null` quando la richiesta e' autorizzata, altrimenti la risposta
 * di rifiuto da restituire subito al chiamante.
 */
export async function rifiutaSeNonAutorizzato(request: Request): Promise<NextResponse | null> {
  // 1) Chiamate automatiche (cron, script di manutenzione) si identificano con
  //    CRON_SECRET. Senza questa via un cron legittimo verrebbe respinto, e la
  //    reazione tipica sarebbe togliere la guardia invece di aggiungere il
  //    segreto: una protezione che ostacola il lavoro lecito viene rimossa.
  const atteso = process.env.CRON_SECRET
  if (atteso) {
    const intestazione = request.headers.get("authorization")
    if (intestazione === `Bearer ${atteso}`) return null
  }

  // 2) Sessione umana. `getUser()` interroga Supabase e non si limita a leggere
  //    il cookie: un cookie manomesso non supera questo controllo.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  // Le DEM partono verso decine di migliaia di destinatari esterni: l'accesso
  // resta limitato al super admin, come gia' fanno /api/dem/hotels,
  // /api/dem/unsubscribes, /api/dem/warm e /api/dem/validate.
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  }

  return null
}
