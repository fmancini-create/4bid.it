// LinkedIn API helper functions

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
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
