import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, unauthorized, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'

// Returns a map of { propertyId: latestRejectionNotes } for the landlord's properties
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const verifications = await prisma.adminVerification.findMany({
      where: {
        status: 'REJECTED',
        property: { ownerId: user.userId },
      },
      orderBy: { createdAt: 'desc' },
      select: { propertyId: true, notes: true },
    })

    // Keep only the latest rejection per property
    const notesMap: Record<string, string | null> = {}
    for (const v of verifications) {
      if (!(v.propertyId in notesMap)) {
        notesMap[v.propertyId] = v.notes
      }
    }

    return ok(notesMap)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
