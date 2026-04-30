import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['TENANT', 'LANDLORD', 'ADMIN']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await getAuthUser(req)
    if (!admin) return unauthorized()
    if (admin.role !== 'ADMIN') return forbidden()

    // Prevent admin from deactivating themselves
    if (id === admin.userId) {
      return badRequest('You cannot modify your own account')
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return notFound('User not found')

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    })

    return ok(updated)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await getAuthUser(req)
    if (!admin) return unauthorized()
    if (admin.role !== 'ADMIN') return forbidden()

    if (id === admin.userId) {
      return badRequest('You cannot delete your own account')
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return notFound('User not found')

    await prisma.user.delete({ where: { id } })

    return ok({ deleted: true })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
