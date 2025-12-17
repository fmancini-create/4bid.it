import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    hostname.includes("localhost") ||
    hostname.includes("v0.app") ||
    hostname.includes("v0-preview")

  if (!isDevelopment) {
    // Redirect da www a non-www SOLO se il hostname è esattamente www.4bid.it
    if (hostname === "www.4bid.it") {
      return NextResponse.redirect(`https://4bid.it${url.pathname}${url.search}`, 301)
    }

    // Blocca accessi diretti via IP o domini non autorizzati
    const allowedHosts = ["4bid.it", "www.4bid.it"]
    const isAllowedHost = allowedHosts.some((host) => hostname === host)
    const isVercelPreview = hostname.includes("vercel.app")

    if (!isAllowedHost && !isVercelPreview) {
      // Redirect permanente a dominio canonico
      return NextResponse.redirect(`https://4bid.it${url.pathname}${url.search}`, 301)
    }
  }

  const response = NextResponse.next()

  // X-Frame-Options: previene clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // X-Content-Type-Options: previene MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Referrer-Policy: privacy ottimale
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Permissions-Policy: disabilita funzionalità pericolose
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Strict-Transport-Security (HSTS): forza HTTPS per 1 anno
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

  // X-DNS-Prefetch-Control: ottimizza DNS prefetch
  response.headers.set("X-DNS-Prefetch-Control", "on")

  // X-XSS-Protection: protezione legacy XSS
  response.headers.set("X-XSS-Protection", "1; mode=block")

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
