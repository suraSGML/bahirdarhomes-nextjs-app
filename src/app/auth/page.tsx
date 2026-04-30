'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Home, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user } = useAuth()

  const isRegister = searchParams.get('mode') === 'register'

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Register fields
  const [regForm, setRegForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'TENANT' as 'TENANT' | 'LANDLORD' })
  // Login fields
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!regForm.fullName.trim()) { toast.error('Full name is required'); return }
    if (!regForm.email)           { toast.error('Email is required'); return }
    if (regForm.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (regForm.password !== regForm.confirmPassword) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regForm.email, password: regForm.password, fullName: regForm.fullName, role: regForm.role }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      login(data.token, data.user)
      toast.success(`Welcome, ${data.user.fullName}!`)
      router.push(data.user.role === 'LANDLORD' ? '/dashboard/landlord' : '/')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) { toast.error('Email and password are required'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      login(data.token, data.user)
      toast.success(`Welcome back${data.user.fullName ? `, ${data.user.fullName}` : ''}!`)
      const redirect =
        data.user.role === 'ADMIN'    ? '/dashboard/admin' :
        data.user.role === 'LANDLORD' ? '/dashboard/landlord' : '/'
      router.push(redirect)
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary-700">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span>BahirDar<span className="text-ethiopian-green">Homes</span></span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">
            {isRegister ? 'Create your account to list or find properties' : 'Sign in to your account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <Link href="/auth"
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors ${
              !isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            Sign In
          </Link>
          <Link href="/auth?mode=register"
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors ${
              isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            Create Account
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {isRegister ? (
            /* ── Register Form ── */
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account</h2>

              <Input
                label="Full Name"
                placeholder="Abebe Kebede"
                value={regForm.fullName}
                onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))}
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={regForm.email}
                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Select
                label="I want to"
                value={regForm.role}
                onChange={e => setRegForm(f => ({ ...f, role: e.target.value as 'TENANT' | 'LANDLORD' }))}
                options={[
                  { value: 'TENANT',   label: '🔍 Find a property (Tenant)' },
                  { value: 'LANDLORD', label: '🏠 List my property (Landlord)' },
                ]}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {regForm.password.length > 0 && (() => {
                const p = regForm.password
                const checks = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)]
                const score = checks.filter(Boolean).length
                const labels = ['Weak', 'Fair', 'Good', 'Strong']
                const colors = ['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']
                return (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score-1] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-yellow-600' : score === 3 ? 'text-blue-600' : 'text-green-600'}`}>
                      {labels[score - 1] || 'Too short'}
                    </p>
                  </div>
                )
              })()}

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={regForm.confirmPassword}
                onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Create Account
              </Button>
            </form>
          ) : (
            /* ── Login Form ── */
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h2>

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign In
              </Button>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/auth?mode=register" className="text-primary-600 font-medium hover:underline">
                  Create one free
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="hover:underline">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
