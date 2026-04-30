'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import { PropertyCard } from '@/components/PropertyCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Property, Inquiry } from '@/types'
import { Heart, MessageSquare, Home, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TenantDashboard() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState<Property[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState<'saved' | 'inquiries'>('saved')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/saved', { headers }).then(r => r.json()),
      fetch('/api/inquiries?type=sent', { headers }).then(r => r.json()),
    ]).then(([s, i]) => {
      setSaved(Array.isArray(s) ? s : [])
      setInquiries(Array.isArray(i) ? i : [])
    }).finally(() => setFetching(false))
  }, [token])

  if (loading || fetching) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  const statusVariant = (s: string) =>
    s === 'RESPONDED' ? 'success' : s === 'CLOSED' ? 'default' : 'warning'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.fullName || user?.email} 👋</h1>
        <p className="text-gray-500 mt-1">Manage your saved properties and inquiries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Heart className="w-5 h-5 text-red-500" />, label: 'Saved Properties', value: saved.length },
          { icon: <MessageSquare className="w-5 h-5 text-blue-500" />, label: 'Inquiries Sent', value: inquiries.length },
          { icon: <MessageSquare className="w-5 h-5 text-green-500" />, label: 'Responses Received', value: inquiries.filter(i => i.status === 'RESPONDED').length },
        ].map(({ icon, label, value }) => (
          <Card key={label}>
            <CardBody className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(['saved', 'inquiries'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'saved' ? `Saved (${saved.length})` : `Inquiries (${inquiries.length})`}
          </button>
        ))}
      </div>

      {/* Saved Properties */}
      {tab === 'saved' && (
        saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {saved.map(p => (
              <PropertyCard key={p.id} property={p} saved
                onSaveToggle={(id) => setSaved(prev => prev.filter(p => p.id !== id))} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No saved properties yet</p>
            <Link href="/properties" className="text-primary-600 font-medium hover:underline">Browse Properties →</Link>
          </div>
        )
      )}

      {/* Inquiries */}
      {tab === 'inquiries' && (
        inquiries.length > 0 ? (
          <div className="space-y-4">
            {inquiries.map(inq => (
              <Card key={inq.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="w-4 h-4 text-primary-600" />
                        <Link href={`/properties/${inq.propertyId}`} className="font-semibold text-gray-900 hover:text-primary-600 text-sm">
                          {inq.property?.title || 'Property'}
                        </Link>
                        <Badge variant={statusVariant(inq.status)}>{inq.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{inq.message}</p>
                      {inq.reply && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <p className="text-xs font-semibold text-green-700 mb-1">Landlord replied:</p>
                          <p className="text-sm text-gray-700">{inq.reply}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No inquiries sent yet</p>
          </div>
        )
      )}
    </div>
  )
}
