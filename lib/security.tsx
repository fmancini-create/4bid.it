/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize HTML to prevent XSS attacks
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
 * Sanitize general input - trim and limit length
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== "string") return ""
  return input.trim().slice(0, maxLength)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate phone format (Italian and international)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false
  // Allow digits, spaces, dashes, plus sign, parentheses
  const phoneRegex = /^[\d\s\-+()]{6,20}$/
  return phoneRegex.test(phone.trim())
}

/**
 * Escape SQL special characters (for display purposes, not for queries - use parameterized queries)
 */
export function escapeSql(input: string): string {
  if (!input || typeof input !== "string") return ""
  return input.replace(/'/g, "''")
}

/**
 * Generate a random token
 */
export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
