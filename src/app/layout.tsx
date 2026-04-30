import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthContext'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: { default: 'BahirDar Homes', template: '%s | BahirDar Homes' },
  description: 'Find and list rental homes, apartments, and properties in Bahir Dar, Ethiopia.',
  keywords: ['Bahir Dar', 'houses for rent', 'Ethiopia real estate', 'apartments Bahir Dar'],
  openGraph: {
    title: 'BahirDar Homes',
    description: 'Find your perfect home in Bahir Dar, Ethiopia',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <ErrorBoundary>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { borderRadius: '10px', fontSize: '14px' },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
