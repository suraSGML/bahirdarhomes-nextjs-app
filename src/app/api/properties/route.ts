import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  title:          z.string().min(5).max(150),
  description:    z.string().max(2000).optional(),
  listingType:    z.enum(['RENT', 'SALE']),
  propertyType:   z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'COMMERCIAL', 'LAND']),
  subCity:        z.enum(['FASILO', 'BELAY_ZELEKE', 'TANA', 'GINBOT_20', 'SEFENE_SELAM', 'SHUM_ABO', 'HIDAR_11', 'AZEZO', 'MESHENTI']),
  kebele:         z.string().max(50).optional(),
  streetAddress:  z.string().max(200).optional(),
  latitude:       z.number().optional(),
  longitude:      z.number().optional(),
  price:          z.number().positive(),
  priceNegotiable:z.boolean().default(false),
  bedrooms:       z.number().int().min(0).default(0),
  bathrooms:      z.number().int().min(0).default(0),
  areaSqm:        z.number().positive().optional(),
  hasWaterTank:   z.boolean().default(false),
  hasBackupPower: z.boolean().default(false),
  isFurnished:    z.boolean().default(false),
  hasParking:     z.boolean().default(false),
  hasInternet:    z.boolean().default(false),
  hasGuard:       z.boolean().default(false),
  distBduMain:    z.number().int().optional(),
  distLakeTana:   z.number().int().optional(),
  distCityCenter: z.number().int().optional(),
  distMarket:     z.number().int().optional(),
  images: z.array(z.object({
    url:          z.string().url(),
    thumbnailUrl: z.string().optional(),
    isPrimary:    z.boolean().default(false),
    sortOrder:    z.number().int().default(0),
  })).max(10).default([]),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page     = Math.max(1, Number(searchParams.get('page') || 1))
    const limit    = Math.min(24, Math.max(1, Number(searchParams.get('limit') || 12)))
    const skip     = (page - 1) * limit

    const where: Record<string, unknown> = {}
    const showAll = searchParams.get('showAll') === 'true'
    if (!showAll) where.isActive = true

    const listingType  = searchParams.get('listingType')
    const propertyType = searchParams.get('propertyType')
    const subCity      = searchParams.get('subCity')
    const minPrice     = searchParams.get('minPrice')
    const maxPrice     = searchParams.get('maxPrice')
    const bedrooms     = searchParams.get('bedrooms')
    const isFurnished  = searchParams.get('isFurnished')
    const hasParking   = searchParams.get('hasParking')
    const hasWaterTank = searchParams.get('hasWaterTank')
    const search       = searchParams.get('search')

    const sortBy      = searchParams.get('sortBy')
    const ownerId      = searchParams.get('ownerId')
    const verificationStatus = searchParams.get('verificationStatus')

    if (listingType)  where.listingType  = listingType
    if (propertyType) where.propertyType = propertyType
    if (subCity)      where.subCity      = subCity
    if (verificationStatus) where.verificationStatus = verificationStatus
    if (isFurnished === 'true')  where.isFurnished  = true
    if (hasParking === 'true')   where.hasParking   = true
    if (hasWaterTank === 'true') where.hasWaterTank = true
    if (bedrooms)     where.bedrooms = { gte: Number(bedrooms) }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      }
    }
    if (search) {
      where.OR = [
        { title:         { contains: search, mode: 'insensitive' } },
        { description:   { contains: search, mode: 'insensitive' } },
        { streetAddress: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Owner filter — used by landlord dashboard
    if (ownerId && ownerId !== 'me') where.ownerId = ownerId
    if (ownerId === 'me') {
      const user = await getAuthUser(req)
      if (user) where.ownerId = user.userId
    }

    const orderBy: Record<string, string> =
      sortBy === 'price_asc'  ? { price: 'asc' } :
      sortBy === 'price_desc' ? { price: 'desc' } :
      sortBy === 'popular'    ? { viewCount: 'desc' } :
      sortBy === 'oldest'     ? { createdAt: 'asc' } :
      { createdAt: 'desc' }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner:  { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          _count: { select: { reviews: true, inquiries: true } },
        },
      }),
      prisma.property.count({ where }),
    ])

    return ok({ properties, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (user.role !== 'LANDLORD' && user.role !== 'ADMIN') {
      return badRequest('Only landlords can create listings')
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const { images, ...data } = parsed.data

    const property = await prisma.property.create({
      data: {
        ...data,
        ownerId: user.userId,
        images: { create: images },
      },
      include: {
        images: true,
        owner: { select: { id: true, fullName: true, email: true } },
      },
    })

    return created(property)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
