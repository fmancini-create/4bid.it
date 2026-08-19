import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { publishToFacebook, publishVideoToFacebook } from "@/lib/social/facebook"
import { publishToInstagram, publishReelToInstagram } from "@/lib/social/instagram"
import { publishToLinkedInWithFallback, publishVideoToLinkedIn, refreshLinkedInToken } from "@/lib/social/linkedin"
import { canPublish, resolveMediaKind, youtubeThumbnail } from "@/lib/social/video"

// Un Reel Instagram o un caricamento LinkedIn richiedono tempo: la richiesta
// deve poter durare piu' dei 10s di default.
export const maxDuration = 300

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // Recupera il post
    const { data: post, error: fetchError } = await supabase.from("social_posts").select("*").eq("id", id).single()

    if (fetchError || !post) {
      console.error("[v0] Post not found:", fetchError)
      return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
    }

    console.log("[v0] Publishing post:", {
      id,
      content: post.content?.substring(0, 50),
      platforms: post.platforms,
      media_priority: post.media_priority,
    })

    // Recupera gli account attivi
    const { data: accounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("is_active", true)

    if (accountsError) {
      console.error("[v0] Error fetching accounts:", accountsError)
    }

    console.log(
      "[v0] Active accounts:",
      accounts?.map((a) => ({ platform: a.platform, name: a.account_name, page_id: a.page_id })),
    )

    let platformsToPublish = post.platforms || []
    if (!platformsToPublish || platformsToPublish.length === 0) {
      const uniquePlatforms = [...new Set(accounts?.map((a) => a.platform) || [])]
      platformsToPublish = uniquePlatforms
    }

    console.log("[v0] Platforms to publish:", platformsToPublish)

    if (platformsToPublish.length === 0) {
      return NextResponse.json({ error: "Nessuna piattaforma configurata" }, { status: 400 })
    }

    const platformPostIds: Record<string, string> = {}
    const errors: string[] = []
    // Un solo punto decide il tipo di media, poi tutte le piattaforme lo ricevono.
    const mediaKind = resolveMediaKind({ videoUrl: post.video_url, imageUrl: post.image_url })
    // Reel rimasti in elaborazione: li conserviamo per far riprendere il cron.
    const inElaborazione: Record<string, string> = {}
    console.log("[v0] Media del post:", { mediaKind, video: post.video_url, immagine: post.image_url })

    // Pubblica su ogni piattaforma
    for (const platform of platformsToPublish) {
      let platformAccounts = accounts?.filter((a) => a.platform === platform) || []

      // Se il post ha pagine di destinazione esplicite, esse sono una ALLOWLIST
      // autorevole su TUTTE le piattaforme: si pubblica SOLO sulle pagine indicate.
      // Se per questa piattaforma non c'è nessuna pagina target, NON si pubblica
      // nulla su quella piattaforma (prima invece veniva spammata a tutti gli
      // account: es. un post Santaddeo finiva sull'Instagram non correlato).
      if (post.target_accounts && post.target_accounts.length > 0) {
        platformAccounts = platformAccounts.filter(
          (a) =>
            post.target_accounts.includes(a.id) ||
            post.target_accounts.includes(a.account_id) ||
            post.target_accounts.includes(a.page_id),
        )
        console.log(
          `[v0] ${platform} target_accounts filter (strict): ${post.target_accounts.length} targets, ${platformAccounts.length} matched`,
        )
        if (platformAccounts.length === 0) {
          // Piattaforma selezionata ma senza destinazione: segnalo (niente skip muto).
          console.log(`[v0] ${platform}: nessuna pagina di destinazione selezionata.`)
          errors.push(`${platform}: nessuna destinazione selezionata, post non pubblicato su questa piattaforma`)
          continue
        }
      }

      console.log(`[v0] Publishing to ${platform}, accounts:`, platformAccounts.length)

      if (platformAccounts.length === 0) {
        errors.push(`Account ${platform} non configurato`)
        continue
      }

      for (const account of platformAccounts) {
        try {
          console.log(`[v0] Publishing to ${platform} account:`, account.account_name)

          if (platform === "facebook") {
            // Un video con FILE va sull'endpoint /videos: percorso separato, quindi
            // il comportamento di foto e link resta identico a prima.
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
                    // Un video YouTube esce come anteprima del link: il link del
                    // video vince su link_url, altrimenti il video non si vedrebbe.
                    mediaKind === "youtube" ? post.video_url : post.link_url,
                    post.image_url,
                    mediaKind === "youtube" ? "link" : post.media_priority || "image",
                  )

            console.log(`[v0] Facebook result:`, result)

            if (result.success && result.postId) {
              platformPostIds[`facebook_${account.account_name}`] = result.postId
            } else {
              errors.push(`Facebook (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
            }
          } else if (platform === "instagram") {
            // Instagram non accetta i link YouTube: lo diciamo con un messaggio
            // chiaro invece di lasciare che l'API risponda con un errore tecnico.
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
                    post.image_url, // copertina, se presente
                  )
                : await publishToInstagram(
                    account.account_id, // IG Business Account ID
                    account.access_token,
                    post.content,
                    post.image_url,
                    post.link_url,
                  )

            console.log(`[v0] Instagram result:`, result)

            if (result.success && result.postId) {
              platformPostIds[`instagram_${account.account_name}`] = result.postId
            } else if ("pending" in result && result.pending) {
              // Il Reel e' caricato su Meta ma ancora in lavorazione. Conserviamo
              // l'id del container: senza questo, il video caricato andrebbe perso
              // e l'operatore vedrebbe solo un errore.
              inElaborazione[account.id] = result.pending.creationId
              console.log("[v0] Instagram Reel in elaborazione, container:", result.pending.creationId)
            } else {
              errors.push(`Instagram (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
            }
          } else if (platform === "linkedin") {
            // Auto-rinnovo: il token LinkedIn dura ~60 giorni. Se e' scaduto (o
            // scade entro 24h) e abbiamo un refresh_token, lo rinnoviamo e
            // aggiorniamo il DB PRIMA di pubblicare, cosi' la pubblicazione non
            // fallisce con EXPIRED_ACCESS_TOKEN. Senza refresh_token si procede
            // col token attuale: se scaduto, l'errore chiedera' di riconnettere.
            let linkedinToken = account.access_token
            const expMs = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0
            const expiringSoon = !expMs || expMs - Date.now() < 24 * 60 * 60 * 1000
            if (expiringSoon && account.refresh_token) {
              console.log("[v0] LinkedIn token scaduto/in scadenza: tentativo di refresh")
              const refreshed = await refreshLinkedInToken(account.refresh_token)
              if (refreshed.success && refreshed.accessToken) {
                linkedinToken = refreshed.accessToken
                await supabase
                  .from("social_accounts")
                  .update({
                    access_token: refreshed.accessToken,
                    refresh_token: refreshed.refreshToken || account.refresh_token,
                    token_expires_at: new Date(Date.now() + (refreshed.expiresIn || 0) * 1000).toISOString(),
                  })
                  .eq("id", account.id)
                console.log("[v0] LinkedIn token rinnovato con successo")
              } else {
                console.log("[v0] LinkedIn refresh fallito:", refreshed.error)
              }
            }

            const result =
              mediaKind === "video"
                ? await publishVideoToLinkedIn(
                    linkedinToken,
                    account.account_id,
                    post.content,
                    post.video_url,
                    post.title,
                  )
                : await publishToLinkedInWithFallback(
                    linkedinToken,
                    account.account_id, // Organization ID (110665381)
                    account.page_id, // Person URN (salvato come page_id per LinkedIn)
                    post.content,
                    // Un video YouTube esce come articolo: il suo link ha la
                    // precedenza, altrimenti il video non comparirebbe.
                    mediaKind === "youtube" ? post.video_url : post.link_url,
                  )

            console.log(`[v0] LinkedIn result:`, result)

            if (result.success && result.postId) {
              const suffix = result.publishedAs === "personal" ? " (profilo personale)" : ""
              platformPostIds[`linkedin_${account.account_name}${suffix}`] = result.postId
            } else {
              errors.push(`LinkedIn (${account.account_name}): ${result.error || "Errore sconosciuto"}`)
            }
          }
        } catch (err) {
          console.error(`[v0] Error publishing to ${platform}:`, err)
          errors.push(`Errore pubblicazione ${platform} (${account.account_name}): ${err}`)
        }
      }
    }

    // Aggiorna lo stato del post
    const hasPublished = Object.keys(platformPostIds).length > 0
    const attese = Object.keys(inElaborazione).length > 0
    console.log("[v0] Publish result:", { hasPublished, attese, platformPostIds, errors })

    // Tre esiti, non due. Un Reel ancora in lavorazione su Meta NON e' un
    // fallimento: marcarlo "failed" farebbe ripubblicare il video da zero (o lo
    // farebbe abbandonare), mentre il container e' vivo e va solo ripreso.
    const nuovoStato = attese ? "processing" : hasPublished ? "published" : "failed"

    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status: nuovoStato,
        // La data di pubblicazione si scrive solo quando qualcosa e' uscito
        // davvero: un post in elaborazione non ha ancora una data.
        published_at: hasPublished ? new Date().toISOString() : post.published_at,
        platform_post_ids: platformPostIds,
        processing_state: attese ? { instagram_containers: inElaborazione, avviato: new Date().toISOString() } : {},
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: hasPublished,
      post: data,
      published: Object.keys(platformPostIds),
      errors,
    })
  } catch (error) {
    console.error("[v0] Error publishing post:", error)
    return NextResponse.json({ error: "Errore nella pubblicazione" }, { status: 500 })
  }
}
