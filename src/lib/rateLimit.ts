/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window counter per IP address.
 * Works in Node.js runtime (not Edge).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Global store — persists across requests in the same process
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSec: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(ip: string, key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowSec } = options
  const storeKey = `${key}:${ip}`
  const now = Date.now()
  const windowMs = windowSec * 1000

  const entry = store.get(storeKey)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(storeKey, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Get the real client IP from Next.js request headers.
 * Handles proxies (Vercel, Nginx, Cloudflare).
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}
