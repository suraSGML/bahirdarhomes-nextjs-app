'use client'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/Button'
import { Card, CardBody, CardHeader } from './ui/Card'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface Props {
  propertyId: string
  ownerName?: string | null
}

export function InquiryForm({ propertyId, ownerName }: Props) {
  const { user, token } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || message.length < 10) {
      toast.error('Message must be at least 10 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertyId, message }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to send'); return }
      setSent(true)
      toast.success('Inquiry sent! The landlord will contact you.')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardBody className="text-center py-6">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm mb-4">Sign in to send an inquiry to {ownerName || 'the landlord'}</p>
          <Link href="/auth">
            <Button className="w-full">Sign In to Inquire</Button>
          </Link>
        </CardBody>
      </Card>
    )
  }

  if (sent) {
    return (
      <Card>
        <CardBody className="text-center py-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Inquiry Sent!</p>
          <p className="text-sm text-gray-500">The landlord will reach out to you via email.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-600" /> Send Inquiry
        </h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={`Hi, I'm interested in this property. Is it still available?`}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400">{message.length}/1000 characters</p>
          <Button type="submit" loading={loading} className="w-full">
            Send Message
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
