import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { sendPropertyVerificationEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  status:       z.enum(['VERIFIED', 'REJECTED', 'PENDING']),
  titleDeedRef: z.string().max(100).optional(),
  notes:        z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) return notFound()

    const { status, titleDeedRef, notes } = parsed.data
    const verifiedAt = status === 'VERIFIED' ? new Date() : null

    const [updated] = await prisma.$transaction([
      prisma.property.update({
        where: { id },
        data: { verificationStatus: status, ...(titleDeedRef && { titleDeedRef }) },
      }),
      prisma.adminVerification.create({
        data: { propertyId: id, adminId: user.userId, status, titleDeedRef, notes, verifiedAt },
      }),
    ])

    // Notify landlord by email (fire-and-forget)
    const propertyWithOwner = await prisma.property.findUnique({
      where: { id },
      include: { owner: { select: { email: true, fullName: true } } },
    })
    if (propertyWithOwner && (status === 'VERIFIED' || status === 'REJECTED')) {
      sendPropertyVerificationEmail(
        propertyWithOwner.owner.email,
        propertyWithOwner.owner.fullName,
        propertyWithOwner.title,
        status,
        notes,
      ).catch(() => {})
    }

    return ok({ propertyId: updated.id, verificationStatus: updated.verificationStatus, verifiedAt })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
