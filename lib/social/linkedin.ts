// LinkedIn API helper functions
// Usa le Shares API v2 per profilo personale (w_member_social)
// Le UGC API sono deprecate dal 2024

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

// Pubblica su profilo personale usando Shares API (non deprecata)
export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    // Usa le Shares API v2 che funzionano con w_member_social
    const postBody = {
      owner: `urn:li:person:${personUrn}`,
      text: {
        text: content,
      },
      distribution: {
        linkedInDistributionTarget: {},
      },
    }

    console.log("[v0] LinkedIn: Publishing post to personal profile using Shares API")
    console.log("[v0] LinkedIn: Person URN:", personUrn)
    console.log("[v0] LinkedIn: Request body:", JSON.stringify(postBody, null, 2))

    const response = await fetch("https://api.linkedin.com/v2/shares", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    console.log("[v0] LinkedIn Shares API response status:", response.status)
    console.log("[v0] LinkedIn Shares API response:", responseText)

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

    let postId = "published"
    try {
      const data = JSON.parse(responseText)
      postId = data.id || data.activity || postId
    } catch {}

    return {
      success: true,
      postId,
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
// NOTA: Richiede scope w_organization_social (Community Management API)
export async function publishToLinkedInOrganization(
  accessToken: string,
  organizationId: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    // Usa le Shares API anche per organization
    const postBody = {
      owner: `urn:li:organization:${organizationId}`,
      text: {
        text: content,
      },
      distribution: {
        linkedInDistributionTarget: {},
      },
    }

    console.log("[v0] LinkedIn: Publishing to organization:", organizationId)

    const response = await fetch("https://api.linkedin.com/v2/shares", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    console.log("[v0] LinkedIn Organization Shares API response status:", response.status)
    console.log("[v0] LinkedIn Organization Shares API response:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error_description || errorData.error || JSON.stringify(errorData)
      } catch {}
      console.error("[v0] LinkedIn Organization Shares API error:", errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }

    let postId = "published"
    try {
      const data = JSON.parse(responseText)
      postId = data.id || data.activity || postId
    } catch {}

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
  imageUrl?: string,
): Promise<LinkedInPostResult & { publishedAs?: "organization" | "personal" }> {
  // Finché non abbiamo w_organization_social, non provare nemmeno con organization
  console.log("[v0] LinkedIn: Publishing to personal profile (organization requires w_organization_social scope)")
  console.log("[v0] LinkedIn: Person URN:", personUrn)

  if (!personUrn) {
    return {
      success: false,
      error: "Nessun profilo personale configurato. Riconnetti l'account LinkedIn.",
    }
  }

  const personalResult = await publishToLinkedIn(accessToken, personUrn, content, imageUrl)
  return { ...personalResult, publishedAs: "personal" }
}
