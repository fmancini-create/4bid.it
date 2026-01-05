// LinkedIn API helper functions
// Aggiornato alle nuove Community Management API (v2 REST)

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

const LINKEDIN_API_VERSION = "202401"

// Pubblica su profilo personale usando le nuove API
export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    const postBody = {
      author: `urn:li:person:${personUrn}`,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    }

    console.log("[v0] LinkedIn: Publishing post to personal profile with body:", JSON.stringify(postBody, null, 2))

    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": LINKEDIN_API_VERSION, // Header versione obbligatorio
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    console.log("[v0] LinkedIn API response status:", response.status)
    console.log("[v0] LinkedIn API response:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      return {
        success: false,
        error: errorMessage,
      }
    }

    const postId = response.headers.get("x-restli-id") || (responseText ? JSON.parse(responseText).id : null)

    return {
      success: true,
      postId: postId || "published",
    }
  } catch (error) {
    console.error("[v0] LinkedIn publish error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    }
  }
}

// Pubblica su una pagina aziendale LinkedIn (Organization)
export async function publishToLinkedInOrganization(
  accessToken: string,
  organizationId: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    const postBody = {
      author: `urn:li:organization:${organizationId}`,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    }

    console.log("[v0] LinkedIn: Publishing to organization:", organizationId)

    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    console.log("[v0] LinkedIn Organization API response status:", response.status)
    console.log("[v0] LinkedIn Organization API response:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {}
      console.error("[v0] LinkedIn Organization API error:", errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }

    const postId = response.headers.get("x-restli-id") || (responseText ? JSON.parse(responseText).id : null)

    return {
      success: true,
      postId: postId || "published",
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
  imageUrl?: string,
): Promise<LinkedInPostResult & { publishedAs?: "organization" | "personal" }> {
  // Prima prova con la pagina aziendale
  console.log("[v0] LinkedIn: Attempting to publish to organization:", organizationId)
  const orgResult = await publishToLinkedInOrganization(accessToken, organizationId, content, imageUrl)

  if (orgResult.success) {
    console.log("[v0] LinkedIn: Successfully published to organization")
    return { ...orgResult, publishedAs: "organization" }
  }

  // Se errore 403 (ACCESS_DENIED) o 401 o 400, prova con il profilo personale
  if (
    orgResult.error?.includes("403") ||
    orgResult.error?.includes("401") ||
    orgResult.error?.includes("ACCESS_DENIED") ||
    orgResult.error?.includes("Not enough permissions")
  ) {
    console.log("[v0] LinkedIn: Organization access denied, falling back to personal profile. Person URN:", personUrn)

    if (!personUrn) {
      return {
        success: false,
        error: "Impossibile pubblicare: nessun permesso sulla pagina aziendale e nessun profilo personale configurato",
      }
    }

    const personalResult = await publishToLinkedIn(accessToken, personUrn, content, imageUrl)
    return { ...personalResult, publishedAs: "personal" }
  }

  return orgResult
}
