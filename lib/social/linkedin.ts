// LinkedIn API helper functions
// Usa le API v2 per profilo personale (w_member_social)

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

// Le nuove REST API richiedono scope w_organization_social non ancora approvato
export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    // Usa le API UGC v2 che funzionano con w_member_social
    const postBody = {
      author: `urn:li:person:${personUrn}`,
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

    console.log("[v0] LinkedIn: Publishing post to personal profile")
    console.log("[v0] LinkedIn: Person URN:", personUrn)

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
    console.log("[v0] LinkedIn API response status:", response.status)
    console.log("[v0] LinkedIn API response:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
      } catch {}
      return {
        success: false,
        error: errorMessage,
      }
    }

    let postId = "published"
    try {
      const data = JSON.parse(responseText)
      postId = data.id || postId
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
    // Usa le API UGC v2 anche per organization
    const postBody = {
      author: `urn:li:organization:${organizationId}`,
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

    console.log("[v0] LinkedIn: Publishing to organization:", organizationId)

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
    console.log("[v0] LinkedIn Organization API response status:", response.status)
    console.log("[v0] LinkedIn Organization API response:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
      } catch {}
      console.error("[v0] LinkedIn Organization API error:", errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }

    let postId = "published"
    try {
      const data = JSON.parse(responseText)
      postId = data.id || postId
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
