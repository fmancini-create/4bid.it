// LinkedIn API helper functions

interface LinkedInPostResult {
  success: boolean
  postId?: string
  error?: string
}

async function uploadImageToLinkedIn(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    // Step 1: Initialize upload
    console.log("[v0] LinkedIn: Initializing image upload for owner:", ownerUrn)
    const initResponse = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202411",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: ownerUrn,
        },
      }),
    })

    if (!initResponse.ok) {
      const errText = await initResponse.text()
      console.error("[v0] LinkedIn image init failed:", initResponse.status, errText)
      return null
    }

    const initData = await initResponse.json()
    const uploadUrl = initData.value?.uploadUrl
    const imageUrn = initData.value?.image

    if (!uploadUrl || !imageUrn) {
      console.error("[v0] LinkedIn image init missing uploadUrl or image URN")
      return null
    }

    // Step 2: Download the image from fal URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error("[v0] LinkedIn: Failed to download image from:", imageUrl)
      return null
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    // Step 3: Upload the image binary to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    })

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text()
      console.error("[v0] LinkedIn image upload failed:", uploadResponse.status, errText)
      return null
    }

    console.log("[v0] LinkedIn: Image uploaded successfully, URN:", imageUrn)
    return imageUrn
  } catch (err) {
    console.error("[v0] LinkedIn image upload error:", err)
    return null
  }
}

export async function publishToLinkedInOrganization(
  accessToken: string,
  organizationId: string,
  content: string,
  linkUrl?: string,
  imageUrl?: string,
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

    // Priorita': immagine > link > solo testo
    if (imageUrl) {
      const imageUrn = await uploadImageToLinkedIn(accessToken, authorUrn, imageUrl)
      if (imageUrn) {
        postBody.content = {
          media: {
            id: imageUrn,
          },
        }
        console.log("[v0] LinkedIn: Post with image, URN:", imageUrn)
      } else if (linkUrl) {
        // Fallback: se l'upload immagine fallisce, usa il link
        postBody.content = {
          article: {
            source: linkUrl,
            title: content.substring(0, 100),
          },
        }
      }
    } else if (linkUrl) {
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
        "LinkedIn-Version": "202411",
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
  imageUrl?: string,
): Promise<LinkedInPostResult & { publishedAs?: "organization" | "personal" }> {
  // Con Community Management API, pubblica sulla pagina aziendale
  if (!organizationId) {
    return {
      success: false,
      error: "Nessuna pagina aziendale configurata. Riconnetti l'account LinkedIn.",
    }
  }

  console.log("[v0] LinkedIn: Publishing to organization page:", organizationId, imageUrl ? "(with image)" : "(text/link only)")
  const result = await publishToLinkedInOrganization(accessToken, organizationId, content, linkUrl, imageUrl)
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
