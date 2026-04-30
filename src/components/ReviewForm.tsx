'use client'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/Button'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Star } from 'lucide-react'

export function ReviewForm({ propertyId, onSubmit }: { propertyId: string; onSubmit?: () => void }) {
  const { user, token } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-center">
        <p className="text-sm text-gray-500 mb-3">Sign in to leave a review</p>
        <Link href="/auth" className="text-primary-600 font-medium text-sm hover:underline">Sign In →</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 rounded-xl text-center">
        <p className="text-sm font-semibold text-green-700">✅ Review submitted! Thank you.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a rating'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertyId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); return }
      setSubmitted(true)
      onSubmit?.()
      toast.success('Review submitted!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-gray-800">Leave a Review</p>
      {/* Star rating */}
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="transition-transform hover:scale-110">
            <Star className={`w-7 h-7 ${n <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-gray-500 ml-2 self-center">{['','Poor','Fair','Good','Very Good','Excellent'][rating]}</span>}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
      />
      <Button type="submit" loading={loading} size="sm">Submit Review</Button>
    </form>
  )
}
