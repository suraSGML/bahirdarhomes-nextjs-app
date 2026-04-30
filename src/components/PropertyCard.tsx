'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Bed, Bath, Maximize2, CheckCircle, Eye, Images } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Property, SUB_CITY_LABELS, PROPERTY_TYPE_LABELS } from '@/types'
import { formatPrice } from '@/lib/api'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface PropertyCardProps {
  property: Property
  saved?: boolean
  onSaveToggle?: (id: string, saved: boolean) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function PropertyCard({ property, saved = false, onSaveToggle }: PropertyCardProps) {
  const { user, token } = useAuth()
  const [isSaved, setIsSaved] = useState(saved)
  const [savingLoading, setSavingLoading] = useState(false)

  const primaryImage = property.images.find(i => i.isPrimary) || property.images[0]

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (!user) { toast.error('Sign in to save properties'); return }
    setSavingLoading(true)
    try {
      const res = await fetch('/api/saved', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertyId: property.id }),
      })
      if (res.ok) {
        setIsSaved(!isSaved)
        onSaveToggle?.(property.id, !isSaved)
        toast.success(isSaved ? 'Removed from saved' : '❤️ Saved!')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSavingLoading(false)
    }
  }

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative h-52 bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.thumbnailUrl || primaryImage.url}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 gap-2">
              <span className="text-5xl">🏠</span>
              <span className="text-xs text-primary-400 font-medium">No photo</span>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge variant={property.listingType === 'RENT' ? 'info' : 'success'}>
              {property.listingType === 'RENT' ? 'For Rent' : 'For Sale'}
            </Badge>
            {property.verificationStatus === 'VERIFIED' && (
              <Badge variant="verified">
                <CheckCircle className="w-3 h-3" /> Verified
              </Badge>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={savingLoading}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all"
          >
            <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>

          {/* Bottom row: views + image count */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" /> {property.viewCount}
            </span>
            {property.images.length > 1 && (
              <span className="flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                <Images className="w-3 h-3" /> {property.images.length}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors flex-1">
              {property.title}
            </h3>
            <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(property.createdAt)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-400" />
            <span className="truncate">{SUB_CITY_LABELS[property.subCity]}{property.streetAddress ? `, ${property.streetAddress}` : ''}</span>
          </div>

          {/* Specs */}
          {property.propertyType !== 'LAND' && property.propertyType !== 'COMMERCIAL' && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-50">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-gray-400" />{property.bedrooms} bed</span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-gray-400" />{property.bathrooms} bath</span>
              )}
              {property.areaSqm && (
                <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5 text-gray-400" />{Number(property.areaSqm)}m²</span>
              )}
              <span className="ml-auto text-gray-300 text-xs">{PROPERTY_TYPE_LABELS[property.propertyType]}</span>
            </div>
          )}

          {/* Amenity pills */}
          <div className="flex flex-wrap gap-1 mb-3 min-h-[20px]">
            {property.isFurnished    && <span className="text-xs bg-blue-50   text-blue-600   px-2 py-0.5 rounded-full">Furnished</span>}
            {property.hasWaterTank   && <span className="text-xs bg-cyan-50   text-cyan-600   px-2 py-0.5 rounded-full">Water Tank</span>}
            {property.hasParking     && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Parking</span>}
            {property.hasBackupPower && <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">Generator</span>}
            {property.hasInternet    && <span className="text-xs bg-green-50  text-green-600  px-2 py-0.5 rounded-full">Internet</span>}
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xl font-bold text-primary-700">{formatPrice(property.price)}</span>
              {property.listingType === 'RENT' && <span className="text-xs text-gray-400 ml-1">/mo</span>}
            </div>
            {property.priceNegotiable && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Negotiable</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
