'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Property, Inquiry } from '@/types'
import { formatPrice } from '@/lib/api'
import { SUB_CITY_LABELS } from '@/types'
import {
  PlusCircle, Eye, MessageSquare, Home, Edit, Trash2,
  CheckCircle, Clock, XCircle, AlertCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PropertyWithNotes extends Property {
  rejectionNotes?: string | null
  _count?: { reviews: number; inquiries: number }
}

export default function LandlordDashboard() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyWithNotes[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState<'properties' | 'inquiries'>('properties')
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'LANDLORD')) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/properties?ownerId=me&limit=50', { headers }).then(r => r.json()),
      fetch('/api/inquiries?type=received', { headers }).then(r => r.json()),
      fetch('/api/landlord/rejection-notes', { headers }).then(r => r.json()).catch(() => ({})),
    ]).then(([p, i, notes]) => {
      const props: PropertyWithNotes[] = Array.isArray(p?.properties) ? p.properties : []
      // Attach rejection notes
      const notesMap: Record<string, string> = notes || {}
      setProperties(props.map(prop => ({
        ...prop,
        rejectionNotes: notesMap[prop.id] || null,
      })))
      setInquiries(Array.isArray(i) ? i : [])
    }).finally(() => setFetching(false))
  }, [token])

  async function deleteProperty(id: string) {
    if (!confirm('Delete this property? This cannot be undone.')) return
    const res = await fetch(`/api/properties/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setProperties(prev => prev.filter(p => p.id !== id))
      toast.success('Property deleted')
    } else toast.error('Failed to delete')
  }

  async function toggleActive(p: PropertyWithNotes) {
    setTogglingId(p.id)
    const res = await fetch(`/api/properties/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    if (res.ok) {
      setProperties(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !p.isActive } : x))
      toast.success(p.isActive ? 'Listing hidden' : 'Listing activated')
    } else toast.error('Failed to update')
    setTogglingId(null)
  }

  async function sendReply(inquiryId: string) {
    const reply = replyText[inquiryId]?.trim()
    if (!reply || reply.length < 5) { toast.error('Reply must be at least 5 characters'); return }
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inquiryId, reply }),
    })
    if (res.ok) {
      setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status: 'RESPONDED', reply } : i))
      setReplyText(prev => ({ ...prev, [inquiryId]: '' }))
      toast.success('Reply sent!')
    } else toast.error('Failed to send reply')
  }

  const verificationBadge = (p: PropertyWithNotes) => {
    if (p.verificationStatus === 'VERIFIED')
      return <Badge variant="verified"><CheckCircle className="w-3 h-3" />Verified</Badge>
    if (p.verificationStatus === 'PENDING')
      return <Badge variant="warning"><Clock className="w-3 h-3" />Pending Review</Badge>
    if (p.verificationStatus === 'REJECTED')
      return <Badge variant="danger"><XCircle className="w-3 h-3" />Rejected</Badge>
    return <Badge variant="default"><Clock className="w-3 h-3" />Standard</Badge>
  }

  if (loading || fetching) {
    return <div className="max-w-6xl mx-auto px-4 py-12"><div className="animate-pulse h-8 bg-gray-200 rounded w-48" /></div>
  }

  const totalViews = properties.reduce((s, p) => s + p.viewCount, 0)
  const totalInquiries = properties.reduce((s, p) => s + (p._count?.inquiries || 0), 0)
  const pendingInquiries = inquiries.filter(i => i.status === 'PENDING').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your listings and inquiries</p>
        </div>
        <Link href="/dashboard/landlord/new">
          <Button><PlusCircle className="w-4 h-4" /> Add Property</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Home className="w-5 h-5 text-primary-600" />,       label: 'My Listings',      value: properties.length },
          { icon: <Eye className="w-5 h-5 text-blue-500" />,           label: 'Total Views',       value: totalViews },
          { icon: <MessageSquare className="w-5 h-5 text-orange-500" />,label: 'Pending Inquiries', value: pendingInquiries },
          { icon: <CheckCircle className="w-5 h-5 text-green-500" />,  label: 'Verified',          value: properties.filter(p => p.verificationStatus === 'VERIFIED').length },
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
        {(['properties', 'inquiries'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'properties' ? `Properties (${properties.length})` : `Inquiries (${inquiries.length})`}
          </button>
        ))}
      </div>

      {/* Properties Tab */}
      {tab === 'properties' && (
        properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map(p => (
              <Card key={p.id}>
                <CardBody>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link href={`/properties/${p.id}`} className="font-semibold text-gray-900 hover:text-primary-600 truncate">
                          {p.title}
                        </Link>
                        {verificationBadge(p)}
                        <Badge variant={p.listingType === 'RENT' ? 'info' : 'success'}>
                          {p.listingType === 'RENT' ? 'Rent' : 'Sale'}
                        </Badge>
                        {!p.isActive && <Badge variant="danger">Inactive</Badge>}
                      </div>

                      {/* Per-property analytics */}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        <span>{SUB_CITY_LABELS[p.subCity]}</span>
                        <span className="font-semibold text-primary-700">{formatPrice(p.price)}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.viewCount} views</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{p._count?.inquiries || 0} inquiries</span>
                      </div>

                      {/* Rejection reason */}
                      {p.verificationStatus === 'REJECTED' && p.rejectionNotes && (
                        <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-red-700">Rejection reason:</p>
                            <p className="text-xs text-red-600 mt-0.5">{p.rejectionNotes}</p>
                          </div>
                        </div>
                      )}
                      {p.verificationStatus === 'REJECTED' && !p.rejectionNotes && (
                        <p className="mt-1 text-xs text-red-500">
                          Your listing was rejected. Edit and resubmit for review.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quick active toggle */}
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={togglingId === p.id}
                        title={p.isActive ? 'Hide listing' : 'Activate listing'}
                        className="text-gray-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                      >
                        {p.isActive
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-gray-400" />
                        }
                      </button>
                      <Link href={`/dashboard/landlord/edit/${p.id}`}>
                        <Button variant="outline" size="sm"><Edit className="w-3.5 h-3.5" /></Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => deleteProperty(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Home className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No properties listed yet</p>
            <Link href="/dashboard/landlord/new">
              <Button><PlusCircle className="w-4 h-4" /> Add Your First Property</Button>
            </Link>
          </div>
        )
      )}

      {/* Inquiries Tab */}
      {tab === 'inquiries' && (
        inquiries.length > 0 ? (
          <div className="space-y-4">
            {inquiries.map(inq => (
              <Card key={inq.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{inq.sender?.fullName || inq.sender?.email}</p>
                      <p className="text-xs text-gray-500">re: {inq.property?.title}</p>
                    </div>
                    <Badge variant={inq.status === 'RESPONDED' ? 'success' : inq.status === 'CLOSED' ? 'default' : 'warning'}>
                      {inq.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">{inq.message}</p>
                  {inq.reply ? (
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <p className="text-xs font-semibold text-green-700 mb-1">Your reply:</p>
                      <p className="text-sm text-gray-700">{inq.reply}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={replyText[inq.id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [inq.id]: e.target.value }))}
                        placeholder="Type your reply..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button size="sm" onClick={() => sendReply(inq.id)}>Reply</Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No inquiries yet</p>
          </div>
        )
      )}
    </div>
  )
}
