// LinkedIn API helper functions
// Usa UGC Posts API v2

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

// Pubblica su profilo personale usando UGC Posts API v2
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

    console.log("[v0] LinkedIn: Publishing post to personal profile")
    console.log("[v0] LinkedIn: Author URN:", authorUrn)

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
    console.log("[v0] LinkedIn UGC API response status:", response.status)
    console.log("[v0] LinkedIn UGC API response:", responseText)

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

export async function publishToLinkedInOrganization(
  accessToken: string,
  organizationId: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
    const authorUrn = organizationId.startsWith("urn:li:organization:")
      ? organizationId
      : `urn:li:organization:${organizationId}`

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

    console.log("[v0] LinkedIn: Publishing to organization:", organizationId)
    console.log("[v0] LinkedIn: Author URN:", authorUrn)

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
    console.log("[v0] LinkedIn Organization UGC API response status:", response.status)
    console.log("[v0] LinkedIn Organization UGC API response:", responseText)

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

// Lo scope w_organization_social non è ancora approvato
export async function publishToLinkedInWithFallback(
  accessToken: string,
  organizationId: string,
  personUrn: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult & { publishedAs?: "organization" | "personal" }> {
  // Pubblica direttamente sul profilo personale
  // (w_organization_social non è ancora approvato per questa app)
  if (!personUrn) {
    return {
      success: false,
      error: "Nessun profilo personale configurato. Riconnetti l'account LinkedIn.",
    }
  }

  console.log("[v0] LinkedIn: Publishing to personal profile, URN:", personUrn)
  const personalResult = await publishToLinkedIn(accessToken, personUrn, content, imageUrl)
  return { ...personalResult, publishedAs: "personal" }
}
