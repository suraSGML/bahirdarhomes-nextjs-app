/**
 * Runtime environment validation.
 * Imported by server-side code (prisma.ts, auth.ts) so it runs on first
 * server request — not during `next build`.
 */

const required = ['DATABASE_URL', 'JWT_SECRET'] as const

if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[Startup] Missing required environment variables: ${missing.join(', ')}. ` +
      'Set them in your hosting provider before deploying.'
    )
  }
}

export const env = {
  DATABASE_URL:          process.env.DATABASE_URL!,
  JWT_SECRET:            process.env.JWT_SECRET!,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  RESEND_API_KEY:        process.env.RESEND_API_KEY,
  EMAIL_FROM:            process.env.EMAIL_FROM,
  NEXT_PUBLIC_APP_URL:   process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME:  process.env.NEXT_PUBLIC_APP_NAME || 'BahirDar Homes',
  NODE_ENV:              process.env.NODE_ENV,
}
