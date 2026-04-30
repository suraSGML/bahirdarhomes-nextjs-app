'use client'
import { Share2 } from 'lucide-react'

export function ShareButton({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title, url: window.location.href })
        } else {
          navigator.clipboard.writeText(window.location.href)
          alert('Link copied!')
        }
      }}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary-300"
    >
      <Share2 className="w-4 h-4" /> Share
    </button>
  )
}
