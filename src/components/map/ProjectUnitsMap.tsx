import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { MapPin } from 'lucide-react'
import type { ProjectMapUnit } from '../../lib/types'
import { getUnitPriceBreakdown } from '../../lib/unitPrice'
import {
  geometryToLatLngRings,
  resolveMapCentroid,
  resolveUnitMapGeometry,
  unitStatusColors,
} from '../../lib/projectMap'

type LatLng = [number, number]

function MapFitBounds({
  projectGeometry,
  units,
  selectedUnitId,
  resetKey,
}: {
  projectGeometry?: unknown
  units: ProjectMapUnit[]
  selectedUnitId?: string | null
  resetKey?: string | number
}) {
  const map = useMap()

  useEffect(() => {
    const pts: LatLng[] = []

    geometryToLatLngRings(projectGeometry).forEach((ring) => {
      ring.forEach((p) => pts.push(p))
    })

    units.forEach((u) => {
      const geom = resolveUnitMapGeometry(u)
      geometryToLatLngRings(geom).forEach((ring) => {
        ring.forEach((p) => pts.push(p))
      })
      if (typeof u.mapCentroidLat === 'number' && typeof u.mapCentroidLng === 'number') {
        pts.push([u.mapCentroidLat, u.mapCentroidLng])
      }
    })

    if (selectedUnitId) {
      const selected = units.find((u) => u.id === selectedUnitId)
      if (selected) {
        const geom = resolveUnitMapGeometry(selected)
        const rings = geometryToLatLngRings(geom)
        const ringPts = rings.flat()
        if (ringPts.length > 0) {
          map.flyToBounds(L.latLngBounds(ringPts), { padding: [40, 40], duration: 1, maxZoom: 18 })
          return
        }
        if (typeof selected.mapCentroidLat === 'number' && typeof selected.mapCentroidLng === 'number') {
          map.flyTo([selected.mapCentroidLat, selected.mapCentroidLng], 17, { duration: 1 })
          return
        }
      }
    }

    if (pts.length > 0) {
      map.flyToBounds(L.latLngBounds(pts), { padding: [36, 36], duration: 1.2, maxZoom: 17 })
    }
  }, [map, projectGeometry, units, selectedUnitId, resetKey])

  return null
}

function MapResizeInvalidate() {
  const map = useMap()
  useEffect(() => {
    const run = () => map.invalidateSize()
    const t1 = window.setTimeout(run, 0)
    const t2 = window.setTimeout(run, 250)
    window.addEventListener('resize', run)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', run)
    }
  }, [map])
  return null
}

export type ProjectUnitsMapProps = {
  projectGeometry?: unknown
  projectCentroid?: { lat: number; lng: number }
  units: ProjectMapUnit[]
  selectedUnitId?: string | null
  onUnitSelect?: (unitId: string) => void
  height?: number | string
  showLegend?: boolean
  isRtl?: boolean
}

export default function ProjectUnitsMap({
  projectGeometry,
  projectCentroid,
  units,
  selectedUnitId,
  onUnitSelect,
  height = 360,
  showLegend = true,
  isRtl = false,
}: ProjectUnitsMapProps) {
  const outlineRings = useMemo(() => geometryToLatLngRings(projectGeometry), [projectGeometry])
  const outlineColors = unitStatusColors('outline')

  const unitLayers = useMemo(() => {
    return units.flatMap((unit) => {
      const geometry = resolveUnitMapGeometry(unit)
      const rings = geometryToLatLngRings(geometry)
      if (rings.length === 0) return []
      const selected = selectedUnitId === unit.id
      const colors = unitStatusColors(unit.statusGroup, selected)
      return rings.map((ring, idx) => ({
        key: `${unit.id}-${idx}`,
        unit,
        ring,
        colors,
        selected,
      }))
    })
  }, [units, selectedUnitId])

  const center = useMemo(() => {
    if (projectCentroid) return [projectCentroid.lat, projectCentroid.lng] as LatLng
    const fromGeom = resolveMapCentroid({ mapGeometryJson: projectGeometry })
    if (fromGeom) return [fromGeom.lat, fromGeom.lng] as LatLng
    const first = units.find((u) => typeof u.mapCentroidLat === 'number')
    if (first && typeof first.mapCentroidLat === 'number' && typeof first.mapCentroidLng === 'number') {
      return [first.mapCentroidLat, first.mapCentroidLng] as LatLng
    }
    return [24.7136, 46.6753] as LatLng
  }, [projectCentroid, projectGeometry, units])

  if (units.length === 0 && outlineRings.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <MapPin size={48} color="#e0e0e0" style={{ marginBottom: 16 }} />
        <Typography variant="body2" color="text.secondary">
          {isRtl ? 'لا توجد بيانات خريطة للوحدات' : 'No unit map data available'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      <MapContainer center={center} zoom={15} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution="&copy; Google Maps"
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />
        <MapResizeInvalidate />
        <MapFitBounds
          projectGeometry={projectGeometry}
          units={units}
          selectedUnitId={selectedUnitId}
          resetKey={units.length}
        />

        {outlineRings.map((ring, idx) => (
          <Polygon
            key={`outline-${idx}`}
            positions={ring}
            pathOptions={{
              color: outlineColors.stroke,
              weight: outlineColors.weight,
              fillColor: outlineColors.fill,
              fillOpacity: outlineColors.fillOpacity,
            }}
          />
        ))}

        {unitLayers.map(({ key, unit, ring, colors }) => (
          <Polygon
            key={key}
            positions={ring}
            pathOptions={{
              color: colors.stroke,
              weight: colors.weight,
              fillColor: colors.fill,
              fillOpacity: colors.fillOpacity,
            }}
            eventHandlers={{
              click: () => onUnitSelect?.(unit.id),
            }}
          >
            <Tooltip sticky opacity={0.95}>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="subtitle2" fontWeight={700}>{unit.name}</Typography>
                <Typography variant="caption" display="block">{unit.status}</Typography>
                {typeof unit.price === 'number' && (() => {
                  const { original, afterSubsidy, showBoth } = getUnitPriceBreakdown(unit)
                  return (
                    <>
                      {showBoth ? (
                        <>
                          <Typography variant="caption" display="block" sx={{ textDecoration: 'line-through' }}>
                            {original.toLocaleString()} SAR
                          </Typography>
                          <Typography variant="caption" display="block" fontWeight={700}>
                            {afterSubsidy.toLocaleString()} SAR
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" display="block">
                          {original.toLocaleString()} SAR
                        </Typography>
                      )}
                    </>
                  )
                })()}
              </Box>
            </Tooltip>
          </Polygon>
        ))}
      </MapContainer>

      {showLegend && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 1000,
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 24px)',
          }}
        >
          {([
            ['available', isRtl ? 'متاح' : 'Available'],
            ['reserved', isRtl ? 'محجوز' : 'Reserved'],
            ['sold', isRtl ? 'مباع' : 'Sold'],
            ['blocked', isRtl ? 'موقوف' : 'Blocked'],
          ] as const).map(([group, label]) => {
            const c = unitStatusColors(group)
            return (
              <Chip
                key={group}
                size="small"
                label={label}
                icon={
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.fill, ml: 0.5 }} />
                }
                sx={{ bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 600 }}
              />
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
