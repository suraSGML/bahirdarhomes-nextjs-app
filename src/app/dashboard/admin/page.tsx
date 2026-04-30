'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/api'
import { SUB_CITY_LABELS } from '@/types'
import {
  CheckCircle, XCircle, Clock, Home, Users, Eye, ShieldCheck,
  UserCheck, UserX, Trash2, Crown, Search,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

/* ── Types ── */
interface AdminProperty {
  id: string
  title: string
  subCity: string
  price: number
  listingType: string
  verificationStatus: string
  viewCount: number
  isActive: boolean
  createdAt: string
  owner: { fullName?: string; email: string }
}

interface AdminUser {
  id: string
  email: string
  fullName?: string | null
  role: 'TENANT' | 'LANDLORD' | 'ADMIN'
  isActive: boolean
  createdAt: string
  _count: { properties: number; inquiries: number }
}

type Tab = 'properties' | 'users'
type VerifFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'

/* ── Helpers ── */
const statusBadge = (s: string) =>
  s === 'VERIFIED' ? <Badge variant="verified"><CheckCircle className="w-3 h-3" />Verified</Badge> :
  s === 'REJECTED' ? <Badge variant="danger"><XCircle className="w-3 h-3" />Rejected</Badge> :
  s === 'PENDING'  ? <Badge variant="warning"><Clock className="w-3 h-3" />Pending</Badge> :
  <Badge variant="default">Standard</Badge>

const roleBadge = (r: string) =>
  r === 'ADMIN'    ? <Badge variant="danger"><Crown className="w-3 h-3" />Admin</Badge> :
  r === 'LANDLORD' ? <Badge variant="info">Landlord</Badge> :
  <Badge variant="default">Tenant</Badge>

/* ══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, token, loading } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('properties')

  /* properties state */
  const [properties, setProperties]   = useState<AdminProperty[]>([])
  const [propFetching, setPropFetching] = useState(true)
  const [verifFilter, setVerifFilter] = useState<VerifFilter>('PENDING')
  const [notes, setNotes]             = useState<Record<string, string>>({})
  const [propSearch, setPropSearch]   = useState('')
  const [propPage, setPropPage]       = useState(1)
  const [propTotal, setPropTotal]     = useState(0)
  const PROP_PAGE_SIZE = 20

  /* users state */
  const [users, setUsers]           = useState<AdminUser[]>([])
  const [userFetching, setUserFetching] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [usersFetched, setUsersFetched] = useState(false)

  /* ── Auth guard ── */
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/auth')
  }, [user, loading, router])

  /* ── Fetch properties ── */
  useEffect(() => {
    if (!token) return
    setPropFetching(true)
    const params = new URLSearchParams({ limit: String(PROP_PAGE_SIZE), page: String(propPage), showAll: 'true' })
    if (propSearch) params.set('search', propSearch)
    if (verifFilter !== 'ALL') params.set('verificationStatus', verifFilter)
    fetch(`/api/properties?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setProperties(data.properties || []); setPropTotal(data.total || 0) })
      .finally(() => setPropFetching(false))
  }, [token, propPage, propSearch, verifFilter])

  /* ── Fetch users (lazy, on tab switch) ── */
  const fetchUsers = useCallback(() => {
    if (!token || usersFetched) return
    setUserFetching(true)
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setUsers(data.users || []); setUsersFetched(true) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setUserFetching(false))
  }, [token, usersFetched])

  useEffect(() => {
    if (tab === 'users') fetchUsers()
  }, [tab, fetchUsers])

  /* ── Property verification ── */
  async function verify(id: string, status: 'VERIFIED' | 'REJECTED') {
    const res = await fetch(`/api/admin/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, notes: notes[id] }),
    })
    if (res.ok) {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, verificationStatus: status } : p))
      toast.success(`Property ${status.toLowerCase()}`)
    } else toast.error('Action failed')
  }

  /* ── User actions ── */
  async function toggleUserActive(u: AdminUser) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !u.isActive }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x))
      toast.success(u.isActive ? 'User deactivated' : 'User activated')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Action failed')
    }
  }

  async function changeRole(u: AdminUser, role: AdminUser['role']) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x))
      toast.success('Role updated')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Action failed')
    }
  }

  async function deleteUser(u: AdminUser) {
    if (!confirm(`Delete ${u.fullName || u.email}? This will also delete all their properties and data.`)) return
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setUsers(prev => prev.filter(x => x.id !== u.id))
      toast.success('User deleted')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Delete failed')
    }
  }

  /* ── Derived data ── */

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  const stats = {
    totalProperties: properties.length,
    pendingVerification: properties.filter(p => p.verificationStatus === 'PENDING').length,
    totalViews: properties.reduce((s, p) => s + p.viewCount, 0),
    verified: properties.filter(p => p.verificationStatus === 'VERIFIED').length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
  }

  if (loading || propFetching) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage properties, users, and platform settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Home className="w-5 h-5 text-primary-600" />,   label: 'Total Properties',  value: stats.totalProperties },
          { icon: <Clock className="w-5 h-5 text-yellow-500" />,   label: 'Pending Review',     value: stats.pendingVerification },
          { icon: <ShieldCheck className="w-5 h-5 text-green-500" />, label: 'Verified',        value: stats.verified },
          { icon: <Users className="w-5 h-5 text-blue-500" />,     label: 'Total Users',        value: usersFetched ? stats.totalUsers : '—' },
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

      {/* Main tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        <button onClick={() => setTab('properties')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'properties' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <Home className="w-4 h-4" /> Properties
        </button>
        <button onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <Users className="w-4 h-4" /> Users
        </button>
      </div>

      {/* ══ PROPERTIES TAB ══ */}
      {tab === 'properties' && (
        <>
          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={propSearch}
              onChange={e => { setPropSearch(e.target.value); setPropPage(1) }}
              placeholder="Search by title, address…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Verification filter */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6 flex-wrap">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(f => (
              <button key={f} onClick={() => { setVerifFilter(f); setPropPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  verifFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {propFetching ? (
              [...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-xl" />)
            ) : properties.length > 0 ? properties.map(p => (
              <Card key={p.id}>
                <CardBody>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link href={`/properties/${p.id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                          {p.title}
                        </Link>
                        {statusBadge(p.verificationStatus)}
                        <Badge variant={p.listingType === 'RENT' ? 'info' : 'success'}>{p.listingType}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span>📍 {SUB_CITY_LABELS[p.subCity as keyof typeof SUB_CITY_LABELS]}</span>
                        <span>💰 {formatPrice(p.price)}</span>
                        <span>👁 {p.viewCount} views</span>
                        <span>👤 {p.owner.fullName || p.owner.email}</span>
                        <span>📅 {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {p.verificationStatus === 'PENDING' && (
                      <div className="flex flex-col gap-2 shrink-0 min-w-[200px]">
                        <input
                          value={notes[p.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Admin notes (optional)"
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => verify(p.id, 'VERIFIED')} className="flex-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Verify
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => verify(p.id, 'REJECTED')} className="flex-1">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )) : (
              <div className="text-center py-16">
                <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">{propSearch ? 'No properties match your search' : 'No properties in this category'}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {propTotal > PROP_PAGE_SIZE && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {(propPage - 1) * PROP_PAGE_SIZE + 1}–{Math.min(propPage * PROP_PAGE_SIZE, propTotal)} of {propTotal}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPropPage(p => p - 1)} disabled={propPage === 1}>← Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPropPage(p => p + 1)} disabled={propPage * PROP_PAGE_SIZE >= propTotal}>Next →</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ USERS TAB ══ */}
      {tab === 'users' && (
        <>
          {/* Search */}
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {userFetching ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-xl" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map(u => (
                <Card key={u.id}>
                  <CardBody>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">
                            {u.fullName || '(No name)'}
                          </span>
                          {roleBadge(u.role)}
                          {!u.isActive && (
                            <Badge variant="danger">Deactivated</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span>✉️ {u.email}</span>
                          <span>🏠 {u._count.properties} properties</span>
                          <span>💬 {u._count.inquiries} inquiries</span>
                          <span>📅 Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions — hide for self */}
                      {u.id !== user?.userId && (
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          {/* Role selector */}
                          <select
                            value={u.role}
                            onChange={e => changeRole(u, e.target.value as AdminUser['role'])}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="TENANT">Tenant</option>
                            <option value="LANDLORD">Landlord</option>
                            <option value="ADMIN">Admin</option>
                          </select>

                          {/* Activate / Deactivate */}
                          <Button
                            size="sm"
                            variant={u.isActive ? 'outline' : 'primary'}
                            onClick={() => toggleUserActive(u)}
                          >
                            {u.isActive
                              ? <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                              : <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                            }
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteUser(u)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {u.id === user?.userId && (
                        <span className="text-xs text-gray-400 italic">You</span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">
                {userSearch ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
