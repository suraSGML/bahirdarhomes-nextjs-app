import { prisma } from '@/lib/prisma'
import { serialize } from '@/lib/serialize'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/api'
import { SUB_CITY_LABELS, PROPERTY_TYPE_LABELS, Property } from '@/types'
import { SubCity, PropertyType, ListingType, VerificationStatus } from '@prisma/client'
import { Badge } from '@/components/ui/Badge'
import { InquiryForm } from '@/components/InquiryForm'
import { ReviewForm } from '@/components/ReviewForm'
import { PropertyCard } from '@/components/PropertyCard'
import {
  MapPin, CheckCircle, Eye, Mail,
  Droplets, Zap, Car, Wifi, Shield, Sofa, Calendar, ArrowLeft, ServerCrash
} from 'lucide-react'
import { ShareButton } from '@/components/ShareButton'
import { PropertyMap } from '@/components/PropertyMap'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const p = await prisma.property.findUnique({
      where: { id },
      select: { title: true, description: true, price: true, subCity: true, images: { where: { isPrimary: true }, take: 1 } },
    })
    if (!p) return { title: 'Property' }
    const image = p.images[0]?.url
    return {
      title: p.title,
      description: p.description || `${p.title} in ${SUB_CITY_LABELS[p.subCity]} — BahirDar Homes`,
      openGraph: {
        title: p.title,
        description: p.description || `${p.title} in ${SUB_CITY_LABELS[p.subCity]}`,
        type: 'website',
        ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      },
    }
  } catch {
    return { title: 'Property' }
  }
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params

  type PropertyDetail = {
    id: string; title: string; description: string | null
    listingType: ListingType; propertyType: PropertyType; verificationStatus: VerificationStatus
    subCity: SubCity; kebele: string | null; streetAddress: string | null
    latitude: number | null; longitude: number | null
    price: number; priceNegotiable: boolean
    bedrooms: number; bathrooms: number; areaSqm: number | null
    hasWaterTank: boolean; hasBackupPower: boolean; isFurnished: boolean
    hasParking: boolean; hasInternet: boolean; hasGuard: boolean
    distBduMain: number | null; distLakeTana: number | null
    distCityCenter: number | null; distMarket: number | null
    isActive: boolean; viewCount: number; createdAt: Date; updatedAt: Date
    titleDeedRef: string | null; ownerId: string
    images: { id: string; url: string; thumbnailUrl: string | null; isPrimary: boolean; sortOrder: number }[]
    owner: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
    reviews: { id: string; rating: number; comment: string | null; createdAt: Date; user: { id: string; fullName: string | null } }[]
    _count: { reviews: number; inquiries: number }
  }

  let property: PropertyDetail | null = null

  let related: ReturnType<typeof serialize> = []
  let dbError = false

  try {
    property = await prisma.property.findUnique({
      where: { id },
      include: {
        images:  { orderBy: { sortOrder: 'asc' } },
        owner:   { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        reviews: { include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
        _count:  { select: { reviews: true, inquiries: true } },
      },
    }) as unknown as PropertyDetail

    if (!property || !property.isActive) notFound()

    const relatedRaw = await prisma.property.findMany({
      where: { isActive: true, subCity: property.subCity, id: { not: id } },
      take: 3,
      orderBy: { viewCount: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner:  { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        _count: { select: { reviews: true, inquiries: true } },
      },
    })
    related = serialize(relatedRaw)

    // Fire-and-forget view count increment
    prisma.property.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
  } catch (e: unknown) {
    // notFound() throws a special Next.js error — re-throw it
    if (e instanceof Error && e.message === 'NEXT_NOT_FOUND') throw e
    console.error('[PropertyDetailPage] DB error:', e)
    dbError = true
  }

  if (dbError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/properties" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-medium mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ServerCrash className="w-14 h-14 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Database unavailable</h2>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            We couldn&apos;t load this property right now. Please try again in a moment.
          </p>
          <Link href="/properties"
            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Back to listings
          </Link>
        </div>
      </div>
    )
  }

  if (!property) notFound()

  const primaryImage = property.images.find(i => i.isPrimary) || property.images[0]
  const otherImages  = property.images.filter(i => i.id !== primaryImage?.id).slice(0, 4)

  const amenities = [
    { icon: <Droplets className="w-4 h-4" />, label: 'Water Tank',     active: property.hasWaterTank },
    { icon: <Zap className="w-4 h-4" />,      label: 'Backup Power',   active: property.hasBackupPower },
    { icon: <Sofa className="w-4 h-4" />,     label: 'Furnished',      active: property.isFurnished },
    { icon: <Car className="w-4 h-4" />,      label: 'Parking',        active: property.hasParking },
    { icon: <Wifi className="w-4 h-4" />,     label: 'Internet',       active: property.hasInternet },
    { icon: <Shield className="w-4 h-4" />,   label: 'Guard/Security', active: property.hasGuard },
  ]

  const landmarks = [
    { label: 'BDU Main Campus', dist: property.distBduMain },
    { label: 'Lake Tana',       dist: property.distLakeTana },
    { label: 'City Center',     dist: property.distCityCenter },
    { label: 'Market',          dist: property.distMarket },
  ].filter(l => l.dist != null)

  const avgRating = property.reviews.length > 0
    ? (property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length).toFixed(1)
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: property.title,
            description: property.description,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`,
            image: property.images.map(i => i.url),
            offers: {
              '@type': 'Offer',
              price: Number(property.price),
              priceCurrency: 'ETB',
              availability: 'https://schema.org/InStock',
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: SUB_CITY_LABELS[property.subCity],
              addressRegion: 'Amhara',
              addressCountry: 'ET',
              streetAddress: property.streetAddress,
            },
            ...(property.latitude && property.longitude ? {
              geo: { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude },
            } : {}),
          }),
        }}
      />
      {/* Back + Share */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/properties" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>
        <ShareButton title={property.title} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Image Gallery */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
            <div className="relative h-72 md:h-[420px]">
              {primaryImage ? (
                <Image src={primaryImage.url} alt={property.title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-primary-50 to-primary-100">🏠</div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant={property.listingType === 'RENT' ? 'info' : 'success'}>
                  {property.listingType === 'RENT' ? 'For Rent' : 'For Sale'}
                </Badge>
                {property.verificationStatus === 'VERIFIED' && (
                  <Badge variant="verified"><CheckCircle className="w-3 h-3" /> Verified</Badge>
                )}
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                <Eye className="w-3 h-3" /> {property.viewCount} views
              </div>
            </div>
            {otherImages.length > 0 && (
              <div className={`grid gap-1 p-1 grid-cols-${Math.min(otherImages.length, 4)}`}>
                {otherImages.map(img => (
                  <div key={img.id} className="relative h-24">
                    <Image src={img.thumbnailUrl || img.url} alt="" fill className="object-cover rounded" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{property.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-500">
                  <MapPin className="w-4 h-4 shrink-0 text-primary-400" />
                  <span className="text-sm">
                    {SUB_CITY_LABELS[property.subCity]}{property.streetAddress ? `, ${property.streetAddress}` : ''}
                  </span>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(Number(avgRating)))}</span>
                    <span className="text-sm font-semibold text-gray-700">{avgRating}</span>
                    <span className="text-xs text-gray-400">({property._count.reviews} reviews)</span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-primary-700">{formatPrice(Number(property.price))}</div>
                {property.listingType === 'RENT' && <div className="text-sm text-gray-400">per month</div>}
                {property.priceNegotiable && <div className="text-sm text-green-600 font-medium mt-1">✓ Price Negotiable</div>}
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🏠', label: PROPERTY_TYPE_LABELS[property.propertyType] },
              ...(property.bedrooms > 0 ? [{ icon: '🛏', label: `${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}` }] : []),
              ...(property.bathrooms > 0 ? [{ icon: '🚿', label: `${property.bathrooms} Bathroom${property.bathrooms > 1 ? 's' : ''}` }] : []),
              ...(property.areaSqm ? [{ icon: '📐', label: `${Number(property.areaSqm)} m²` }] : []),
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-center gap-1.5">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map(({ icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  active ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-300'
                }`}>
                  <span className={active ? 'text-green-500' : 'text-gray-300'}>{icon}</span>
                  <span className={active ? '' : 'line-through'}>{label}</span>
                  {active && <CheckCircle className="w-3.5 h-3.5 ml-auto text-green-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Landmarks */}
          {landmarks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Nearby Landmarks</h2>
              <div className="grid grid-cols-2 gap-3">
                {landmarks.map(({ label, dist }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">{label}</span>
                    <span className="text-sm text-primary-600 font-bold">
                      {dist! < 1000 ? `${dist}m` : `${(dist! / 1000).toFixed(1)}km`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Map — always shown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">📍 Location</h2>
              {property.latitude && property.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline font-medium"
                >
                  Open in Google Maps →
                </a>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {SUB_CITY_LABELS[property.subCity]}
              {property.streetAddress ? `, ${property.streetAddress}` : ''}
              {property.kebele ? ` — Kebele ${property.kebele}` : ''}
            </p>
            <PropertyMap
              latitude={property.latitude}
              longitude={property.longitude}
              title={property.title}
              subCity={property.subCity}
            />
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Reviews {avgRating && <span className="text-yellow-500 ml-1">★ {avgRating}</span>}
              </h2>
              <span className="text-sm text-gray-400">{property._count.reviews} total</span>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100">
              <ReviewForm propertyId={property.id} />
            </div>

            {property.reviews.length > 0 ? (
              <div className="space-y-4">
                {property.reviews.map(r => (
                  <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                          {r.user.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-sm text-gray-800">{r.user.fullName || 'Anonymous'}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-20">
            <div className="mb-4">
              <div className="text-2xl font-bold text-primary-700">{formatPrice(Number(property.price))}</div>
              {property.listingType === 'RENT' && <div className="text-xs text-gray-400">per month</div>}
            </div>

            {/* Owner */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                {property.owner.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{property.owner.fullName || 'Landlord'}</p>
                <p className="text-xs text-gray-400">Property Owner</p>
              </div>
            </div>

            <a href={`mailto:${property.owner.email}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors mb-3 shadow-sm">
              <Mail className="w-4 h-4" /> Email Owner
            </a>

            <InquiryForm propertyId={property.id} ownerName={property.owner.fullName} />

            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              Listed {new Date(property.createdAt).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Related Properties */}
      {(related as Property[]).length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            More in {SUB_CITY_LABELS[property.subCity]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(related as unknown as Property[]).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


