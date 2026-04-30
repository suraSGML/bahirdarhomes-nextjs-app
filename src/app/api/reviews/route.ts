import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { z } from 'zod'

const schema = z.object({
  propertyId: z.string().cuid(),
  rating:     z.number().int().min(1).max(5),
  comment:    z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    // Rate limit: 30 reviews per hour per IP
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 'review', { limit: 30, windowSec: 60 * 60 })
    if (!rl.success) return badRequest('Too many reviews submitted. Please wait before submitting more.')

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } })
    if (!property) return badRequest('Property not found')
    if (property.ownerId === user.userId) return badRequest('Cannot review your own property')

    const review = await prisma.review.upsert({
      where: { userId_propertyId: { userId: user.userId, propertyId: parsed.data.propertyId } },
      update: { rating: parsed.data.rating, comment: parsed.data.comment },
      create: { ...parsed.data, userId: user.userId },
      include: { user: { select: { id: true, fullName: true } } },
    })

    return created(review)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
