export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMIN'
export type ListingType = 'RENT' | 'SALE'
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'STUDIO' | 'COMMERCIAL' | 'LAND'
export type SubCity =
  | 'FASILO'
  | 'BELAY_ZELEKE'
  | 'TANA'
  | 'GINBOT_20'
  | 'SEFENE_SELAM'
  | 'SHUM_ABO'
  | 'HIDAR_11'
  | 'AZEZO'
  | 'MESHENTI'
export type VerificationStatus = 'STANDARD' | 'PENDING' | 'VERIFIED' | 'REJECTED'
export type InquiryStatus = 'PENDING' | 'RESPONDED' | 'CLOSED'

export interface AuthUser {
  userId: string
  email: string
  role: UserRole
}

export interface PropertyImage {
  id: string
  url: string
  thumbnailUrl?: string | null
  isPrimary: boolean
  sortOrder: number
}

export interface Property {
  id: string
  title: string
  description?: string | null
  listingType: ListingType
  propertyType: PropertyType
  verificationStatus: VerificationStatus
  subCity: SubCity
  kebele?: string | null
  streetAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  price: number
  priceNegotiable: boolean
  bedrooms: number
  bathrooms: number
  areaSqm?: number | null
  hasWaterTank: boolean
  hasBackupPower: boolean
  isFurnished: boolean
  hasParking: boolean
  hasInternet: boolean
  hasGuard: boolean
  isActive: boolean
  viewCount: number
  createdAt: string
  images: PropertyImage[]
  owner: {
    id: string
    fullName?: string | null
    email: string
    avatarUrl?: string | null
  }
  distBduMain?: number | null
  distLakeTana?: number | null
  distCityCenter?: number | null
  distMarket?: number | null
  _count?: { reviews: number; inquiries: number }
}

export interface Inquiry {
  id: string
  propertyId: string
  message: string
  status: InquiryStatus
  reply?: string | null
  repliedAt?: string | null
  createdAt: string
  sender: { id: string; fullName?: string | null; email: string }
  property?: { id: string; title: string }
}

export interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; fullName?: string | null }
}

export interface PropertyFilters {
  listingType?: ListingType
  propertyType?: PropertyType
  subCity?: SubCity
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  isFurnished?: boolean
  hasWaterTank?: boolean
  hasParking?: boolean
  search?: string
  page?: number
  limit?: number
}

export const SUB_CITY_LABELS: Record<SubCity, string> = {
  FASILO: 'Fasilo',
  BELAY_ZELEKE: 'Belay Zeleke',
  TANA: 'Tana',
  GINBOT_20: 'Ginbot 20',
  SEFENE_SELAM: 'Sefene Selam',
  SHUM_ABO: 'Shum Abo',
  HIDAR_11: 'Hidar 11',
  AZEZO: 'Azezo',
  MESHENTI: 'Meshenti',
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
}
