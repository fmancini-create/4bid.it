/**
 * Instagram Publishing via Container API (Graph API v18.0)
 * 
 * Flow:
 * 1. POST /{ig-user-id}/media (image_url + caption) -> creation_id
 * 2. Poll GET /{creation_id}?fields=status_code until FINISHED
 * 3. POST /{ig-user-id}/media_publish (creation_id) -> post_id
 * 
 * Prerequisite: Instagram Business/Creator account linked to Facebook Page.
 * Token must have instagram_basic + instagram_content_publish permissions.
 */

import { generateAppSecretProof } from "./facebook"

interface InstagramPublishResult {
  success: boolean
  postId?: string
  error?: string
}

const CONTAINER_POLL_INTERVAL = 2000 // 2 seconds
const CONTAINER_POLL_MAX_WAIT = 30000 // 30 seconds

/**
 * Create a media container on Instagram.
 */
async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  caption: string,
  imageUrl: string,
): Promise<{ containerId?: string; error?: string }> {
  try {
    const appSecretProof = generateAppSecretProof(accessToken)
    
    const params = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      },
    )

    const data = await response.json()
    console.log("[v0] Instagram: Create container response:", JSON.stringify(data))

    if (data.error) {
      return { error: data.error.message || JSON.stringify(data.error) }
    }

    if (!data.id) {
      return { error: "No container ID returned from Instagram" }
    }

    return { containerId: data.id }
  } catch (error) {
    return { error: `Container creation failed: ${String(error)}` }
  }
}

/**
 * Poll the container status until it's FINISHED or times out.
 */
async function waitForContainer(
  containerId: string,
  accessToken: string,
): Promise<{ ready: boolean; error?: string }> {
  const appSecretProof = generateAppSecretProof(accessToken)
  const startTime = Date.now()

  while (Date.now() - startTime < CONTAINER_POLL_MAX_WAIT) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
      )
      const data = await response.json()
      console.log("[v0] Instagram: Container status:", data.status_code)

      if (data.status_code === "FINISHED") {
        return { ready: true }
      }

      if (data.status_code === "ERROR") {
        return { ready: false, error: "Container processing failed (status: ERROR)" }
      }

      // IN_PROGRESS or other - wait and retry
      await new Promise(resolve => setTimeout(resolve, CONTAINER_POLL_INTERVAL))
    } catch (error) {
      return { ready: false, error: `Container poll failed: ${String(error)}` }
    }
  }

  return { ready: false, error: `Container not ready after ${CONTAINER_POLL_MAX_WAIT / 1000}s timeout` }
}

/**
 * Publish a ready container to Instagram.
 */
async function publishContainer(
  igUserId: string,
  accessToken: string,
  containerId: string,
): Promise<{ postId?: string; error?: string }> {
  try {
    const appSecretProof = generateAppSecretProof(accessToken)

    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
      appsecret_proof: appSecretProof,
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      },
    )

    const data = await response.json()
    console.log("[v0] Instagram: Publish response:", JSON.stringify(data))

    if (data.error) {
      return { error: data.error.message || JSON.stringify(data.error) }
    }

    return { postId: data.id }
  } catch (error) {
    return { error: `Publish failed: ${String(error)}` }
  }
}

/**
 * Publish a photo post to Instagram.
 * Requires an image URL (Instagram does not support text-only posts).
 * 
 * @param igUserId - Instagram Business Account ID (from social_accounts.account_id)
 * @param accessToken - Facebook Page access token with IG permissions
 * @param caption - Post text/caption
 * @param imageUrl - Public URL of the image to publish
 */
export async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  caption: string,
  imageUrl: string,
): Promise<InstagramPublishResult> {
  try {
    console.log("[v0] Instagram: Starting publish to account:", igUserId)

    if (!igUserId) {
      return { success: false, error: "Instagram User ID mancante" }
    }

    if (!accessToken) {
      return { success: false, error: "Access token mancante" }
    }

    if (!imageUrl) {
      return { success: false, error: "Instagram richiede un'immagine per ogni post" }
    }

    // Step 1: Create container
    const { containerId, error: containerError } = await createMediaContainer(
      igUserId,
      accessToken,
      caption,
      imageUrl,
    )

    if (containerError || !containerId) {
      return { success: false, error: containerError || "Container creation returned no ID" }
    }

    console.log("[v0] Instagram: Container created:", containerId)

    // Step 2: Wait for container to be ready
    const { ready, error: waitError } = await waitForContainer(containerId, accessToken)

    if (!ready) {
      return { success: false, error: waitError || "Container not ready" }
    }

    // Step 3: Publish the container
    const { postId, error: publishError } = await publishContainer(igUserId, accessToken, containerId)

    if (publishError || !postId) {
      return { success: false, error: publishError || "Publish returned no post ID" }
    }

    console.log("[v0] Instagram: Successfully published! Post ID:", postId)
    return { success: true, postId }
  } catch (error) {
    console.error("[v0] Instagram publish error:", error)
    return { success: false, error: String(error) }
  }
}
