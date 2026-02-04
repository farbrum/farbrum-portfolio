import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Loader2 } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function makeIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  })
}
const icons = { red: makeIcon('red'), blue: makeIcon('blue'), orange: makeIcon('orange'), green: makeIcon('green') }

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function roadDistance(lat1, lon1, lat2, lon2) {
  return haversineDistance(lat1, lon1, lat2, lon2) * 1.35
}

export default function MapPicker({ markers = [], activeMarker, onMarkerPlace, height = '350px' }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersLayer = useRef({})
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (mapInstance.current) return
    const map = L.map(mapRef.current, { center: [46.2, 2.2], zoom: 6, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM', maxZoom: 19 }).addTo(map)
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    const map = mapInstance.current; if (!map) return
    const handler = (e) => { if (activeMarker && onMarkerPlace) onMarkerPlace(activeMarker, e.latlng.lat, e.latlng.lng) }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [activeMarker, onMarkerPlace])

  useEffect(() => {
    const map = mapInstance.current; if (!map) return
    Object.values(markersLayer.current).forEach(m => map.removeLayer(m))
    markersLayer.current = {}
    const bounds = []
    markers.forEach(m => {
      if (m.lat && m.lng) {
        const mk = L.marker([m.lat, m.lng], { icon: icons[m.color] || icons.blue }).addTo(map)
        mk.bindPopup(`<b>${m.label}</b><br>${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}`)
        markersLayer.current[m.id] = mk; bounds.push([m.lat, m.lng])
      }
    })
    if (bounds.length >= 2) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    else if (bounds.length === 1) map.setView(bounds[0], 13)
  }, [markers])

  // Recherche d'adresse via API gouv.fr
  const doSearch = async (q) => {
    if (!q || q.length < 3) { setSuggestions([]); return }
    setSearching(true)
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6`)
      const data = await res.json()
      setSuggestions((data.features || []).map(f => ({
        label: f.properties.label,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      })))
    } catch { setSuggestions([]) }
    setSearching(false)
  }

  const goTo = (s) => {
    const map = mapInstance.current; if (!map) return
    map.setView([s.lat, s.lng], 15)
    setSuggestions([]); setSearchQuery(s.label)
  }

  return (
    <div className="space-y-1.5">
      {/* Barre de recherche — isolée du form parent */}
      <div className="relative flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); doSearch(e.target.value) }}
            onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();e.stopPropagation();doSearch(searchQuery)} }}
            placeholder="Rechercher ville, adresse..."
            className="w-full h-9 pl-8 pr-3 bg-bg-input border border-white/10 rounded text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose" />
          {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose animate-spin" />}
        </div>
        <button type="button" onClick={() => doSearch(searchQuery)}
          className="h-9 px-3 bg-rose hover:bg-rose-light text-white text-xs font-semibold rounded flex items-center space-x-1 shrink-0">
          <Search className="w-3.5 h-3.5" /><span>Chercher</span>
        </button>
        {suggestions.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-full mt-0.5 bg-bg-card border border-rose/20 rounded shadow-lg max-h-48 overflow-y-auto" style={{right:0,left:0}}>
            {suggestions.map((s, i) => (
              <button key={i} type="button" onClick={() => goTo(s)}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-rose/10 hover:text-white transition-all border-b border-white/5 last:border-b-0">
                📍 {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Carte */}
      <div className={`rounded border border-rose/20 overflow-hidden ${activeMarker ? 'cursor-crosshair' : ''}`}>
        <div ref={mapRef} style={{ height, width: '100%' }} />
      </div>
    </div>
  )
}
