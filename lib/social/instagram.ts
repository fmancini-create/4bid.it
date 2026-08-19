import { generateAppSecretProof } from "./facebook"

const GRAPH = "https://graph.facebook.com/v18.0"

/**
 * Esito di una pubblicazione Instagram.
 *
 * `pending` e' il campo che rende possibile non perdere un Reel: quando Meta sta
 * ancora elaborando il video, l'id del container viaggia qui fino al database.
 * E' dichiarato nel tipo COMUNE (anche per le foto, dove resta assente) perche'
 * i chiamanti scelgono fra foto e Reel con un ternario: se solo una delle due
 * firme lo avesse, il tipo unito lo perderebbe e il container sarebbe
 * irraggiungibile.
 */
export interface InstagramPublishResult {
  success: boolean
  postId?: string
  error?: string
  pending?: { creationId: string }
}

/**
 * Pubblica un VIDEO su Instagram come REEL.
 *
 * Instagram non ha un "video normale" nel feed via API: il formato per i video
 * e' REELS. Il flusso e' a due passi come per le foto, ma con una differenza che
 * cambia l'architettura: l'elaborazione del video da parte di Meta puo' durare
 * MINUTI, non secondi.
 *
 * Per questo la funzione NON aspetta fino alla fine. Attende un poco e, se il
 * video e' ancora in lavorazione, restituisce `pending` con l'id del container.
 * Il chiamante lo salva in `processing_state` e il cron riprende da li'. Se
 * avessimo aspettato in linea, la richiesta HTTP sarebbe scaduta e il video
 * caricato su Meta sarebbe stato perso: un Reel pagato in banda e mai pubblicato.
 */
export async function publishReelToInstagram(
  igUserId: string,
  accessToken: string,
  content: string,
  videoUrl: string,
  linkUrl?: string | null,
  coverUrl?: string | null,
): Promise<{ success: boolean; postId?: string; error?: string; pending?: { creationId: string } }> {
  try {
    if (!igUserId) return { success: false, error: "Instagram account ID mancante" }
    if (!accessToken) return { success: false, error: "Instagram access token mancante" }
    if (!videoUrl) return { success: false, error: "Instagram richiede il file video per pubblicare un Reel" }

    const caption = linkUrl ? `${content}\n\n${linkUrl}` : content
    const appSecretProof = generateAppSecretProof(accessToken)

    const params: Record<string, string> = {
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    }
    // La copertina e' opzionale: se manca, Instagram estrae un fotogramma.
    if (coverUrl) params.cover_url = coverUrl

    const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    })
    const createData = await createRes.json()
    console.log("[v0] Instagram REEL create container response:", JSON.stringify(createData))

    if (createData.error || !createData.id) {
      const raw = createData.error?.message || ""
      const needsReconnect =
        /permission|OAuth|access token|impersonat|instagram_content_publish|not.*linked|business/i.test(raw)
      return {
        success: false,
        error: needsReconnect
          ? "Instagram non è collegato correttamente. Riconnetti un account Instagram Business/Creator abbinato a una Pagina Facebook, concedendo i permessi di pubblicazione."
          : raw || "Creazione Reel Instagram non riuscita",
      }
    }

    const creationId: string = createData.id
    const stato = await attendiContainer(creationId, accessToken, appSecretProof, 6)

    if (stato === "ERROR") {
      return { success: false, error: "Elaborazione del video da parte di Instagram fallita" }
    }
    if (stato !== "FINISHED") {
      // Ancora in lavorazione: consegniamo il container al chiamante.
      return { success: false, pending: { creationId }, error: "Video ancora in elaborazione su Instagram" }
    }

    return await pubblicaContainerInstagram(igUserId, accessToken, creationId)
  } catch (error) {
    console.error("[v0] Instagram Reel publish error:", error)
    return { success: false, error: String(error) }
  }
}

/** Interroga lo stato del container. Ritorna l'ultimo status_code visto. */
async function attendiContainer(
  creationId: string,
  accessToken: string,
  appSecretProof: string,
  tentativi: number,
): Promise<string> {
  let ultimo = "IN_PROGRESS"
  for (let attempt = 0; attempt < tentativi; attempt++) {
    const statusRes = await fetch(
      `${GRAPH}/${creationId}?fields=status_code&access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
    )
    const statusData = await statusRes.json()
    ultimo = statusData.status_code || ultimo
    console.log(`[v0] Instagram container status (try ${attempt + 1}):`, JSON.stringify(statusData))
    if (ultimo === "FINISHED" || ultimo === "ERROR") return ultimo
    await new Promise((r) => setTimeout(r, 5000))
  }
  return ultimo
}

/**
 * Pubblica un container Instagram gia' pronto.
 * Usata sia dal percorso diretto sia dal cron che riprende un Reel rimasto in
 * elaborazione: cosi' la logica di pubblicazione esiste in un solo punto.
 */
export async function pubblicaContainerInstagram(
  igUserId: string,
  accessToken: string,
  creationId: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const appSecretProof = generateAppSecretProof(accessToken)
  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    }),
  })
  const publishData = await publishRes.json()
  console.log("[v0] Instagram publish response:", JSON.stringify(publishData))
  if (publishData.error || !publishData.id) {
    return { success: false, error: publishData.error?.message || "Pubblicazione Instagram non riuscita" }
  }
  return { success: true, postId: publishData.id }
}

/**
 * Verifica lo stato di un container e, se pronto, lo pubblica.
 * Chiamata dal cron per i post lasciati in stato "processing".
 */
export async function riprendiReelInstagram(
  igUserId: string,
  accessToken: string,
  creationId: string,
): Promise<{ success: boolean; postId?: string; error?: string; ancoraInCorso?: boolean }> {
  const appSecretProof = generateAppSecretProof(accessToken)
  const statusRes = await fetch(
    `${GRAPH}/${creationId}?fields=status_code&access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
  )
  const statusData = await statusRes.json()
  const stato = statusData.status_code
  console.log("[v0] Instagram ripresa container:", creationId, JSON.stringify(statusData))

  if (stato === "ERROR") return { success: false, error: "Elaborazione del video su Instagram fallita" }
  if (stato !== "FINISHED") return { success: false, ancoraInCorso: true, error: "Video ancora in elaborazione" }
  return await pubblicaContainerInstagram(igUserId, accessToken, creationId)
}

// Pubblica un post su un account Instagram Business/Creator via Graph API.
// Flusso ufficiale a due passi:
//   1) crea un "media container" con image_url + caption
//   2) pubblica il container (media_publish)
// Instagram RICHIEDE sempre un'immagine: senza image_url non si pubblica.
export async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  content: string,
  imageUrl?: string | null,
  linkUrl?: string | null,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!igUserId) return { success: false, error: "Instagram account ID mancante" }
    if (!accessToken) return { success: false, error: "Instagram access token mancante" }
    if (!imageUrl) return { success: false, error: "Instagram richiede un'immagine per pubblicare" }

    // Instagram non rende cliccabili i link in didascalia: lo aggiungiamo come testo.
    const caption = linkUrl ? `${content}\n\n${linkUrl}` : content
    const appSecretProof = generateAppSecretProof(accessToken)

    // 1) Crea il media container
    const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
        appsecret_proof: appSecretProof,
      }),
    })
    const createData = await createRes.json()
    console.log("[v0] Instagram create container response:", JSON.stringify(createData))

    if (createData.error || !createData.id) {
      const raw = createData.error?.message || ""
      // Errori tipici di connessione mal configurata: permessi pagina mancanti,
      // token scaduto, o account non Business collegato a una Pagina Facebook.
      const needsReconnect =
        /permission|OAuth|access token|impersonat|instagram_content_publish|not.*linked|business/i.test(raw)
      return {
        success: false,
        error: needsReconnect
          ? "Instagram non è collegato correttamente. Riconnetti un account Instagram Business/Creator abbinato a una Pagina Facebook, concedendo i permessi di pubblicazione."
          : raw || "Creazione media Instagram non riuscita",
      }
    }

    const creationId: string = createData.id

    // 2) Attendi che il container sia pronto (per le immagini è quasi immediato).
    //    Facciamo alcuni tentativi controllando status_code = FINISHED.
    for (let attempt = 0; attempt < 5; attempt++) {
      const statusRes = await fetch(
        `${GRAPH}/${creationId}?fields=status_code&access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
      )
      const statusData = await statusRes.json()
      console.log(`[v0] Instagram container status (try ${attempt + 1}):`, JSON.stringify(statusData))
      if (statusData.status_code === "FINISHED") break
      if (statusData.status_code === "ERROR") {
        return { success: false, error: "Elaborazione media Instagram fallita" }
      }
      await new Promise((r) => setTimeout(r, 2000))
    }

    // 3) Pubblica il container
    const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
        appsecret_proof: appSecretProof,
      }),
    })
    const publishData = await publishRes.json()
    console.log("[v0] Instagram publish response:", JSON.stringify(publishData))

    if (publishData.error || !publishData.id) {
      return { success: false, error: publishData.error?.message || "Pubblicazione Instagram non riuscita" }
    }

    return { success: true, postId: publishData.id }
  } catch (error) {
    console.error("[v0] Instagram publish error:", error)
    return { success: false, error: String(error) }
  }
}
