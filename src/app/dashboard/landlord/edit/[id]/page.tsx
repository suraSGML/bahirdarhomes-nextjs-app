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
import { ArrowLeft, Save, ImagePlus, X, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface ExistingImage {
  id: string
  url: string
  thumbnailUrl?: string | null
  isPrimary: boolean
  sortOrder: number
}

interface NewImage {
  base64: string
  preview: string
}

interface FormState {
  title: string; description: string; price: string; priceNegotiable: boolean
  bedrooms: string; bathrooms: string; areaSqm: string; streetAddress: string; kebele: string
  latitude: number | undefined; longitude: number | undefined
  hasWaterTank: boolean; hasBackupPower: boolean; isFurnished: boolean
  hasParking: boolean; hasInternet: boolean; hasGuard: boolean; isActive: boolean
  distBduMain: string; distLakeTana: string; distCityCenter: string; distMarket: string
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { token, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [propertyId, setPropertyId] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)

  // Existing images from DB
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [deleteImageIds, setDeleteImageIds] = useState<string[]>([])
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null)

  // New images to upload
  const [newImages, setNewImages] = useState<NewImage[]>([])

  const [form, setForm] = useState<FormState>({
    title: '', description: '', price: '', priceNegotiable: false,
    bedrooms: '0', bathrooms: '0', areaSqm: '', streetAddress: '', kebele: '',
    latitude: undefined, longitude: undefined,
    hasWaterTank: false, hasBackupPower: false, isFurnished: false,
    hasParking: false, hasInternet: false, hasGuard: false, isActive: true,
    distBduMain: '', distLakeTana: '', distCityCenter: '', distMarket: '',
  })

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    params.then(({ id }) => {
      setPropertyId(id)
      fetch(`/api/properties/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            setForm({
              title:          data.title || '',
              description:    data.description || '',
              price:          String(data.price || ''),
              priceNegotiable:data.priceNegotiable || false,
              bedrooms:       String(data.bedrooms || 0),
              bathrooms:      String(data.bathrooms || 0),
              areaSqm:        data.areaSqm ? String(data.areaSqm) : '',
              streetAddress:  data.streetAddress || '',
              kebele:         data.kebele || '',
              latitude:       data.latitude ?? undefined,
              longitude:      data.longitude ?? undefined,
              hasWaterTank:   data.hasWaterTank || false,
              hasBackupPower: data.hasBackupPower || false,
              isFurnished:    data.isFurnished || false,
              hasParking:     data.hasParking || false,
              hasInternet:    data.hasInternet || false,
              hasGuard:       data.hasGuard || false,
              isActive:       data.isActive ?? true,
              distBduMain:    data.distBduMain ? String(data.distBduMain) : '',
              distLakeTana:   data.distLakeTana ? String(data.distLakeTana) : '',
              distCityCenter: data.distCityCenter ? String(data.distCityCenter) : '',
              distMarket:     data.distMarket ? String(data.distMarket) : '',
            })
            setExistingImages(data.images || [])
            const primary = data.images?.find((i: ExistingImage) => i.isPrimary)
            if (primary) setPrimaryImageId(primary.id)
          }
        })
        .finally(() => setFetching(false))
    })
  }, [params])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f: FormState) => ({ ...f, [key]: e.target.value }))

  const toggle = (key: keyof FormState) => () =>
    setForm((f: FormState) => ({ ...f, [key]: !f[key] }))

  function handleNewImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const activeExisting = existingImages.filter(i => !deleteImageIds.includes(i.id)).length
    if (activeExisting + newImages.length + files.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = ev => {
        const base64 = ev.target?.result as string
        setNewImages(prev => [...prev, { base64, preview: base64 }])
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  function markDeleteExisting(id: string) {
    setDeleteImageIds(prev => [...prev, id])
    if (primaryImageId === id) {
      // Auto-assign primary to next available
      const next = existingImages.find(i => i.id !== id && !deleteImageIds.includes(i.id))
      setPrimaryImageId(next?.id || null)
    }
  }

  async function uploadNewImages() {
    setUploadingImages(true)
    const results = []
    for (let i = 0; i < newImages.length; i++) {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64: newImages[i].base64 }),
      })
      const data = await res.json()
      if (res.ok) {
        results.push({ url: data.url, thumbnailUrl: data.thumbnailUrl, isPrimary: false, sortOrder: existingImages.length + i })
      } else {
        toast.error(`Failed to upload image ${i + 1}`)
      }
    }
    setUploadingImages(false)
    return results
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.price) { toast.error('Title and price are required'); return }
    setSaving(true)
    try {
      let addImages: { url: string; thumbnailUrl?: string; isPrimary: boolean; sortOrder: number }[] = []
      if (newImages.length > 0) addImages = await uploadNewImages()

      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price:          Number(form.price),
          bedrooms:       Number(form.bedrooms),
          bathrooms:      Number(form.bathrooms),
          areaSqm:        form.areaSqm        ? Number(form.areaSqm)        : null,
          distBduMain:    form.distBduMain    ? Number(form.distBduMain)    : null,
          distLakeTana:   form.distLakeTana   ? Number(form.distLakeTana)   : null,
          distCityCenter: form.distCityCenter ? Number(form.distCityCenter) : null,
          distMarket:     form.distMarket     ? Number(form.distMarket)     : null,
          latitude:       form.latitude  ?? null,
          longitude:      form.longitude ?? null,
          addImages:      addImages.length ? addImages : undefined,
          deleteImageIds: deleteImageIds.length ? deleteImageIds : undefined,
          primaryImageId: primaryImageId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to update'); return }
      toast.success('Property updated!')
      router.push('/dashboard/landlord')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const amenityToggles: { key: keyof FormState; label: string }[] = [
    { key: 'hasWaterTank',   label: '💧 Water Tank' },
    { key: 'hasBackupPower', label: '⚡ Backup Power' },
    { key: 'isFurnished',    label: '🛋 Furnished' },
    { key: 'hasParking',     label: '🚗 Parking' },
    { key: 'hasInternet',    label: '📶 Internet' },
    { key: 'hasGuard',       label: '🛡 Guard/Security' },
  ]

  const activeExisting = existingImages.filter(i => !deleteImageIds.includes(i.id))
  const totalImages = activeExisting.length + newImages.length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/landlord">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update your listing details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Basic Information</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Title *" value={form.title} onChange={set('title')} placeholder="e.g. 2-Bedroom Apartment near BDU" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Describe the property..." />
            </div>
          </CardBody>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Photos</h2>
              <span className="text-xs text-gray-400">{totalImages}/10 images</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Existing images */}
            {activeExisting.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Current photos — click ★ to set as main, 🗑 to remove</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {activeExisting.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={img.thumbnailUrl || img.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                      {primaryImageId === img.id && (
                        <span className="absolute bottom-1 left-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded">Main</span>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setPrimaryImageId(img.id)}
                          className="w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center text-xs shadow">
                          <Star className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => markDeleteExisting(img.id)}
                          className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New images to add */}
            {newImages.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">New photos to upload</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {newImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.preview} alt="" className="w-full h-20 object-cover rounded-lg border-2 border-dashed border-primary-300" />
                      <button type="button" onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            {totalImages < 10 && (
              <label className="flex items-center justify-center gap-2 w-full h-16 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <ImagePlus className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Add more photos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewImageSelect} />
              </label>
            )}
          </CardBody>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Location</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Kebele" value={form.kebele} onChange={set('kebele')} placeholder="e.g. 01" />
              <Input label="Street Address" value={form.streetAddress} onChange={set('streetAddress')} placeholder="e.g. Near Abay Hotel" />
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
              <Input label="BDU Main Campus" type="number" value={form.distBduMain} onChange={set('distBduMain')} />
              <Input label="Lake Tana" type="number" value={form.distLakeTana} onChange={set('distLakeTana')} />
              <Input label="City Center" type="number" value={form.distCityCenter} onChange={set('distCityCenter')} />
              <Input label="Market" type="number" value={form.distMarket} onChange={set('distMarket')} />
            </div>
          </CardBody>
        </Card>

        {/* Pricing & Specs */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Pricing & Specs</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (ETB) *" type="number" value={form.price} onChange={set('price')} />
              <Input label="Area (m²)" type="number" value={form.areaSqm} onChange={set('areaSqm')} />
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

        {/* Listing Status */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Listing Status</h2></CardHeader>
          <CardBody>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary-600' : 'bg-gray-300'}`}
                onClick={toggle('isActive')}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{form.isActive ? 'Active' : 'Inactive'}</p>
                <p className="text-xs text-gray-500">{form.isActive ? 'Visible to tenants' : 'Hidden from search'}</p>
              </div>
            </label>
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Link href="/dashboard/landlord" className="flex-1">
            <Button variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving || uploadingImages} className="flex-1">
            <Save className="w-4 h-4" />
            {uploadingImages ? 'Uploading images…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
