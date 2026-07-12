import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polygon } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Paper, Typography } from '@mui/material'
import { MapPin } from 'lucide-react'

type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

type GeoJsonMultiPolygon = {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

function isPolygon(g: unknown): g is GeoJsonPolygon {
  return !!g && typeof g === 'object' && (g as any).type === 'Polygon' && Array.isArray((g as any).coordinates)
}

function isMultiPolygon(g: unknown): g is GeoJsonMultiPolygon {
  return !!g && typeof g === 'object' && (g as any).type === 'MultiPolygon' && Array.isArray((g as any).coordinates)
}

function ringToLatLngs(ring: number[][]): LatLngExpression[] {
  // GeoJSON: [lng, lat] -> Leaflet: [lat, lng]
  return ring.map(([lng, lat]) => [lat, lng])
}

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function OpenStreetProjectMap({
  centroid,
  geometry,
  height = 360,
  zoom = 13,
}: {
  centroid?: { lat: number; lng: number }
  geometry?: unknown
  height?: number
  zoom?: number
}) {
  const polygons = useMemo(() => {
    if (isPolygon(geometry)) {
      return geometry.coordinates.map((ring) => ringToLatLngs(ring))
    }
    if (isMultiPolygon(geometry)) {
      return geometry.coordinates.flatMap((poly) => poly.map((ring) => ringToLatLngs(ring)))
    }
    return []
  }, [geometry])

  if (!centroid && polygons.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', height }}>
        <MapPin size={48} color="#e0e0e0" style={{ margin: '0 auto 16px' }} />
        <Typography variant="body2" color="text.secondary">
          Map data not available
        </Typography>
      </Paper>
    )
  }

  const center: LatLngExpression = centroid ? [centroid.lat, centroid.lng] : polygons[0][0]

  return (
    <Box sx={{ width: '100%', height, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />
        {centroid && <Marker position={[centroid.lat, centroid.lng]} icon={defaultMarkerIcon} />}
        {polygons.map((ring, idx) => (
          <Polygon
            key={idx}
            positions={ring}
            pathOptions={{ color: '#1a365d', weight: 2, fillColor: '#1a365d', fillOpacity: 0.12 }}
          />
        ))}
      </MapContainer>
    </Box>
  )
}

