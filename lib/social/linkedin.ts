// LinkedIn API helper functions

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

export async function publishToLinkedIn(
  accessToken: string,
  personUrn: string,
  content: string,
  imageUrl?: string,
): Promise<LinkedInPostResult> {
  try {
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

    console.log("[v0] LinkedIn: Publishing post with body:", JSON.stringify(postBody, null, 2))

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
        errorMessage = errorData.message || errorMessage
      } catch {}
      return {
        success: false,
        error: errorMessage,
      }
    }

    const data = JSON.parse(responseText)
    return {
      success: true,
      postId: data.id,
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] LinkedIn Organization API error:", errorData)
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      postId: data.id,
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
  const orgResult = await publishToLinkedInOrganization(accessToken, organizationId, content, imageUrl)

  if (orgResult.success) {
    return { ...orgResult, publishedAs: "organization" }
  }

  // Se errore 403 (ACCESS_DENIED), prova con il profilo personale
  if (orgResult.error?.includes("403") || orgResult.error?.includes("ACCESS_DENIED")) {
    console.log("[v0] LinkedIn: Organization access denied, falling back to personal profile")
    const personalResult = await publishToLinkedIn(accessToken, personUrn, content, imageUrl)
    return { ...personalResult, publishedAs: "personal" }
  }

  return orgResult
}
