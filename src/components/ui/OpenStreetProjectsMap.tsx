import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Paper, Typography } from '@mui/material'
import { MapPin } from 'lucide-react'

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export type ProjectLocation = {
  id: string
  name: string
  lat: number
  lng: number
  subtitle?: string
}

function FocusSelection({
  selected,
}: {
  selected: { lat: number; lng: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!selected) return
    map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { animate: true, duration: 0.6 })
  }, [selected, map])
  return null
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [bounds, map])
  return null
}

export default function OpenStreetProjectsMap({
  locations,
  selectedId,
  height = 520,
  onSelectProject,
}: {
  locations: ProjectLocation[]
  selectedId?: string
  height?: number
  onSelectProject?: (id: string) => void
}) {
  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const pts = locations.map((l) => [l.lat, l.lng] as const)
    if (pts.length === 0) return null
    return pts as unknown as LatLngBoundsExpression
  }, [locations])

  const selected = useMemo(() => {
    if (!selectedId) return null
    const hit = locations.find((l) => l.id === selectedId)
    return hit ? { lat: hit.lat, lng: hit.lng } : null
  }, [locations, selectedId])

  if (locations.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', height }}>
        <MapPin size={48} color="#e0e0e0" style={{ margin: '0 auto 16px' }} />
        <Typography variant="body2" color="text.secondary">
          No project locations available
        </Typography>
      </Paper>
    )
  }

  const center = { lat: locations[0].lat, lng: locations[0].lng }

  return (
    <Box sx={{ width: '100%', height, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <MapContainer center={[center.lat, center.lng]} zoom={11} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {!selected && <FitBounds bounds={bounds} />}
        <FocusSelection selected={selected} />
        {locations.map((l) => (
          <Marker 
            key={l.id} 
            position={[l.lat, l.lng]} 
            icon={defaultMarkerIcon}
            eventHandlers={{
              click: () => {
                if (onSelectProject) {
                  onSelectProject(l.id)
                }
              }
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{l.name}</div>
                {l.subtitle ? <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>{l.subtitle}</div> : null}
                <button
                  style={{
                    backgroundColor: selectedId === l.id ? '#2c5282' : '#1a365d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    if (onSelectProject) {
                      onSelectProject(l.id)
                    }
                  }}
                >
                  {selectedId === l.id ? 'عرض التفاصيل / View Details' : 'تحديد وزوم / Select & Zoom'}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  )
}

