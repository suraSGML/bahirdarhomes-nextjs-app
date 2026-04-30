import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  title:          z.string().min(5).max(150).optional(),
  description:    z.string().max(2000).optional(),
  price:          z.number().positive().optional(),
  priceNegotiable:z.boolean().optional(),
  bedrooms:       z.number().int().min(0).optional(),
  bathrooms:      z.number().int().min(0).optional(),
  areaSqm:        z.number().positive().optional(),
  streetAddress:  z.string().max(200).optional(),
  kebele:         z.string().max(50).optional(),
  latitude:       z.number().optional().nullable(),
  longitude:      z.number().optional().nullable(),
  hasWaterTank:   z.boolean().optional(),
  hasBackupPower: z.boolean().optional(),
  isFurnished:    z.boolean().optional(),
  hasParking:     z.boolean().optional(),
  hasInternet:    z.boolean().optional(),
  hasGuard:       z.boolean().optional(),
  isActive:       z.boolean().optional(),
  distBduMain:    z.number().int().optional().nullable(),
  distLakeTana:   z.number().int().optional().nullable(),
  distCityCenter: z.number().int().optional().nullable(),
  distMarket:     z.number().int().optional().nullable(),
  // Image operations
  addImages:    z.array(z.object({
    url:          z.string().url(),
    thumbnailUrl: z.string().optional(),
    isPrimary:    z.boolean().default(false),
    sortOrder:    z.number().int().default(0),
  })).max(10).optional(),
  deleteImageIds: z.array(z.string()).optional(),
  primaryImageId: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images:   { orderBy: { sortOrder: 'asc' } },
        owner:    { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        reviews:  { include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
        _count:   { select: { reviews: true, inquiries: true } },
      },
    })

    if (!property) return notFound('Property not found')

    prisma.property.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    return ok(property)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) return notFound()

    if (property.ownerId !== user.userId && user.role !== 'ADMIN') return forbidden()

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const { addImages, deleteImageIds, primaryImageId, ...fields } = parsed.data

    // Count existing images to enforce 10-image limit
    if (addImages?.length) {
      const existingCount = await prisma.propertyImage.count({ where: { propertyId: id } })
      const toDelete = deleteImageIds?.length || 0
      if (existingCount - toDelete + addImages.length > 10) {
        return badRequest('A property can have at most 10 images.')
      }
    }

    await prisma.$transaction(async (tx) => {
      // Delete images
      if (deleteImageIds?.length) {
        await tx.propertyImage.deleteMany({
          where: { id: { in: deleteImageIds }, propertyId: id },
        })
      }

      // Set new primary image
      if (primaryImageId) {
        await tx.propertyImage.updateMany({ where: { propertyId: id }, data: { isPrimary: false } })
        await tx.propertyImage.update({ where: { id: primaryImageId }, data: { isPrimary: true } })
      }

      // Add new images
      if (addImages?.length) {
        // If setting a primary among new images, clear existing primaries first
        if (addImages.some(img => img.isPrimary)) {
          await tx.propertyImage.updateMany({ where: { propertyId: id }, data: { isPrimary: false } })
        }
        await tx.propertyImage.createMany({
          data: addImages.map(img => ({ ...img, propertyId: id })),
        })
      }

      // Update property fields
      await tx.property.update({ where: { id }, data: fields })
    })

    const updated = await prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, owner: { select: { id: true, fullName: true, email: true } } },
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
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) return notFound()

    if (property.ownerId !== user.userId && user.role !== 'ADMIN') return forbidden()

    await prisma.property.delete({ where: { id } })
    return ok({ message: 'Property deleted' })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
