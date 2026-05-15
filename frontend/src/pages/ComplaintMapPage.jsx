import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { complaintService } from '../services/complaintService'
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/UI'
import { Link } from 'react-router-dom'
import { Layers, Filter, Search, Thermometer, MapPin as MapPinIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: null, label: 'All Categories', icon: '🗺️' },
  { value: 'SANITATION', label: 'Sanitation', icon: '🗑️' },
  { value: 'WATER_SUPPLY', label: 'Water Supply', icon: '💧' },
  { value: 'ELECTRICITY', label: 'Electricity', icon: '⚡' },
  { value: 'ROAD_MAINTENANCE', label: 'Roads', icon: '🛣️' },
  { value: 'PUBLIC_SAFETY', label: 'Public Safety', icon: '🚔' },
  { value: 'PARKS_GARDENS', label: 'Parks', icon: '🌿' },
  { value: 'NOISE_POLLUTION', label: 'Noise', icon: '🔊' },
  { value: 'ANIMAL_NUISANCE', label: 'Animals', icon: '🐾' },
]

const PRIORITY_COLORS = {
  CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#d97706', LOW: '#22c55e'
}
const CAT_ICONS = {
  SANITATION: '🗑️', WATER_SUPPLY: '💧', ELECTRICITY: '⚡',
  ROAD_MAINTENANCE: '🛣️', PUBLIC_SAFETY: '🚔', PARKS_GARDENS: '🌿',
  NOISE_POLLUTION: '🔊', ANIMAL_NUISANCE: '🐾', OTHER: '📌'
}

// Delhi hotspot zones seeded for demo (real data from DB will overlay)
const DEMO_HOTSPOTS = [
  { name: 'Rohini Sector 7', lat: 28.7041, lng: 77.1025, category: 'SANITATION', intensity: 1.0 },
  { name: 'Karol Bagh', lat: 28.6519, lng: 77.1909, category: 'ROAD_MAINTENANCE', intensity: 0.9 },
  { name: 'Dwarka Sector 9', lat: 28.5921, lng: 77.0460, category: 'WATER_SUPPLY', intensity: 0.85 },
  { name: 'Laxmi Nagar', lat: 28.6406, lng: 77.2781, category: 'ELECTRICITY', intensity: 0.8 },
  { name: 'Jahangirpuri', lat: 28.7296, lng: 77.1622, category: 'SANITATION', intensity: 0.92 },
  { name: 'Uttam Nagar', lat: 28.6210, lng: 77.0588, category: 'ROAD_MAINTENANCE', intensity: 0.75 },
  { name: 'Shahdara', lat: 28.6687, lng: 77.2908, category: 'WATER_SUPPLY', intensity: 0.7 },
  { name: 'Okhla', lat: 28.5375, lng: 77.2720, category: 'SANITATION', intensity: 0.78 },
  { name: 'Narela', lat: 28.8508, lng: 77.0940, category: 'ELECTRICITY', intensity: 0.65 },
  { name: 'Badarpur', lat: 28.5050, lng: 77.2834, category: 'SANITATION', intensity: 0.60 },
]

function createPriorityIcon(priority, category) {
  const color = PRIORITY_COLORS[priority] || '#1a4480'
  const emoji = CAT_ICONS[category] || '📌'
  const svg = `
    <div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span>
    </div>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38]
  })
}


// Helper to auto-center map when results change
function MapAutoCenter({ complaints }) {
  const map = useMap()
  useEffect(() => {
    if (complaints.length > 0) {
      const activeComplaints = complaints.filter(c => c.lat && c.lng)
      if (activeComplaints.length > 0) {
        const bounds = L.latLngBounds(activeComplaints.map(c => [Number(c.lat), Number(c.lng)]))
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        }
      }
    }
  }, [complaints, map])
  return null
}

export default function ComplaintMapPage() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [statusType, setStatusType] = useState('all')
  const [complaintId, setComplaintId] = useState('')
  const [mapStyle, setMapStyle] = useState('osm')
  const [showHotspotPanel, setShowHotspotPanel] = useState(false)

  // Compute top hotspots from real data + demo data
  const hotspots = (() => {
    // Group by district/area
    const districtMap = {}
    complaints.forEach(c => {
      const key = c.address || c.district || 'Unknown'
      if (!districtMap[key]) districtMap[key] = { count: 0, category: c.category, name: key }
      districtMap[key].count++
    })
    const sorted = Object.values(districtMap).sort((a, b) => b.count - a.count).slice(0, 5)

    // If not enough real data, show demo hotspots
    if (sorted.length < 3) {
      return DEMO_HOTSPOTS.slice(0, 5).map(h => ({
        name: h.name,
        category: h.category,
        count: Math.round(h.intensity * 120),
        demo: true
      }))
    }
    return sorted
  })()

  useEffect(() => {
    setLoading(true)
    const params = {
      category: selectedCategory,
      statusType: statusType,
      complaintId: complaintId
    }
    if (user && user.role === 'CITIZEN') {
      params.userEmail = user.email
    }
    complaintService.getMapData(params)
      .then(res => setComplaints(res.data.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false))
  }, [selectedCategory, statusType, complaintId, user])

  const tileLayers = {
    osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap' },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
  }

  return (
    <div style={{ paddingTop: 70, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', zIndex: 10 }}>


        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#1a4480', fontSize: '0.82rem' }}>
          <Filter size={14} /> Category:
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value || 'all'}
              className={`filter-chip ${selectedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
              id={`cat-filter-${cat.value || 'all'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div style={{ height: 24, width: 1, background: '#e5e7eb', margin: '0 6px' }} />

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', padding: 3, borderRadius: 8 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Ongoing' },
            { id: 'resolved', label: 'Resolved' }
          ].map(s => (
            <button
              key={s.id}
              id={`status-filter-${s.id}`}
              className={`btn btn-sm ${statusType === s.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setStatusType(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search by ID */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            id="map-search-id"
            className="input"
            placeholder="Search Complaint ID..."
            value={complaintId}
            onChange={e => setComplaintId(e.target.value.toUpperCase())}
            style={{ paddingLeft: 28, fontSize: '0.82rem', height: 34 }}
          />
        </div>

        {/* Map Style */}
        <div style={{ display: 'flex', gap: 4 }}>
          {Object.entries(tileLayers).map(([key]) => (
            <button key={key} className={`btn btn-sm ${mapStyle === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMapStyle(key)} style={{ fontSize: '0.8rem' }}>
              {key === 'osm' ? '🏙️' : '🛰️'}
            </button>
          ))}
        </div>

        {/* Hotspot toggle */}
        <button
          className={`btn btn-sm ${showHotspotPanel ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowHotspotPanel(v => !v)}
          style={{ fontSize: '0.75rem' }}
        >
          🔥 Hotspots
        </button>

        <div style={{ background: '#f0f4ff', padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, color: '#1a4480' }}>
          {loading ? '...' : complaints.length} markers
        </div>
      </div>

      {/* Map */}
      <div className="map-container" style={{ flex: 1, borderRadius: 0, position: 'relative' }}>
        {loading && complaints.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '12px 24px', borderRadius: 12, fontWeight: 600, backdropFilter: 'blur(8px)' }}>
            Loading Map Data...
          </div>
        )}

        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url={tileLayers[mapStyle].url}
            attribution={tileLayers[mapStyle].attr}
          />

          <MapAutoCenter complaints={complaints} />

          {complaints.map(c => c.lat && c.lng && (
            <Marker
              key={c.id}
              position={[Number(c.lat), Number(c.lng)]}
              icon={createPriorityIcon(c.priority, c.category)}
            >
              <Popup maxWidth={280} className="complaint-popup">
                <div style={{ padding: '4px 0' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className={`badge cat-${c.category || 'OTHER'}`} style={{ fontSize: '0.7rem' }}>
                      {CAT_ICONS[c.category] || '📌'} {c.category?.replace('_', ' ') || 'OTHER'}
                    </span>
                    <span className={`badge badge-${c.status?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, lineHeight: 1.3 }}>{c.title}</div>
                  {c.address && (
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 8 }}>📍 {c.address}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: '#f0f4ff', color: '#1a4480', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                      {c.id}
                    </span>
                    <Link to={`/track/${c.id}`} style={{ fontSize: '0.78rem', color: '#1a4480', fontWeight: 700 }}>
                      Track →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>


      {/* Hotspot Panel */}
      {showHotspotPanel && (
        <div style={{
          position: 'fixed', top: 148, right: 24,
          background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(16px)',
          color: 'white', borderRadius: 16, padding: '20px',
          width: 300, zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: '1.2rem' }}>🔥</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Top Problem Areas</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Based on complaint density</div>
            </div>
          </div>
          {hotspots.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
              borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: i === 0 ? '#dc2626' : i === 1 ? '#f97316' : i === 2 ? '#d97706' : '#4b5563',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '0.75rem', flexShrink: 0
              }}>#{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                  {CAT_ICONS[h.category] || '📌'} {h.category?.replace('_', ' ')}
                  {h.count && <span> · {h.count} complaints</span>}
                </div>
              </div>
            </div>
          ))}
          {hotspots[0]?.demo && (
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8 }}>
              * Showing representative hotspot data
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        background: 'white', borderRadius: 12, padding: '14px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
        zIndex: 999
      }}>
        <>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 10, color: '#374151' }}>Priority Legend</div>
          {Object.entries(PRIORITY_COLORS).map(([p, color]) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{p}</span>
            </div>
          ))}
        </>
      </div>
    </div>
  )
}
