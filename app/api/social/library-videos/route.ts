import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * I video della libreria utilizzabili da una campagna social.
 *
 * Perche' una rotta nuova invece di riusare /api/admin/youtube-videos: quella e'
 * riservata al SOLO super admin (confronto sull'indirizzo email). Chiamandola da
 * qui, un altro amministratore avrebbe ricevuto 401 e l'interfaccia gli avrebbe
 * mostrato una libreria VUOTA — cioe' "non hai video" invece di "non hai il
 * permesso". Un'assenza silenziosa che sembra un dato vero e' peggio di un
 * errore, perche' non fa rumore.
 *
 * Qui la guardia e' la stessa di /api/social/topic-rules: serve un utente
 * autenticato, come per configurare la campagna che questi video useranno.
 *
 * Restituisce solo i video VISIBILI: quelli nascosti sono stati toccati
 * dall'operatore proprio per non mostrarli, e proporli qui li rimetterebbe in
 * circolo da una porta di servizio.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const { data, error } = await supabase
    .from("youtube_videos")
    .select("video_id, title, thumbnail_url, sort_order")
    .eq("hidden", false)
    // Lo stesso ordine usato dalla rotazione: cosi' l'elenco mostrato coincide
    // con la sequenza reale delle uscite, invece di suggerirne un'altra.
    .order("sort_order", { ascending: true })
    .order("video_id", { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ videos: data || [] })
}
