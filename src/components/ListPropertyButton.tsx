'use client'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  className?: string
  children: React.ReactNode
}

export function ListPropertyButton({ className, children }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()

  function handleClick() {
    if (loading) return

    if (!user) {
      // Not logged in → send to register as landlord
      router.push('/auth?mode=register')
      return
    }

    if (user.role === 'LANDLORD') {
      // Logged-in landlord → go straight to new listing
      router.push('/dashboard/landlord/new')
      return
    }

    if (user.role === 'ADMIN') {
      toast.error('Admins cannot list properties. Use a landlord account.')
      return
    }

    // Tenant → prompt to create a landlord account
    toast.error('You need a landlord account to list properties. Please register as a landlord.')
    router.push('/auth?mode=register')
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
