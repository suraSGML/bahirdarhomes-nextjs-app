import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { serialize } from '@/lib/serialize'
import { PropertyCard } from '@/components/PropertyCard'
import { SearchFilters } from '@/components/SearchFilters'
import { Metadata } from 'next'
import Link from 'next/link'
import { Home, ChevronLeft, ChevronRight, ServerCrash } from 'lucide-react'
import { SUB_CITY_LABELS, PROPERTY_TYPE_LABELS } from '@/types'

export const metadata: Metadata = { title: 'Browse Properties' }

interface SearchParams {
  search?: string; listingType?: string; propertyType?: string; subCity?: string
  minPrice?: string; maxPrice?: string; bedrooms?: string; isFurnished?: string
  hasParking?: string; hasWaterTank?: string; sortBy?: string; page?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function getProperties(sp: SearchParams) {
  const page  = Math.max(1, Number(sp.page || 1))
  const limit = 12
  const skip  = (page - 1) * limit

  const where: Record<string, unknown> = { isActive: true }

  if (sp.listingType)  where.listingType  = sp.listingType
  if (sp.propertyType) where.propertyType = sp.propertyType
  if (sp.subCity)      where.subCity      = sp.subCity
  if (sp.isFurnished  === 'true') where.isFurnished  = true
  if (sp.hasParking   === 'true') where.hasParking   = true
  if (sp.hasWaterTank === 'true') where.hasWaterTank = true
  if (sp.bedrooms)     where.bedrooms = { gte: Number(sp.bedrooms) }
  if (sp.minPrice || sp.maxPrice) {
    where.price = {
      ...(sp.minPrice ? { gte: Number(sp.minPrice) } : {}),
      ...(sp.maxPrice ? { lte: Number(sp.maxPrice) } : {}),
    }
  }
  if (sp.search) {
    where.OR = [
      { title:         { contains: sp.search, mode: 'insensitive' } },
      { description:   { contains: sp.search, mode: 'insensitive' } },
      { streetAddress: { contains: sp.search, mode: 'insensitive' } },
    ]
  }

  const orderBy: Record<string, string> =
    sp.sortBy === 'price_asc'  ? { price: 'asc' } :
    sp.sortBy === 'price_desc' ? { price: 'desc' } :
    sp.sortBy === 'popular'    ? { viewCount: 'desc' } :
    sp.sortBy === 'oldest'     ? { createdAt: 'asc' } :
    { createdAt: 'desc' }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where, skip, take: limit, orderBy,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner:  { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        _count: { select: { reviews: true, inquiries: true } },
      },
    }),
    prisma.property.count({ where }),
  ])

  return { properties: serialize(properties), total, page, totalPages: Math.ceil(total / limit) }
}

function buildPageUrl(sp: SearchParams, page: number) {
  const q = new URLSearchParams()
  Object.entries(sp).forEach(([k, v]) => { if (v && k !== 'page') q.set(k, v) })
  q.set('page', String(page))
  return `/properties?${q.toString()}`
}

function DbErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center px-4">
      <ServerCrash className="w-14 h-14 text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Database unavailable</h2>
      <p className="text-gray-400 text-sm max-w-sm mb-6">
        We couldn&apos;t reach the database right now. This is usually temporary — please try again in a moment.
      </p>
      <Link href="/properties"
        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
        Reload page
      </Link>
    </div>
  )
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const sp = await searchParams

  let data: Awaited<ReturnType<typeof getProperties>> | null = null
  let dbError = false

  try {
    data = await getProperties(sp)
  } catch (e) {
    console.error('[PropertiesPage] DB error:', e)
    dbError = true
  }

  const activeFilters = [
    sp.listingType  && `Type: ${sp.listingType === 'RENT' ? 'For Rent' : 'For Sale'}`,
    sp.subCity      && `Area: ${SUB_CITY_LABELS[sp.subCity as keyof typeof SUB_CITY_LABELS] ?? sp.subCity}`,
    sp.propertyType && `${PROPERTY_TYPE_LABELS[sp.propertyType as keyof typeof PROPERTY_TYPE_LABELS] ?? sp.propertyType}`,
    sp.bedrooms     && `${sp.bedrooms}+ Beds`,
    sp.isFurnished  === 'true' && 'Furnished',
    sp.hasParking   === 'true' && 'Parking',
    sp.search       && `"${sp.search}"`,
  ].filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search filters always render — they are client-only */}
      <div className="mb-6">
        <Suspense>
          <SearchFilters />
        </Suspense>
      </div>

      {dbError ? (
        <DbErrorState />
      ) : !data ? null : (
        <>
          {/* Results header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {data.total > 0 ? `${data.total.toLocaleString()} Properties Found` : 'No Properties Found'}
              </h1>
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {activeFilters.map((f, i) => (
                    <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{f}</span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">Page {data.page} of {data.totalPages || 1}</p>
          </div>

          {/* Grid */}
          {data.properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {data.properties.map(p => (
                  <PropertyCard key={p.id} property={p as never} />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {data.page > 1 && (
                    <Link href={buildPageUrl(sp, data.page - 1)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Link>
                  )}
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(data!.page - 2, data!.totalPages - 4)) + i
                    return (
                      <Link key={n} href={buildPageUrl(sp, n)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          n === data!.page ? 'bg-primary-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                        }`}>
                        {n}
                      </Link>
                    )
                  })}
                  {data.page < data.totalPages && (
                    <Link href={buildPageUrl(sp, data.page + 1)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
                      Next <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Home className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h2>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
              <Link href="/properties" className="text-primary-600 hover:underline font-medium">Clear all filters</Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
