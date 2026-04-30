'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import { Button } from './ui/Button'
import { Home, Menu, X, User, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  function handleListProperty() {
    if (!user) { router.push('/auth?mode=register'); return }
    if (user.role === 'LANDLORD') { router.push('/dashboard/landlord/new'); return }
    if (user.role === 'ADMIN') { toast.error('Admins cannot list properties.'); return }
    toast.error('You need a landlord account to list properties.')
    router.push('/auth?mode=register')
  }

  const dashboardPath =
    user?.role === 'ADMIN'    ? '/dashboard/admin' :
    user?.role === 'LANDLORD' ? '/dashboard/landlord' :
    '/dashboard/tenant'

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const navLink = (href: string, label: string) => (
    <Link href={href}
      className={cn(
        'text-sm font-medium transition-colors pb-0.5',
        pathname === href || pathname.startsWith(href + '?')
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-600 hover:text-primary-600'
      )}>
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-700 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span>BahirDar<span className="text-ethiopian-green">Homes</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLink('/properties', 'Browse')}
            {navLink('/properties?listingType=RENT', 'For Rent')}
            {navLink('/properties?listingType=SALE', 'For Sale')}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-32 h-8 rounded-lg bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.fullName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{user.fullName || 'User'}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                    </div>
                    <Link href={dashboardPath} onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-primary-500" /> Dashboard
                    </Link>
                    {user.role === 'LANDLORD' && (
                      <Link href="/dashboard/landlord/new" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <PlusCircle className="w-4 h-4 text-green-500" /> Add Property
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth"><Button variant="ghost" size="sm">Sign In</Button></Link>
                <Button size="sm" onClick={handleListProperty}>List Property</Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 shadow-lg">
          {[
            { href: '/properties', label: 'Browse Properties' },
            { href: '/properties?listingType=RENT', label: 'For Rent' },
            { href: '/properties?listingType=SALE', label: 'For Sale' },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className={cn('block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
              )}>
              {label}
            </Link>
          ))}
          <hr className="border-gray-100 my-2" />
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                  {user.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.fullName || user.phone}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <Link href={dashboardPath} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Dashboard</Link>
              {user.role === 'LANDLORD' && (
                <Link href="/dashboard/landlord/new" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Add Property</Link>
              )}
              <button onClick={logout} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link href="/auth" className="flex-1"><Button variant="outline" className="w-full">Sign In</Button></Link>
              <Link href="/auth?mode=register" className="flex-1"><Button className="w-full">Register</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
