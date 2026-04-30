'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { LocationPicker } from '@/components/LocationPicker'
import { SUB_CITY_LABELS, PROPERTY_TYPE_LABELS } from '@/types'
import toast from 'react-hot-toast'
import { Upload, X, ImagePlus } from 'lucide-react'

const subCityOptions = Object.entries(SUB_CITY_LABELS).map(([v, l]) => ({ value: v, label: l }))
const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))

interface ImagePreview { base64: string; preview: string; isPrimary: boolean }

export default function NewPropertyPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [pageReady, setPageReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState<ImagePreview[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  // Auth guard — only landlords allowed
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/auth'); return }
    if (user.role !== 'LANDLORD') { router.replace('/'); return }
    setPageReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const DRAFT_KEY = 'property_draft'

  const [form, setForm] = useState(() => {
    // Restore draft from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return {
      title: '', description: '', listingType: 'RENT', propertyType: 'APARTMENT',
      subCity: 'FASILO', kebele: '', streetAddress: '',
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
      price: '', priceNegotiable: false, bedrooms: '0', bathrooms: '0', areaSqm: '',
      hasWaterTank: false, hasBackupPower: false, isFurnished: false,
      hasParking: false, hasInternet: false, hasGuard: false,
      distBduMain: '', distLakeTana: '', distCityCenter: '', distMarket: '',
    }
  })

  // Auto-save draft to localStorage on form change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    }
  }, [form])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const toggle = (key: string) => () => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 10) { toast.error('Maximum 10 images allowed'); return }
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = ev => {
        const base64 = ev.target?.result as string
        setImages(prev => [...prev, { base64, preview: base64, isPrimary: prev.length === 0 }])
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadImages(): Promise<{ url: string; thumbnailUrl: string; isPrimary: boolean; sortOrder: number }[]> {
    setUploadingImages(true)
    const results = []
    for (let i = 0; i < images.length; i++) {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64: images[i].base64 }),
      })
      const data = await res.json()
      if (res.ok) results.push({ ...data, isPrimary: images[i].isPrimary, sortOrder: i })
    }
    setUploadingImages(false)
    return results
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.price || !form.subCity) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      let uploadedImages: { url: string; thumbnailUrl: string; isPrimary: boolean; sortOrder: number }[] = []
      if (images.length > 0) uploadedImages = await uploadImages()

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          areaSqm: form.areaSqm ? Number(form.areaSqm) : undefined,
          distBduMain:    form.distBduMain    ? Number(form.distBduMain)    : undefined,
          distLakeTana:   form.distLakeTana   ? Number(form.distLakeTana)   : undefined,
          distCityCenter: form.distCityCenter ? Number(form.distCityCenter) : undefined,
          distMarket:     form.distMarket     ? Number(form.distMarket)     : undefined,
          images: uploadedImages,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create listing'); return }
      toast.success('Property listed successfully!')
      localStorage.removeItem(DRAFT_KEY)
      router.push('/dashboard/landlord')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const amenityToggles = [
    { key: 'hasWaterTank', label: '💧 Water Tank' },
    { key: 'hasBackupPower', label: '⚡ Backup Power' },
    { key: 'isFurnished', label: '🛋 Furnished' },
    { key: 'hasParking', label: '🚗 Parking' },
    { key: 'hasInternet', label: '📶 Internet' },
    { key: 'hasGuard', label: '🛡 Guard/Security' },
  ]

  if (!pageReady) {
    return <div className="max-w-3xl mx-auto px-4 py-16 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">List a New Property</h1>
        <p className="text-gray-500 mt-1">Fill in the details to publish your listing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Basic Information</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Title *" placeholder="e.g. 2-Bedroom Apartment near BDU" value={form.title} onChange={set('title')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4}
                placeholder="Describe the property, neighborhood, and any special features..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Listing Type *" value={form.listingType} onChange={set('listingType')}
                options={[{ value: 'RENT', label: 'For Rent' }, { value: 'SALE', label: 'For Sale' }]} />
              <Select label="Property Type *" value={form.propertyType} onChange={set('propertyType')} options={propertyTypeOptions} />
            </div>
          </CardBody>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Location</h2></CardHeader>
          <CardBody className="space-y-4">
            <Select label="Sub-City *" value={form.subCity} onChange={set('subCity')} options={subCityOptions} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Kebele" placeholder="e.g. 01" value={form.kebele} onChange={set('kebele')} />
              <Input label="Street Address" placeholder="e.g. Near Abay Hotel" value={form.streetAddress} onChange={set('streetAddress')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GPS Location (optional)</label>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                onClear={() => setForm(f => ({ ...f, latitude: undefined, longitude: undefined }))}
              />
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Distance to Landmarks (meters)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="BDU Main Campus" type="number" placeholder="e.g. 500" value={form.distBduMain} onChange={set('distBduMain')} />
              <Input label="Lake Tana" type="number" placeholder="e.g. 1200" value={form.distLakeTana} onChange={set('distLakeTana')} />
              <Input label="City Center" type="number" placeholder="e.g. 800" value={form.distCityCenter} onChange={set('distCityCenter')} />
              <Input label="Market" type="number" placeholder="e.g. 300" value={form.distMarket} onChange={set('distMarket')} />
            </div>
          </CardBody>
        </Card>

        {/* Pricing & Specs */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Pricing & Specifications</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (ETB) *" type="number" placeholder="e.g. 5000" value={form.price} onChange={set('price')} />
              <Input label="Area (m²)" type="number" placeholder="e.g. 80" value={form.areaSqm} onChange={set('areaSqm')} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.priceNegotiable} onChange={toggle('priceNegotiable')}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-700">Price is negotiable</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Bedrooms" value={form.bedrooms} onChange={set('bedrooms')}
                options={[0,1,2,3,4,5,6].map(n => ({ value: String(n), label: n === 0 ? 'Studio/Open' : `${n} Bedroom${n > 1 ? 's' : ''}` }))} />
              <Select label="Bathrooms" value={form.bathrooms} onChange={set('bathrooms')}
                options={[0,1,2,3,4].map(n => ({ value: String(n), label: n === 0 ? 'Shared' : `${n} Bathroom${n > 1 ? 's' : ''}` }))} />
            </div>
          </CardBody>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Amenities</h2></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenityToggles.map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form[key as keyof typeof form] ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" checked={!!form[key as keyof typeof form]} onChange={toggle(key)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Photos (up to 10)</h2></CardHeader>
          <CardBody className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
              <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img.preview} alt="" className="w-full h-20 object-cover rounded-lg" />
                    {img.isPrimary && (
                      <span className="absolute bottom-1 left-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded">Main</span>
                    )}
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Button type="submit" loading={submitting || uploadingImages} size="lg" className="w-full">
          <Upload className="w-4 h-4" />
          {uploadingImages ? 'Uploading images...' : 'Publish Listing'}
        </Button>
      </form>
    </div>
  )
}
