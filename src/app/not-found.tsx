import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6">🏚️</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-3">404 — Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The page or property you are looking for does not exist or has been removed.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors">
        <Home className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  )
}
