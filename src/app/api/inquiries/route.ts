import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { sendInquiryNotificationEmail, sendInquiryReplyEmail } from '@/lib/email'
import { z } from 'zod'

const createSchema = z.object({
  propertyId: z.string().cuid(),
  message:    z.string().min(10).max(1000),
})

const replySchema = z.object({
  inquiryId: z.string().cuid(),
  reply:     z.string().min(5).max(1000),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'sent' | 'received'

    if (type === 'received') {
      // Landlord sees inquiries on their properties
      const inquiries = await prisma.inquiry.findMany({
        where: { property: { ownerId: user.userId } },
        include: {
          sender:   { select: { id: true, fullName: true, email: true } },
          property: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return ok(inquiries)
    }

    // Tenant sees their sent inquiries
    const inquiries = await prisma.inquiry.findMany({
      where: { senderId: user.userId },
      include: { property: { select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    })
    return ok(inquiries)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const body = await req.json()

    // Handle reply
    if (body.inquiryId) {
      const parsed = replySchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.errors[0].message)

      const inquiry = await prisma.inquiry.findUnique({
        where: { id: parsed.data.inquiryId },
        include: { property: true },
      })
      if (!inquiry) return badRequest('Inquiry not found')
      if (inquiry.property.ownerId !== user.userId && user.role !== 'ADMIN') return forbidden()

      const updated = await prisma.inquiry.update({
        where: { id: parsed.data.inquiryId },
        data: { reply: parsed.data.reply, status: 'RESPONDED', repliedAt: new Date() },
        include: {
          sender: { select: { fullName: true, email: true } },
          property: { select: { id: true, title: true, owner: { select: { fullName: true } } } },
        },
      })

      // Notify tenant by email (fire-and-forget)
      sendInquiryReplyEmail(
        updated.sender.email,
        updated.sender.fullName,
        updated.property.owner.fullName,
        updated.property.title,
        parsed.data.reply,
        updated.property.id,
      ).catch(() => {})

      return ok(updated)
    }

    // New inquiry
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    // Rate limit: 20 inquiries per hour per IP
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 'inquiry', { limit: 20, windowSec: 60 * 60 })
    if (!rl.success) return badRequest('Too many inquiries sent. Please wait before sending more.')

    const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } })
    if (!property) return badRequest('Property not found')
    if (property.ownerId === user.userId) return badRequest('Cannot inquire on your own property')

    const existing = await prisma.inquiry.findFirst({
      where: { propertyId: parsed.data.propertyId, senderId: user.userId, status: 'PENDING' },
    })
    if (existing) return badRequest('You already have a pending inquiry for this property')

    const inquiry = await prisma.inquiry.create({
      data: { ...parsed.data, senderId: user.userId },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
        property: { select: { id: true, title: true, owner: { select: { fullName: true, email: true } } } },
      },
    })

    // Notify landlord by email (fire-and-forget)
    sendInquiryNotificationEmail(
      inquiry.property.owner.email,
      inquiry.property.owner.fullName,
      inquiry.sender.fullName,
      inquiry.property.title,
      parsed.data.message,
      inquiry.property.id,
    ).catch(() => {})

    return created(inquiry)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
