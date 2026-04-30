import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ propertyId: z.string().cuid() })

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const saved = await prisma.savedProperty.findMany({
      where: { userId: user.userId },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            owner:  { select: { id: true, fullName: true, email: true, avatarUrl: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(saved.map(s => s.property))
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
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const saved = await prisma.savedProperty.upsert({
      where: { userId_propertyId: { userId: user.userId, propertyId: parsed.data.propertyId } },
      update: {},
      create: { userId: user.userId, propertyId: parsed.data.propertyId },
    })
    return created(saved)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    await prisma.savedProperty.deleteMany({
      where: { userId: user.userId, propertyId: parsed.data.propertyId },
    })
    return ok({ message: 'Removed from saved' })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
