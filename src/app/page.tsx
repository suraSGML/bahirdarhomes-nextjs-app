import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { serialize } from '@/lib/serialize'
import { PropertyCard } from '@/components/PropertyCard'
import { SearchFilters } from '@/components/SearchFilters'
import { ListPropertyButton } from '@/components/ListPropertyButton'
import { Suspense } from 'react'
import { Building2, Home, TrendingUp, ShieldCheck, MapPin, Star } from 'lucide-react'
import { SUB_CITY_LABELS, SubCity, Property } from '@/types'

async function getFeaturedProperties() {
  try {
    const data = await prisma.property.findMany({
      where: { isActive: true, verificationStatus: 'VERIFIED' },
      take: 6,
      orderBy: { viewCount: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner:  { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        _count: { select: { reviews: true, inquiries: true } },
      },
    })
    return serialize(data)
  } catch {
    return []
  }
}

async function getStats() {
  try {
    const [totalProperties, totalLandlords, totalRent, totalSale] = await Promise.all([
      prisma.property.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'LANDLORD' } }),
      prisma.property.count({ where: { isActive: true, listingType: 'RENT' } }),
      prisma.property.count({ where: { isActive: true, listingType: 'SALE' } }),
    ])
    return { totalProperties, totalLandlords, totalRent, totalSale }
  } catch {
    return { totalProperties: 0, totalLandlords: 0, totalRent: 0, totalSale: 0 }
  }
}

const subCityImages: Record<SubCity, string> = {
  FASILO:       'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop',
  BELAY_ZELEKE: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop',
  TANA:         'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop',
  GINBOT_20:    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop',
  SEFENE_SELAM: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  SHUM_ABO:     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
  HIDAR_11:     'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=250&fit=crop',
  AZEZO:        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
  MESHENTI:     'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400&h=250&fit=crop',
}

export default async function HomePage() {
  const [featured, stats] = await Promise.all([getFeaturedProperties(), getStats()])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-10">
            <div className="flex justify-center gap-1 mb-6">
              <div className="w-8 h-1.5 rounded-full bg-ethiopian-green" />
              <div className="w-8 h-1.5 rounded-full bg-ethiopian-yellow" />
              <div className="w-8 h-1.5 rounded-full bg-ethiopian-red" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              Find Your Perfect Home<br />
              <span className="text-primary-200">in Bahir Dar</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-8">
              Browse verified rental homes, apartments, and properties across all sub-cities of Bahir Dar, Ethiopia.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Suspense>
              <SearchFilters />
            </Suspense>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { label: '🏠 Houses',    href: '/properties?propertyType=HOUSE' },
              { label: '🏢 Apartments',href: '/properties?propertyType=APARTMENT' },
              { label: '🏡 Villas',    href: '/properties?propertyType=VILLA' },
              { label: '🛏 Studios',   href: '/properties?propertyType=STUDIO' },
              { label: '🏗 Land',      href: '/properties?propertyType=LAND' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium transition-colors border border-white/20">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Home className="w-6 h-6 text-primary-600" />,    value: stats.totalProperties, label: 'Total Listings' },
              { icon: <Building2 className="w-6 h-6 text-green-600" />, value: stats.totalRent,        label: 'For Rent' },
              { icon: <TrendingUp className="w-6 h-6 text-blue-600" />, value: stats.totalSale,        label: 'For Sale' },
              { icon: <ShieldCheck className="w-6 h-6 text-purple-600" />, value: stats.totalLandlords, label: 'Landlords' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="text-center p-4">
                <div className="flex justify-center mb-2">{icon}</div>
                <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}+</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Properties</h2>
            <p className="text-gray-500 mt-1">Verified and top-viewed listings in Bahir Dar</p>
          </div>
          <Link href="/properties" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            View all →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featured as unknown as Property[]).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No featured properties yet. Be the first to list!</p>
            <Link href="/auth?mode=register" className="mt-4 inline-block text-primary-600 font-medium hover:underline">
              List your property →
            </Link>
          </div>
        )}
      </section>

      {/* Browse by Sub-City */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Browse by Sub-City</h2>
            <p className="text-gray-500 mt-1">Find properties in your preferred area of Bahir Dar</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.keys(SUB_CITY_LABELS) as SubCity[]).map(key => (
              <Link key={key} href={`/properties?subCity=${key}`}
                className="group relative rounded-xl overflow-hidden h-36 shadow-sm hover:shadow-md transition-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={subCityImages[key]} alt={SUB_CITY_LABELS[key]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="flex items-center gap-1.5 text-white">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold">{SUB_CITY_LABELS[key]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why BahirDar Homes?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck className="w-8 h-8 text-green-600" />, title: 'Verified Listings',  desc: 'Every property is reviewed and verified by our admin team to ensure authenticity and accuracy.' },
            { icon: <Star className="w-8 h-8 text-yellow-500" />,       title: 'Trusted Reviews',    desc: 'Read honest reviews from real tenants who have lived in the properties you are considering.' },
            { icon: <MapPin className="w-8 h-8 text-primary-600" />,    title: 'Local Expertise',    desc: 'We know Bahir Dar. Find properties near BDU, Lake Tana, markets, and key landmarks.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex justify-center mb-4">{icon}</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-ethiopian-green to-primary-700 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Have a Property to Rent or Sell?</h2>
          <p className="text-white/80 mb-6 text-lg">List your property for free and reach thousands of tenants in Bahir Dar.</p>
          <ListPropertyButton className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
            List Your Property Free →
          </ListPropertyButton>
        </div>
      </section>
    </div>
  )
}
