import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  // Blocca accessi diretti via IP (es. 159.69.22.72) o domini non autorizzati
  const allowedHosts = ["4bid.it", "www.4bid.it", "localhost:3000"]
  const isAllowedHost = allowedHosts.some((host) => hostname.includes(host))

  if (!isAllowedHost && !hostname.includes("vercel.app")) {
    // Redirect permanente a dominio canonico
    return NextResponse.redirect("https://4bid.it" + url.pathname, 301)
  }

  if (hostname === "www.4bid.it") {
    url.host = "4bid.it"
    return NextResponse.redirect(url, 301)
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
