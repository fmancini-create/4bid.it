// LinkedIn API helper functions

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
  /**
   * Presente solo quando si passa da publishToLinkedInWithFallback. Dichiarato
   * qui (opzionale) perche' i chiamanti scelgono fra video e link con un
   * ternario: senza questo campo nel tipo comune, il risultato unito perderebbe
   * l'informazione e il codice non compilerebbe.
   */
  publishedAs?: "organization" | "personal"
}

interface LinkedInRefreshResult {
  success: boolean
  accessToken?: string
  expiresIn?: number // secondi
  refreshToken?: string
  error?: string
}

/**
 * Rinnova l'access token LinkedIn usando il refresh_token.
 * Funziona SOLO se l'app LinkedIn ha abilitato i "programmatic refresh tokens"
 * e se il refresh_token e' stato salvato in fase di connessione. In caso
 * contrario l'unica via e' riconnettere l'account manualmente (OAuth).
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<LinkedInRefreshResult> {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return { success: false, error: "LINKEDIN_CLIENT_ID/SECRET mancanti" }
    }

    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const text = await response.text()
    console.log("[v0] LinkedIn refresh status:", response.status)
    if (!response.ok) {
      let msg = `HTTP ${response.status}`
      try {
        const j = JSON.parse(text)
        msg = j.error_description || j.error || msg
      } catch {}
      return { success: false, error: msg }
    }

    const data = JSON.parse(text)
    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      // LinkedIn ruota anche il refresh_token: se ne arriva uno nuovo va salvato.
      refreshToken: data.refresh_token || refreshToken,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Errore sconosciuto" }
  }
}

export async function publishToLinkedInOrganization(
  accessToken: string,
  organizationId: string,
  content: string,
  linkUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    const authorUrn = organizationId.startsWith("urn:li:organization:")
      ? organizationId
      : `urn:li:organization:${organizationId}`

    // Posts API payload per Community Management API
    const postBody: Record<string, unknown> = {
      author: authorUrn,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    }

    // Aggiungi link se presente
    if (linkUrl) {
      postBody.content = {
        article: {
          source: linkUrl,
          title: content.substring(0, 100),
        },
      }
    }

    console.log("[v0] LinkedIn: Publishing to organization via Posts API")
    console.log("[v0] LinkedIn: Author URN:", authorUrn)
    console.log("[v0] LinkedIn: Post body:", JSON.stringify(postBody, null, 2))

    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202604",
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    console.log("[v0] LinkedIn Posts API response status:", response.status)
    console.log("[v0] LinkedIn Posts API response:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error_description || errorData.error || JSON.stringify(errorData)
      } catch {}
      return {
        success: false,
        error: errorMessage,
      }
    }

    // Il post ID è nell'header x-restli-id
    const postId = response.headers.get("x-restli-id") || "published"

    return {
      success: true,
      postId,
    }
  } catch (error) {
    console.error("[v0] LinkedIn Organization publish error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    }
  }
}

/**
 * Pubblica un VIDEO nativo sulla pagina aziendale LinkedIn.
 *
 * LinkedIn non accetta un URL da cui scaricare: pretende i BYTE del file. Tre
 * passaggi obbligati:
 *   1) initializeUpload -> LinkedIn restituisce un URL di caricamento e un URN
 *   2) PUT dei byte     -> il file viene inviato a quell'URL
 *   3) POST /rest/posts -> si crea il post che referenzia l'URN del video
 *
 * Il passo 2 e' la ragione del limite di dimensione dichiarato in lib/social/video.ts:
 * il file transita dal nostro server, quindi finisce in memoria.
 */
export async function publishVideoToLinkedIn(
  accessToken: string,
  organizationId: string,
  content: string,
  videoUrl: string,
  titolo?: string,
): Promise<LinkedInPostResult> {
  try {
    const authorUrn = organizationId.startsWith("urn:li:organization:")
      ? organizationId
      : `urn:li:organization:${organizationId}`

    // Scarica il file da pubblicare (dal nostro blob).
    const fileRes = await fetch(videoUrl)
    if (!fileRes.ok) {
      return { success: false, error: `Video non raggiungibile (HTTP ${fileRes.status})` }
    }
    const bytes = new Uint8Array(await fileRes.arrayBuffer())
    if (bytes.byteLength === 0) {
      return { success: false, error: "Il file video è vuoto" }
    }
    console.log("[v0] LinkedIn: video da caricare, byte:", bytes.byteLength)

    // 1) Registra il caricamento
    const initRes = await fetch("https://api.linkedin.com/rest/videos?action=initializeUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202604",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: authorUrn,
          fileSizeBytes: bytes.byteLength,
          uploadCaptions: false,
          uploadThumbnail: false,
        },
      }),
    })
    const initText = await initRes.text()
    console.log("[v0] LinkedIn initializeUpload status:", initRes.status)
    if (!initRes.ok) {
      let msg = `HTTP ${initRes.status}`
      try {
        const j = JSON.parse(initText)
        msg = j.message || j.error_description || msg
      } catch {}
      return { success: false, error: `Registrazione caricamento video non riuscita: ${msg}` }
    }

    const initData = JSON.parse(initText)
    const valore = initData.value || {}
    const videoUrn: string | undefined = valore.video
    // LinkedIn puo' restituire un solo URL o una lista di parti da caricare.
    const istruzioni: Array<{ uploadUrl: string; firstByte?: number; lastByte?: number }> =
      valore.uploadInstructions || (valore.uploadUrl ? [{ uploadUrl: valore.uploadUrl }] : [])

    if (!videoUrn || istruzioni.length === 0) {
      return { success: false, error: "LinkedIn non ha restituito le istruzioni di caricamento" }
    }

    // 2) Invia i byte. Con piu' parti, ognuna riceve la propria fetta.
    const etags: string[] = []
    for (const [i, istr] of istruzioni.entries()) {
      const da = istr.firstByte ?? 0
      const a = istr.lastByte !== undefined ? istr.lastByte + 1 : bytes.byteLength
      const fetta = istruzioni.length === 1 ? bytes : bytes.slice(da, a)
      const putRes = await fetch(istr.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: fetta,
      })
      console.log(`[v0] LinkedIn upload parte ${i + 1}/${istruzioni.length} status:`, putRes.status)
      if (!putRes.ok) {
        return { success: false, error: `Caricamento video non riuscito (parte ${i + 1}, HTTP ${putRes.status})` }
      }
      const etag = putRes.headers.get("etag")
      if (etag) etags.push(etag)
    }

    // Con caricamento a piu' parti va finalizzato, altrimenti il video resta
    // incompleto e il post fallirebbe senza spiegazione.
    if (istruzioni.length > 1) {
      const finRes = await fetch("https://api.linkedin.com/rest/videos?action=finalizeUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202604",
        },
        body: JSON.stringify({
          finalizeUploadRequest: { video: videoUrn, uploadToken: "", uploadedPartIds: etags },
        }),
      })
      console.log("[v0] LinkedIn finalizeUpload status:", finRes.status)
      if (!finRes.ok) {
        return { success: false, error: `Finalizzazione video non riuscita (HTTP ${finRes.status})` }
      }
    }

    // 3) Crea il post che referenzia il video
    const postBody: Record<string, unknown> = {
      author: authorUrn,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          id: videoUrn,
          title: (titolo || content).substring(0, 100),
        },
      },
      lifecycleState: "PUBLISHED",
    }

    const postRes = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202604",
      },
      body: JSON.stringify(postBody),
    })
    const postText = await postRes.text()
    console.log("[v0] LinkedIn video post status:", postRes.status, postText.slice(0, 300))
    if (!postRes.ok) {
      let msg = `HTTP ${postRes.status}`
      try {
        const j = JSON.parse(postText)
        msg = j.message || j.error_description || msg
      } catch {}
      return { success: false, error: msg }
    }

    return { success: true, postId: postRes.headers.get("x-restli-id") || "published" }
  } catch (error) {
    console.error("[v0] LinkedIn video publish error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Errore sconosciuto" }
  }
}

export async function publishToLinkedInWithFallback(
  accessToken: string,
  organizationId: string,
  personUrn: string,
  content: string,
  linkUrl?: string,
): Promise<LinkedInPostResult & { publishedAs?: "organization" | "personal" }> {
  // Con Community Management API, pubblica sulla pagina aziendale
  if (!organizationId) {
    return {
      success: false,
      error: "Nessuna pagina aziendale configurata. Riconnetti l'account LinkedIn.",
    }
  }

  console.log("[v0] LinkedIn: Publishing to organization page:", organizationId)
  const result = await publishToLinkedInOrganization(accessToken, organizationId, content, linkUrl)
  return { ...result, publishedAs: "organization" }
}

// Mantieni anche la funzione per profilo personale (non usata con Community Management API)
export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    const authorUrn = personUrn.startsWith("urn:li:person:") ? personUrn : `urn:li:person:${personUrn}`

    const postBody = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error_description || errorData.error || JSON.stringify(errorData)
      } catch {}
      return { success: false, error: errorMessage }
    }

    let postId = "published"
    try {
      const data = JSON.parse(responseText)
      postId = data.id || postId
    } catch {}

    return { success: true, postId }
  } catch (error) {
    console.error("[v0] LinkedIn publish error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Errore sconosciuto" }
  }
}
