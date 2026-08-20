import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { publishToFacebook, publishVideoToFacebook } from "@/lib/social/facebook"
import { publishToInstagram, publishReelToInstagram, riprendiReelInstagram } from "@/lib/social/instagram"
import { publishToLinkedInWithFallback, publishVideoToLinkedIn } from "@/lib/social/linkedin"
import {
  LIMITE_ATTESA_MS,
  avvioAttesa,
  canPublish,
  decidiStatoPost,
  resolveMediaKind,
} from "@/lib/social/video"

// Cron job per pubblicare i post programmati
// Esegue ogni 5 minuti e pubblica i post con scheduled_for <= now

// I video richiedono caricamenti lunghi: senza questo il cron verrebbe troncato.
export const maxDuration = 300

/**
 * Riprende i post lasciati in stato "processing": controlla se il container
 * Instagram e' pronto e, se lo e', lo pubblica.
 */
async function riprendiInElaborazione(
  // Il tipo e' quello del client creato in questa rotta. Annotarlo come
  // ReturnType<typeof createClient> prendeva una firma diversa (senza schema),
  // che rendeva ogni riga letta `never`: 14 errori inventati che seppellivano
  // quelli veri. Il tipo di un doppio va preso dal chiamante, non indovinato.
  supabase: SupabaseClient<any, "public", "public", any, any>,
  accounts: Array<Record<string, any>>,
): Promise<{ pubblicati: number; ancoraInCorso: number; scaduti: number }> {
  const esito = { pubblicati: 0, ancoraInCorso: 0, scaduti: 0 }

  const { data: attesi } = await supabase.from("social_posts").select("*").eq("status", "processing").limit(20)

  if (!attesi || attesi.length === 0) return esito
  console.log(`[v0] Post in elaborazione da riprendere: ${attesi.length}`)

  for (const post of attesi) {
    const stato = (post.processing_state || {}) as { instagram_containers?: Record<string, string>; avviato?: string }
    const containers: Record<string, string> = stato.instagram_containers || {}
    const avviato = stato.avviato ? Date.parse(stato.avviato) : 0

    // Nessun container da riprendere: il post e' in "processing" per errore.
    // Va chiuso, non lasciato appeso.
    if (Object.keys(containers).length === 0) {
      await supabase
        .from("social_posts")
        .update({
          status: "failed",
          error_message: "Post rimasto in elaborazione senza alcun video da riprendere",
        })
        .eq("id", post.id)
      esito.scaduti++
      continue
    }

    if (avviato && Date.now() - avviato > LIMITE_ATTESA_MS) {
      await supabase
        .from("social_posts")
        .update({
          status: "failed",
          error_message: `Instagram non ha completato l'elaborazione del video entro ${LIMITE_ATTESA_MS / 3600000} ore`,
          processing_state: {},
        })
        .eq("id", post.id)
      esito.scaduti++
      console.log(`[v0] Post ${post.id}: attesa scaduta, dichiarato fallito`)
      continue
    }

    const platformPostIds: Record<string, string> = { ...((post.platform_post_ids || {}) as Record<string, string>) }
    const rimasti: Record<string, string> = {}
    const errori: string[] = []

    for (const [accountId, creationId] of Object.entries(containers)) {
      const account = accounts.find((a) => a.id === accountId)
      if (!account) {
        errori.push("Account Instagram non più disponibile per completare la pubblicazione")
        continue
      }
      const r = await riprendiReelInstagram(account.account_id, account.access_token, creationId)
      if (r.success && r.postId) {
        platformPostIds[`instagram_${account.account_name}`] = r.postId
        esito.pubblicati++
        console.log(`[v0] Reel ripreso e pubblicato: ${r.postId}`)
      } else if (r.ancoraInCorso) {
        rimasti[accountId] = creationId
        esito.ancoraInCorso++
      } else {
        errori.push(`Instagram (${account.account_name}): ${r.error || "Errore sconosciuto"}`)
      }
    }

    const ancoraAttesa = Object.keys(rimasti).length > 0
    const qualcosaUscito = Object.keys(platformPostIds).length > 0

    // La decisione sui tre esiti sta in lib/social/video.ts: funzione pura,
    // quindi raggiungibile dalle prove. Quando era scritta qui dentro, due
    // sabotaggi su questa logica sono sfuggiti.
    const deciso = decidiStatoPost({
      qualcosaPubblicato: qualcosaUscito,
      inAttesa: ancoraAttesa,
      avviatoIl: stato.avviato,
    })

    await supabase
      .from("social_posts")
      .update({
        status: deciso.stato,
        published_at: deciso.stato === "published" ? new Date().toISOString() : post.published_at,
        platform_post_ids: platformPostIds,
        // L'istante di avvio si CONSERVA (avvioAttesa mantiene l'originale): se
        // lo riscrivessimo a ogni giro, il limite non scadrebbe mai.
        processing_state:
          deciso.stato === "processing" ? { instagram_containers: rimasti, avviato: avvioAttesa(stato.avviato) } : {},
        error_message: errori.length > 0 ? errori.join("; ") : post.error_message,
      })
      .eq("id", post.id)

    if (deciso.scaduto) {
      esito.scaduti++
      console.log(`[v0] Post ${post.id}: attesa scaduta durante la ripresa`)
    }
  }

  console.log("[v0] Ripresa completata:", esito)
  return esito
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
    const isManuallyAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isDev = process.env.NODE_ENV === "development"

    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
      console.error("[v0] Cron unauthorized")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Usa service role per bypassare RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const now = new Date().toISOString()
    console.log(`[v0] Cron running at ${now}`)

    // Trova i post programmati che devono essere pubblicati
    const { data: posts, error: fetchError } = await supabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error("[v0] Error fetching scheduled posts:", fetchError)
      return NextResponse.json({ error: "Errore nel recupero dei post" }, { status: 500 })
    }

    const { data: allScheduled } = await supabase
      .from("social_posts")
      .select("id, status, scheduled_for, content")
      .eq("status", "scheduled")

    console.log(
      `[v0] All scheduled posts:`,
      allScheduled?.map((p) => ({
        id: p.id,
        status: p.status,
        scheduled_for: p.scheduled_for,
        content: p.content?.substring(0, 30) + "...",
      })),
    )
    console.log(`[v0] Posts to publish (scheduled_for <= ${now}):`, posts?.length || 0)

    // Recupera gli account attivi
    const { data: accounts } = await supabase.from("social_accounts").select("*").eq("is_active", true)

    // RIPRESA dei Reel lasciati in elaborazione da un giro precedente.
    //
    // Deve stare PRIMA del ritorno "nessun post da pubblicare": il caso normale
    // e' proprio quello (nessun post programmato in scadenza), ed e' esattamente
    // il giro in cui un Reel in attesa va ripreso. Metterla dopo significava non
    // eseguirla mai quando serviva, lasciando il post bloccato in "processing"
    // per sempre.
    const ripresi = await riprendiInElaborazione(supabase, accounts || [])

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: "Nessun post da pubblicare",
        count: 0,
        ripresi,
        debug: {
          now,
          allScheduledCount: allScheduled?.length || 0,
          allScheduled: allScheduled?.map((p) => ({
            id: p.id,
            scheduled_for: p.scheduled_for,
          })),
        },
      })
    }

    console.log(`[v0] Found ${posts.length} scheduled posts to publish`)

    const results: { postId: string; success: boolean; errors?: string[] }[] = []

    // Pubblica ogni post
    for (const post of posts) {
      const platformPostIds: Record<string, string> = {}
      const errors: string[] = []
      // Stessa funzione usata dalla pubblicazione manuale: un solo giudice sul
      // tipo di media, cosi' le due strade non possono divergere.
      const mediaKind = resolveMediaKind({ videoUrl: post.video_url, imageUrl: post.image_url })
      const inElaborazione: Record<string, string> = {}

      let platformsToPublish = post.platforms || []
      if (!platformsToPublish || platformsToPublish.length === 0) {
        const uniquePlatforms = [...new Set(accounts?.map((a) => a.platform) || [])]
        platformsToPublish = uniquePlatforms
      }

      if (platformsToPublish.length === 0) {
        errors.push("Nessuna piattaforma configurata")
      } else {
        // Pubblica su ogni piattaforma
        for (const platform of platformsToPublish) {
          let platformAccounts = accounts?.filter((a) => a.platform === platform) || []

          // Le destinazioni scelte sono una ALLOWLIST autorevole su TUTTE le
          // piattaforme (coerente col publish manuale): si pubblica SOLO sulle
          // pagine indicate. Se una piattaforma selezionata non ha destinazioni,
          // viene segnalata (niente skip muto).
          if (post.target_accounts && post.target_accounts.length > 0) {
            platformAccounts = platformAccounts.filter(
              (a) =>
                post.target_accounts.includes(a.id) ||
                post.target_accounts.includes(a.account_id) ||
                post.target_accounts.includes(a.page_id),
            )
            if (platformAccounts.length === 0) {
              errors.push(`${platform}: nessuna destinazione selezionata, post non pubblicato su questa piattaforma`)
              continue
            }
          }

          if (platformAccounts.length === 0) {
            errors.push(`Account ${platform} non configurato`)
            continue
          }

          for (const account of platformAccounts) {
            try {
              if (platform === "facebook") {
                const result =
                  mediaKind === "video"
                    ? await publishVideoToFacebook(
                        account.page_id,
                        account.access_token,
                        post.content,
                        post.video_url,
                        post.link_url,
                      )
                    : await publishToFacebook(
                        account.page_id,
                        account.access_token,
                        post.content,
                        mediaKind === "youtube" ? post.video_url : post.link_url,
                        post.image_url,
                        // DIFETTO PREESISTENTE CORRETTO: media_priority non veniva
                        // passato affatto, quindi il cron usava sempre il default
                        // "image" e la scelta dell'operatore veniva ignorata solo
                        // nei post programmati. La pubblicazione manuale lo passava.
                        mediaKind === "youtube" ? "link" : post.media_priority || "image",
                      )

                if (result.success && result.postId) {
                  platformPostIds[`facebook_${account.account_name}`] = result.postId
                  console.log(`[v0] Published to Facebook ${account.account_name}: ${result.postId}`)
                } else {
                  errors.push(`Facebook (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
                }
              } else if (platform === "instagram") {
                const ammesso = canPublish("instagram", mediaKind, { hasLink: Boolean(post.link_url) })
                if (!ammesso.ok) {
                  errors.push(`Instagram (${account.account_name}): ${ammesso.reason}`)
                  continue
                }

                const result =
                  mediaKind === "video"
                    ? await publishReelToInstagram(
                        account.account_id,
                        account.access_token,
                        post.content,
                        post.video_url,
                        post.link_url,
                        post.image_url,
                      )
                    : await publishToInstagram(
                        account.account_id,
                        account.access_token,
                        post.content,
                        post.image_url,
                        post.link_url,
                      )

                if (result.success && result.postId) {
                  platformPostIds[`instagram_${account.account_name}`] = result.postId
                  console.log(`[v0] Published to Instagram ${account.account_name}: ${result.postId}`)
                } else if ("pending" in result && result.pending) {
                  inElaborazione[account.id] = result.pending.creationId
                  console.log(`[v0] Instagram Reel in elaborazione: ${result.pending.creationId}`)
                } else {
                  errors.push(`Instagram (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
                }
              } else if (platform === "linkedin") {
                const result =
                  mediaKind === "video"
                    ? await publishVideoToLinkedIn(
                        account.access_token,
                        account.account_id,
                        post.content,
                        post.video_url,
                        post.title,
                      )
                    : await publishToLinkedInWithFallback(
                        account.access_token,
                        account.account_id,
                        account.page_id,
                        post.content,
                        // DIFETTO PREESISTENTE CORRETTO (approvato dal committente):
                        // qui veniva passato post.image_url al posto di post.link_url.
                        // Il quinto parametro e' `linkUrl`, quindi l'URL della
                        // FOTOGRAFIA diventava il link dell'articolo LinkedIn. La
                        // pubblicazione manuale passava correttamente link_url:
                        // due strade, due comportamenti diversi sullo stesso post.
                        mediaKind === "youtube" ? post.video_url : post.link_url,
                      )

                if (result.success && result.postId) {
                  const suffix = result.publishedAs === "personal" ? " (profilo personale)" : ""
                  platformPostIds[`linkedin_${account.account_name}${suffix}`] = result.postId
                  console.log(`[v0] Published to LinkedIn ${account.account_name}: ${result.postId}`)
                } else {
                  errors.push(`LinkedIn (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
                }
              }
            } catch (err) {
              errors.push(`Errore pubblicazione ${platform} (${account.account_name}): ${err}`)
            }
          }
        }
      }

      // Aggiorna lo stato del post
      const hasPublished = Object.keys(platformPostIds).length > 0
      const attese = Object.keys(inElaborazione).length > 0
      // Stessa funzione della ripresa e della pubblicazione manuale.
      const decisoOra = decidiStatoPost({ qualcosaPubblicato: hasPublished, inAttesa: attese })
      await supabase
        .from("social_posts")
        .update({
          status: decisoOra.stato,
          // Solo cio' che e' uscito davvero ha una data di pubblicazione.
          published_at: hasPublished ? new Date().toISOString() : post.published_at,
          platform_post_ids: platformPostIds,
          // Prima attesa: qui l'istante di avvio nasce adesso.
          processing_state:
            decisoOra.stato === "processing"
              ? { instagram_containers: inElaborazione, avviato: avvioAttesa(null) }
              : {},
          error_message: errors.length > 0 ? errors.join("; ") : null,
        })
        .eq("id", post.id)

      results.push({
        postId: post.id,
        success: hasPublished,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    return NextResponse.json({
      message: `Pubblicati ${results.filter((r) => r.success).length}/${posts.length} post`,
      results,
    })
  } catch (error) {
    console.error("[v0] Error in publish-scheduled-posts cron:", error)
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}
