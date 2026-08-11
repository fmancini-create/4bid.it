import { generateAppSecretProof } from "./facebook"

const GRAPH = "https://graph.facebook.com/v18.0"

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
