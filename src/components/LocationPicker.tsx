'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Locate, X } from 'lucide-react'

interface Props {
  latitude?: number
  longitude?: number
  onChange: (lat: number, lng: number) => void
  onClear: () => void
}

// Bahir Dar city center
const DEFAULT_LAT = 11.5936
const DEFAULT_LNG = 37.3906

export function LocationPicker({ latitude, longitude, onChange, onClear }: Props) {
  const [detecting, setDetecting] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [showMap, setShowMap] = useState(!!(latitude && longitude))
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<{
    map: L.Map
    marker: L.Marker
  } | null>(null)

  // Dynamically load Leaflet only on client
  useEffect(() => {
    if (!showMap) return
    let cancelled = false

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css' as never)

      if (cancelled || !mapRef.current || leafletRef.current) return

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const lat = latitude || DEFAULT_LAT
      const lng = longitude || DEFAULT_LNG

      const map = L.map(mapRef.current).setView([lat, lng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)))
      })

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        onChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)))
      })

      leafletRef.current = { map, marker }
      setMapReady(true)
    }

    initMap()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  // Keep marker in sync when lat/lng change externally
  useEffect(() => {
    if (!leafletRef.current || !latitude || !longitude) return
    leafletRef.current.marker.setLatLng([latitude, longitude])
    leafletRef.current.map.setView([latitude, longitude], leafletRef.current.map.getZoom())
  }, [latitude, longitude])

  function detectLocation() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const lng = parseFloat(pos.coords.longitude.toFixed(6))
        onChange(lat, lng)
        setShowMap(true)
        setDetecting(false)
      },
      () => {
        setDetecting(false)
        // Fall back to Bahir Dar center
        onChange(DEFAULT_LAT, DEFAULT_LNG)
        setShowMap(true)
      },
      { timeout: 8000 }
    )
  }

  function handleClear() {
    onClear()
    setShowMap(false)
    if (leafletRef.current) {
      leafletRef.current.map.remove()
      leafletRef.current = null
      setMapReady(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors disabled:opacity-60"
        >
          <Locate className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
          {detecting ? 'Detecting…' : 'Use My Location'}
        </button>

        {!showMap && (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Pick on Map
          </button>
        )}

        {(latitude && longitude) ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <MapPin className="w-3.5 h-3.5 text-green-500" />
            <span className="font-mono">{latitude}, {longitude}</span>
            <button type="button" onClick={handleClear} className="text-gray-400 hover:text-red-500 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No location set (optional)</span>
        )}
      </div>

      {showMap && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
            </div>
          )}
          <div ref={mapRef} className="h-64 w-full" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
            Click map or drag pin to set location
          </div>
        </div>
      )}
    </div>
  )
}
