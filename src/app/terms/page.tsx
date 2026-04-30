import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="text-sm text-primary-600 hover:underline mb-6 inline-block">← Back to Home</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-500 mb-8">Last updated: January 2025</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        {[
          { title: '1. Acceptance of Terms', body: 'By accessing and using BahirDar Homes, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
          { title: '2. Use of the Platform', body: 'BahirDar Homes is a property listing platform for Bahir Dar, Ethiopia. Users may browse, list, and inquire about properties. You agree to use the platform only for lawful purposes.' },
          { title: '3. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account. You must provide accurate information when registering. We reserve the right to suspend accounts that violate these terms.' },
          { title: '4. Property Listings', body: 'Landlords are responsible for the accuracy of their listings. BahirDar Homes does not guarantee the accuracy of any listing. All listings are subject to admin verification before being marked as verified.' },
          { title: '5. Prohibited Activities', body: 'You may not post false or misleading listings, harass other users, attempt to circumvent our security measures, or use the platform for any illegal activity.' },
          { title: '6. Limitation of Liability', body: 'BahirDar Homes is not liable for any disputes between landlords and tenants. We provide a platform for connection only and are not a party to any rental agreements.' },
          { title: '7. Changes to Terms', body: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.' },
          { title: '8. Contact', body: 'For questions about these terms, contact us at info@bahirdarhomes.et' },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
