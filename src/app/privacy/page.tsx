import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="text-sm text-primary-600 hover:underline mb-6 inline-block">← Back to Home</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: January 2025</p>

      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        {[
          {
            title: '1. Information We Collect',
            body: 'We collect your email address and password (stored as a secure hash) for authentication, your full name if provided, and property listing details. We also collect usage data such as property views and search queries to improve our service.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'Your email is used for account authentication. Your name and listing details are displayed publicly on the platform. We do not sell your personal information to third parties.',
          },
          {
            title: '3. Password Security',
            body: 'Passwords are hashed using bcrypt with a cost factor of 12 before storage. We never store plain-text passwords. You should use a strong, unique password for your account.',
          },
          {
            title: '4. Data Storage',
            body: 'Your data is stored securely on Supabase (PostgreSQL) servers. Images are stored on Cloudinary. We use industry-standard security measures to protect your data.',
          },
          {
            title: '5. Cookies',
            body: 'We use a secure HTTP-only cookie to maintain your login session for up to 30 days. This cookie does not track you across other websites.',
          },
          {
            title: '6. Your Rights',
            body: 'You may request deletion of your account and associated data at any time by contacting us. You may also update your profile information through your dashboard.',
          },
          {
            title: '7. Third-Party Services',
            body: 'We use Cloudinary for image storage and Supabase for database hosting. These services have their own privacy policies which we encourage you to review.',
          },
          {
            title: '8. Contact',
            body: 'For privacy concerns, contact us at privacy@bahirdarhomes.et',
          },
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
