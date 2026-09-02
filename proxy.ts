import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Rate limiting store (in-memory for edge runtime)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration per endpoint
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  "/api/contact": { requests: 5, windowMs: 60000 }, // 5 requests per minute
  "/api/ai-support": { requests: 20, windowMs: 60000 }, // 20 requests per minute
  "/api/investor-inquiries": { requests: 3, windowMs: 60000 }, // 3 requests per minute
  "/api/project-submissions": { requests: 3, windowMs: 60000 }, // 3 requests per minute
  "/api/social/generate-image": { requests: 10, windowMs: 60000 }, // 10 requests per minute
  "/api/social/generate-post": { requests: 10, windowMs: 60000 }, // 10 requests per minute
}

const ADMIN_API_ROUTES = ["/api/contacts/", "/api/admin/", "/api/social/posts", "/api/knowledge/"]

function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * A genuine browser Server Action POST is same-origin and carries an Origin
 * header. Automated scanners frequently spoof only Next-Action; letting those
 * requests reach Next.js makes the framework log "Failed to find Server Action".
 */
function isTrustedServerActionRequest(request: NextRequest): boolean {
  if (!request.headers.get("next-action")) return true
  if (request.method !== "POST") return false

  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    return new URL(origin).host === request.nextUrl.host
  } catch {
    return false
  }
}

/**
 * Paths inside /area-riservata that must stay reachable without a session,
 * otherwise a user could never sign in or accept an invitation.
 * `/area-riservata` itself is the public entry page.
 */
const PROJECT_ROOM_PUBLIC_PATHS = [
  "/area-riservata/login",
  "/area-riservata/richiedi-accesso",
  "/area-riservata/invito",
  "/area-riservata/auth",
  // A password reset is by definition requested by someone who cannot sign in,
  // so guarding this by session would bounce them to the login page forever.
  "/area-riservata/recupera-password",
]

function isProjectRoomPublicPath(pathname: string): boolean {
  if (pathname === "/area-riservata" || pathname === "/area-riservata/") return true
  return PROJECT_ROOM_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[endpoint]
  if (!config) return { allowed: true, remaining: 999, resetTime: 0 }

  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.requests - 1, resetTime: now + config.windowMs }
  }

  if (record.count >= config.requests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: config.requests - record.count, resetTime: record.resetTime }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Drop malformed/spoofed Server Action requests before the framework action
  // resolver sees them. This keeps scanner traffic out of production error logs
  // without affecting normal JSON/form POST endpoints.
  if (!isTrustedServerActionRequest(request)) {
    return new NextResponse(null, { status: 404 })
  }

  // Skip static files and internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    if (!isAdminApiRoute(pathname)) {
      const ip = getClientIP(request)

      // Find matching rate limit config
      const matchingEndpoint = Object.keys(RATE_LIMITS).find((ep) => pathname.startsWith(ep))

      if (matchingEndpoint) {
        const { allowed, remaining, resetTime } = checkRateLimit(ip, matchingEndpoint)

        if (!allowed) {
          return NextResponse.json(
            { error: "Troppe richieste. Riprova tra poco." },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": String(RATE_LIMITS[matchingEndpoint].requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
                "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
              },
            },
          )
        }
      }
    }

    const method = request.method
    if (
      (method === "PATCH" || method === "PUT" || method === "DELETE") &&
      request.headers.get("cookie")?.includes("sb-")
    ) {
      // Skip rate limiting for authenticated admin operations
      return NextResponse.next()
    }
  }

  // Project Room (area riservata) session guard.
  // Only checks that a session EXISTS; which projects that session may read is
  // decided per request by requireProjectAccess against the database.
  if (pathname.startsWith("/area-riservata") && !isProjectRoomPublicPath(pathname)) {
    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL("/area-riservata/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  // Admin route protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  const isVirtualQuoteExperience = pathname.startsWith("/preventivo/")

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // `blob:` and `worker-src` are required by pdf.js, which runs its parser
      // in a Web Worker. Without worker-src the directive falls back to
      // default-src and the viewer fails to start.
      // Yandex Metrika loads its tag from mc.yandex.ru but talks to
      // mc.yandex.com at runtime (verified in production: the /watch calls all
      // land on the .com host). Both hosts must be listed.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://mc.yandex.ru https://mc.yandex.com https://yastatic.net https://cdn.vercel-insights.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      // Google Analytics can route collection requests through regional
      // subdomains such as region1.analytics.google.com. Keep both apex and
      // wildcard hosts so CSP does not block present or future regional GA4
      // endpoints while remaining scoped to Google's analytics domains.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://mc.yandex.ru https://mc.yandex.com https://yastatic.net https://api.resend.com https://fal.ai https://*.fal.ai https://api.linkedin.com https://graph.facebook.com https://vitals.vercel-insights.com",
      // youtube-nocookie.com e' il dominio "privacy-enhanced" usato dalla facade
      // dei video (Video guide): senza di esso Chrome blocca l'iframe al click.
      // Tavus CVI serves the real-time WebRTC room through Daily; allow those
      // frames without relaxing frame-src for unrelated providers.
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://calendar.google.com https://*.daily.co https://*.tavus.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  )

  // Keep camera and microphone denied across the rest of 4bid.it. The public
  // virtual-quote experience is the only surface that intentionally embeds a
  // WebRTC advisor, and its iframe also carries an explicit allow attribute.
  response.headers.set(
    "Permissions-Policy",
    isVirtualQuoteExperience
      ? 'camera=(self "https://tavus.daily.co" "https://*.daily.co"), microphone=(self "https://tavus.daily.co" "https://*.daily.co"), geolocation=()'
      : "camera=(), microphone=(), geolocation=()",
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
