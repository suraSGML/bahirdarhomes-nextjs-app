'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface Props {
  latitude?: number | null
  longitude?: number | null
  title: string
  subCity: string
}

// Bahir Dar sub-city approximate centers
const SUB_CITY_CENTERS: Record<string, [number, number]> = {
  FASILO:       [11.6010, 37.3850],
  BELAY_ZELEKE: [11.5880, 37.3780],
  TANA:         [11.5950, 37.4020],
  GINBOT_20:    [11.5820, 37.3900],
  SEFENE_SELAM: [11.5760, 37.3960],
  SHUM_ABO:     [11.6080, 37.3920],
  HIDAR_11:     [11.5700, 37.3840],
  AZEZO:        [11.6200, 37.4100],
  MESHENTI:     [11.5650, 37.4050],
}
const BAHIR_DAR_CENTER: [number, number] = [11.5936, 37.3906]

export function PropertyMap({ latitude, longitude, title, subCity }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const initialised = useRef(false)
  const hasExactLocation = !!(latitude && longitude)

  useEffect(() => {
    if (initialised.current || !mapRef.current) return
    initialised.current = true

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css' as never)
      if (!mapRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center: [number, number] = hasExactLocation
        ? [latitude!, longitude!]
        : (SUB_CITY_CENTERS[subCity] || BAHIR_DAR_CENTER)

      const zoom = hasExactLocation ? 16 : 14

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView(center, zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      if (hasExactLocation) {
        L.marker([latitude!, longitude!])
          .addTo(map)
          .bindPopup(`<strong>${title}</strong>`)
          .openPopup()
      } else {
        // Show a circle indicating the approximate area
        L.circle(center, { radius: 600, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 })
          .addTo(map)
          .bindPopup(`<strong>${title}</strong><br/><span style="font-size:12px;color:#6b7280">Approximate area shown</span>`)
          .openPopup()
      }

      setReady(true)
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 h-56">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}
      <div ref={mapRef} className="h-56 w-full" />
      {!hasExactLocation && ready && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 pointer-events-none whitespace-nowrap">
          <MapPin className="w-3 h-3" /> Approximate area — exact location not provided
        </div>
      )}
    </div>
  )
}
