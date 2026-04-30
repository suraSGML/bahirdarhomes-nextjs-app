'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { SUB_CITY_LABELS, PROPERTY_TYPE_LABELS } from '@/types'

export function SearchFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [filters, setFilters] = useState({
    search:       params.get('search') || '',
    listingType:  params.get('listingType') || '',
    propertyType: params.get('propertyType') || '',
    subCity:      params.get('subCity') || '',
    minPrice:     params.get('minPrice') || '',
    maxPrice:     params.get('maxPrice') || '',
    bedrooms:     params.get('bedrooms') || '',
    isFurnished:  params.get('isFurnished') || '',
    hasParking:   params.get('hasParking') || '',
    hasWaterTank: params.get('hasWaterTank') || '',
    sortBy:       params.get('sortBy') || '',
  })

  function apply() {
    const q = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v) })
    router.push(`/properties?${q.toString()}`)
  }

  function clear() {
    setFilters({ search:'', listingType:'', propertyType:'', subCity:'', minPrice:'', maxPrice:'', bedrooms:'', isFurnished:'', hasParking:'', hasWaterTank:'', sortBy:'' })
    router.push('/properties')
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters(f => ({ ...f, [key]: e.target.value }))

  const subCityOptions     = Object.entries(SUB_CITY_LABELS).map(([v, l]) => ({ value: v, label: l }))
  const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v && k !== 'sortBy')

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 md:p-5">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search by title, area, street..."
            value={filters.search}
            onChange={set('search')}
            icon={<Search className="w-4 h-4" />}
            onKeyDown={e => e.key === 'Enter' && apply()}
          />
        </div>
        <Select
          options={[{ value: 'RENT', label: 'For Rent' }, { value: 'SALE', label: 'For Sale' }]}
          placeholder="All Types"
          value={filters.listingType}
          onChange={set('listingType')}
          className="sm:w-32"
        />
        <Select
          options={subCityOptions}
          placeholder="All Areas"
          value={filters.subCity}
          onChange={set('subCity')}
          className="sm:w-40"
        />
        <Button onClick={apply} className="shrink-0">
          <Search className="w-4 h-4" /> Search
        </Button>
        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          {showAdvanced ? 'Less' : 'More'}
          {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
        </Button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select label="Property Type" options={propertyTypeOptions} placeholder="Any"
              value={filters.propertyType} onChange={set('propertyType')} />
            <Select label="Bedrooms" options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n}+ Beds` }))}
              placeholder="Any" value={filters.bedrooms} onChange={set('bedrooms')} />
            <Input label="Min Price (ETB)" type="number" placeholder="0" value={filters.minPrice} onChange={set('minPrice')} />
            <Input label="Max Price (ETB)" type="number" placeholder="Any" value={filters.maxPrice} onChange={set('maxPrice')} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {[
              { key: 'isFurnished',  label: '🛋 Furnished' },
              { key: 'hasParking',   label: '🚗 Parking' },
              { key: 'hasWaterTank', label: '💧 Water Tank' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox"
                  checked={filters[key as keyof typeof filters] === 'true'}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.checked ? 'true' : '' }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <Select
                options={[
                  { value: 'newest',     label: 'Newest First' },
                  { value: 'oldest',     label: 'Oldest First' },
                  { value: 'price_asc',  label: 'Price: Low → High' },
                  { value: 'price_desc', label: 'Price: High → Low' },
                  { value: 'popular',    label: 'Most Viewed' },
                ]}
                placeholder="Sort by"
                value={filters.sortBy}
                onChange={set('sortBy')}
                className="w-44"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clear} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
