import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, forbidden, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden()

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { properties: true, inquiries: true } },
      },
    })

    return ok({ users })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
