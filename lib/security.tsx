// Security utilities for input sanitization and validation

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (Italian)
 */
export function isValidPhone(phone: string): boolean {
  // Allow Italian phone formats
  const phoneRegex = /^[\d\s+\-()]{6,20}$/
  return phoneRegex.test(phone)
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Validate request origin
 */
export function isValidOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  if (!origin && !referer) return true // Same-origin request

  const requestOrigin = origin || (referer ? new URL(referer).origin : null)
  if (!requestOrigin) return true

  return allowedOrigins.some((allowed) => requestOrigin.startsWith(allowed))
}
