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

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://mc.yandex.ru https://yastatic.net https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://mc.yandex.ru https://api.resend.com https://fal.ai https://*.fal.ai https://api.linkedin.com https://graph.facebook.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
