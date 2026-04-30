import Link from 'next/link'
import { Home, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-3">
              <Home className="w-6 h-6 text-primary-400" />
              <span>BahirDar<span className="text-green-400">Homes</span></span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Bahir Dar&apos;s trusted platform for finding and listing rental homes and properties.
            </p>
            {/* Ethiopian flag colors bar */}
            <div className="flex mt-4 h-1 rounded-full overflow-hidden w-24">
              <div className="flex-1 bg-ethiopian-green" />
              <div className="flex-1 bg-ethiopian-yellow" />
              <div className="flex-1 bg-ethiopian-red" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties" className="hover:text-white transition-colors">All Properties</Link></li>
              <li><Link href="/properties?listingType=RENT" className="hover:text-white transition-colors">For Rent</Link></li>
              <li><Link href="/properties?listingType=SALE" className="hover:text-white transition-colors">For Sale</Link></li>
              <li><Link href="/auth?mode=register" className="hover:text-white transition-colors">List Your Property</Link></li>
            </ul>
          </div>

          {/* Sub-Cities */}
          <div>
            <h3 className="text-white font-semibold mb-4">Sub-Cities</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties?subCity=FASILO" className="hover:text-white transition-colors">Fasilo</Link></li>
              <li><Link href="/properties?subCity=TANA" className="hover:text-white transition-colors">Tana</Link></li>
              <li><Link href="/properties?subCity=BELAY_ZELEKE" className="hover:text-white transition-colors">Belay Zeleke</Link></li>
              <li><Link href="/properties?subCity=GINBOT_20" className="hover:text-white transition-colors">Ginbot 20</Link></li>
              <li><Link href="/properties?subCity=SEFENE_SELAM" className="hover:text-white transition-colors">Sefene Selam</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                <span>Bahir Dar, Amhara Region, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <span>info@bahirdarhomes.et</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BahirDar Homes. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
