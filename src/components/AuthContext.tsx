'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UserRole } from '@/types'

interface AuthState {
  userId: string
  email: string
  role: UserRole
  fullName?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: AuthState | null
  token: string | null
  loading: boolean
  login: (token: string, user: AuthState) => void
  logout: () => void
  isRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: true,
  login: () => {}, logout: () => {}, isRole: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('auth')
    if (stored) {
      try {
        const { token, user } = JSON.parse(stored)
        setToken(token)
        setUser(user)
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = useCallback((token: string, user: AuthState) => {
    localStorage.setItem('auth', JSON.stringify({ token, user }))
    setToken(token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth')
    setToken(null)
    setUser(null)
    document.cookie = 'auth_token=; Max-Age=0; path=/'
    window.location.href = '/'
  }, [])

  const isRole = useCallback((role: UserRole) => user?.role === role, [user])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
