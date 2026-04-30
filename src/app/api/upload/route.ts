import { NextRequest } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Max file size: 5MB (base64 is ~33% larger than binary, so 5MB binary ≈ 6.7MB base64)
const MAX_BASE64_LENGTH = Math.ceil(5 * 1024 * 1024 * (4 / 3)) + 100

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    // Rate limit: 30 uploads per hour per IP
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 'upload', { limit: 30, windowSec: 60 * 60 })
    if (!rl.success) return badRequest('Upload limit reached. Please try again later.')

    const body = await req.json()
    const { base64, folder } = body

    if (!base64 || typeof base64 !== 'string') {
      return badRequest('No image data provided')
    }

    // Validate data URI format: data:<mime>;base64,<data>
    const dataUriMatch = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
    if (!dataUriMatch) {
      return badRequest('Invalid image format. Must be a base64 data URI.')
    }

    const mimeType = dataUriMatch[1].toLowerCase()
    const base64Data = dataUriMatch[2]

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return badRequest(`Unsupported file type: ${mimeType}. Allowed types: JPEG, PNG, WebP, GIF.`)
    }

    // Validate file size
    if (base64Data.length > MAX_BASE64_LENGTH) {
      return badRequest('Image is too large. Maximum file size is 5MB.')
    }

    // Validate base64 characters (prevent injection)
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return badRequest('Invalid image data encoding.')
    }

    const result = await uploadImage(base64, folder || 'bahirdar-homes/properties')
    return ok(result)
  } catch (e) {
    console.error(e)
    return serverError('Image upload failed')
  }
}
