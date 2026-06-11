import { useEffect, useState, useMemo } from 'react'
import { Box, Button, Paper, SxProps, Theme } from '@mui/material'
import { MapContainer, TileLayer, Marker, Polygon, Tooltip, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../../lib/api-client'
import type { Project } from '../../lib/types'

type ProjectWithAvailability = Project & {
  hasAvailability?: boolean
  availablePhasesCount?: number
  renderLat?: number
  renderLng?: number
}

type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

type GeoJsonMultiPolygon = {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

function isPolygon(g: unknown): g is GeoJsonPolygon {
  return !!g && typeof g === 'object' && (g as unknown as Record<string, unknown>).type === 'Polygon' && Array.isArray((g as unknown as Record<string, unknown>).coordinates)
}

function isMultiPolygon(g: unknown): g is GeoJsonMultiPolygon {
  return !!g && typeof g === 'object' && (g as unknown as Record<string, unknown>).type === 'MultiPolygon' && Array.isArray((g as unknown as Record<string, unknown>).coordinates)
}

function ringToLatLngs(ring: number[][]): LatLngExpression[] {
  return ring.map(([lng, lat]) => [lat, lng])
}

function createMapPinIcon(fill: string) {
  return L.divIcon({
    className: 'project-map-pin',
    html: `
      <div style="display:flex;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="${fill}" stroke="rgba(255,255,255,0.85)" stroke-width="1.5"/>
          <circle cx="16" cy="15" r="5" fill="white" fill-opacity="0.95"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    tooltipAnchor: [0, -36],
  })
}

const availablePinIcon = createMapPinIcon('#223559') // Brand navy blue
const highlightedPinIcon = createMapPinIcon('#c9a227') // Premium gold active highlight
const soldOutPinIcon = createMapPinIcon('#6b7280')

function getProjectPinIcon(project: ProjectWithAvailability, isHighlighted: boolean) {
  if (isHighlighted) return highlightedPinIcon
  const isSoldOut = !project.hasAvailability && (project.availablePhasesCount ?? 0) === 0
  return isSoldOut ? soldOutPinIcon : availablePinIcon
}

type POIType = 'airport' | 'hospital' | 'university' | 'school'

function createPOIPinIcon(type: POIType) {
  let svgPath = ''
  let bgColor = '#1a365d'

  switch (type) {
    case 'airport':
      svgPath = '<path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="white"/>'
      break
    case 'hospital':
      bgColor = '#d32f2f'
      svgPath = '<path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM13 17H11V13H7V11H11V7H13V11H17V13H13V17Z" fill="white"/>'
      break
    case 'university':
      bgColor = '#388e3c'
      svgPath = '<path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9Z" fill="white"/>'
      break
    case 'school':
      bgColor = '#f57c00'
      svgPath = '<path d="M12 3L2 12H5V21H19V12H22L12 3ZM12 7.7C13.27 7.7 14.3 8.73 14.3 10C14.3 11.27 13.27 12.3 12 12.3C10.73 12.3 9.7 11.27 9.7 10C9.7 8.73 10.73 7.7 12 7.7ZM16 19H8V15C8 13.68 10.66 13 12 13C13.34 13 16 15 16 19Z" fill="white"/>'
      break
  }

  return L.divIcon({
    className: 'poi-map-pin',
    html: `
      <div style="display:flex;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="background:${bgColor};border-radius:50%;padding:4px;border:2px solid white;">
          ${svgPath}
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -14],
  })
}

const icons = {
  airport: createPOIPinIcon('airport'),
  hospital: createPOIPinIcon('hospital'),
  university: createPOIPinIcon('university'),
  school: createPOIPinIcon('school'),
}

const POIs: Array<{ id: string; lat: number; lng: number; nameAr: string; nameEn: string; type: POIType }> = [
  // Riyadh
  { id: 'ruh-airport', lat: 24.9576, lng: 46.6988, nameAr: 'مطار الملك خالد الدولي', nameEn: 'King Khalid International Airport', type: 'airport' },
  { id: 'ruh-hospital-1', lat: 24.8425, lng: 46.7215, nameAr: 'مستشفى الدكتور سليمان الحبيب (النرجس)', nameEn: 'Dr. Sulaiman Al Habib Hospital (Al Narjis)', type: 'hospital' },
  { id: 'ruh-hospital-2', lat: 24.6725, lng: 46.6783, nameAr: 'مستشفى الملك فيصل التخصصي', nameEn: 'King Faisal Specialist Hospital', type: 'hospital' },
  { id: 'ruh-uni-1', lat: 24.8468, lng: 46.7245, nameAr: 'جامعة الأميرة نورة بنت عبدالرحمن', nameEn: 'Princess Nourah University', type: 'university' },
  { id: 'ruh-uni-2', lat: 24.7170, lng: 46.6231, nameAr: 'جامعة الملك سعود', nameEn: 'King Saud University', type: 'university' },
  { id: 'ruh-school-1', lat: 24.7891, lng: 46.6612, nameAr: 'مدارس المملكة', nameEn: 'Kingdom Schools', type: 'school' },
  { id: 'ruh-school-2', lat: 24.8116, lng: 46.5168, nameAr: 'مدارس مسك', nameEn: 'Misk Schools', type: 'school' },

  // Jeddah
  { id: 'jed-airport', lat: 21.6702, lng: 39.1565, nameAr: 'مطار الملك عبدالعزيز الدولي', nameEn: 'King Abdulaziz International Airport', type: 'airport' },
  { id: 'jed-hospital-1', lat: 21.7825, lng: 39.1350, nameAr: 'مجمع الملك عبدالله الطبي (شمال جدة)', nameEn: 'King Abdullah Medical Complex', type: 'hospital' },
  { id: 'jed-hospital-2', lat: 21.5642, lng: 39.1670, nameAr: 'مستشفى الملك فيصل التخصصي', nameEn: 'King Faisal Specialist Hospital', type: 'hospital' },
  { id: 'jed-uni-1', lat: 21.8480, lng: 39.2310, nameAr: 'جامعة جدة', nameEn: 'University of Jeddah', type: 'university' },
  { id: 'jed-uni-2', lat: 21.4925, lng: 39.2458, nameAr: 'جامعة الملك عبدالعزيز', nameEn: 'King Abdulaziz University', type: 'university' },
  { id: 'jed-school-1', lat: 21.7580, lng: 39.1520, nameAr: 'مدارس دار الفكر (الحمدانية)', nameEn: 'Dar Al Fikr Schools', type: 'school' },

  // Madinah
  { id: 'med-airport', lat: 24.5534, lng: 39.7051, nameAr: 'مطار الأمير محمد بن عبدالعزيز الدولي', nameEn: 'Prince Mohammad bin Abdulaziz Airport', type: 'airport' },
  { id: 'med-hospital-1', lat: 24.4925, lng: 39.5788, nameAr: 'مستشفى الملك فهد بالمدينة المنورة', nameEn: 'King Fahad Hospital', type: 'hospital' },
  { id: 'med-uni-1', lat: 24.4835, lng: 39.5390, nameAr: 'جامعة طيبة', nameEn: 'Taibah University', type: 'university' },
  { id: 'med-uni-2', lat: 24.4815, lng: 39.5630, nameAr: 'الجامعة الإسلامية بالمدينة المنورة', nameEn: 'Islamic University of Madinah', type: 'university' },
  { id: 'med-school-1', lat: 24.4755, lng: 39.6105, nameAr: 'مدارس العقيق الأهلية', nameEn: 'Al Aqeeq Private Schools', type: 'school' },

  // Taif / Makkah
  { id: 'tif-airport', lat: 21.4822, lng: 40.5447, nameAr: 'مطار الطائف الدولي', nameEn: 'Taif International Airport', type: 'airport' },
  { id: 'tif-uni-1', lat: 21.4294, lng: 40.4855, nameAr: 'جامعة الطائف (الحوية)', nameEn: 'Taif University', type: 'university' },
  { id: 'tif-hospital-1', lat: 21.2825, lng: 40.4215, nameAr: 'مستشفى الملك عبدالعزيز التخصصي', nameEn: 'King Abdulaziz Specialist Hospital', type: 'hospital' },
  { id: 'tif-school-1', lat: 21.3650, lng: 40.4610, nameAr: 'مدارس الصفوة الأهلية', nameEn: 'Al-Safwah Private Schools', type: 'school' },

  // Tabuk
  { id: 'tbk-airport', lat: 28.3654, lng: 36.6189, nameAr: 'مطار الأمير سلطان بن عبدالعزيز الدولي', nameEn: 'Prince Sultan bin Abdulaziz Airport', type: 'airport' },
  { id: 'tbk-hospital-1', lat: 28.3755, lng: 36.5210, nameAr: 'مستشفى الملك فهد التخصصي بتبوك', nameEn: 'King Fahad Specialist Hospital', type: 'hospital' },
  { id: 'tbk-uni-1', lat: 28.3980, lng: 36.4850, nameAr: 'جامعة تبوك', nameEn: 'University of Tabuk', type: 'university' },
  { id: 'tbk-school-1', lat: 28.3880, lng: 36.5820, nameAr: 'مدارس تبوك العالمية', nameEn: 'Tabuk International School', type: 'school' },
]

function MapController({
  selectedRegion,
  projects,
  resetTrigger,
  highlightedProjectId,
}: {
  selectedRegion: string | null
  projects: ProjectWithAvailability[]
  resetTrigger: number
  highlightedProjectId?: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!projects.length) return

    // If there is a highlighted project, fly to it with slow zoom!
    if (highlightedProjectId) {
      const hp = projects.find((p) => p.id === highlightedProjectId)
      if (hp) {
        const lat = typeof hp.renderLat === 'number' ? hp.renderLat : hp.mapCentroidLat
        const lng = typeof hp.renderLng === 'number' ? hp.renderLng : hp.mapCentroidLng
        if (typeof lat === 'number' && typeof lng === 'number') {
          // Slow animation zoom speed (duration: 3.0 seconds, zoom level: 13)
          map.flyTo([lat, lng], 13, {
            duration: 3.0,
            easeLinearity: 0.25,
            noMoveStart: true,
          })
          return
        }
      }
    }

    const targetProjects = selectedRegion
      ? projects.filter((p) => p.provinceRegion?.toLowerCase() === selectedRegion.toLowerCase())
      : projects

    const pts: [number, number][] = []
    targetProjects.forEach((p) => {
      if (typeof p.renderLat === 'number' && typeof p.renderLng === 'number') {
        pts.push([p.renderLat, p.renderLng])
      } else if (typeof p.mapCentroidLat === 'number' && typeof p.mapCentroidLng === 'number') {
        pts.push([p.mapCentroidLat, p.mapCentroidLng])
      }
      if (isPolygon(p.mapGeometryJson)) {
        p.mapGeometryJson.coordinates.forEach((ring) => {
          ring.forEach(([lng, lat]) => pts.push([lat, lng]))
        })
      } else if (isMultiPolygon(p.mapGeometryJson)) {
        p.mapGeometryJson.coordinates.forEach((poly) => {
          poly.forEach((ring) => {
            ring.forEach(([lng, lat]) => pts.push([lat, lng]))
          })
        })
      }
    })

    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts)
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 })
    } else if (!selectedRegion) {
      map.flyTo([24.7136, 46.6753], 6, { duration: 1.2 })
    }
  }, [selectedRegion, projects, resetTrigger, map, highlightedProjectId])

  return null
}

function MapResizeInvalidate() {
  const map = useMap()

  useEffect(() => {
    const run = () => map.invalidateSize()
    const t1 = window.setTimeout(run, 0)
    const t2 = window.setTimeout(run, 200)
    window.addEventListener('resize', run)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', run)
    }
  }, [map])

  return null
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom())
    }
    map.on('zoomend', handleZoom)
    // Run once initially
    onZoomChange(map.getZoom())
    return () => {
      map.off('zoomend', handleZoom)
    }
  }, [map, onZoomChange])

  return null
}

type ProjectsMapProps = {
  sx?: SxProps<Theme>
  highlightedProjectId?: string | null
  onProjectSelect?: (id: string | null) => void
  projects?: ProjectWithAvailability[]
}

export default function ProjectsMap({ sx, highlightedProjectId, onProjectSelect, projects: passedProjects }: ProjectsMapProps) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [fetchedProjects, setFetchedProjects] = useState<ProjectWithAvailability[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [currentZoom, setCurrentZoom] = useState(6)

  useEffect(() => {
    if (passedProjects) return
    async function loadProjects() {
      try {
        const res = await getProjects()
        if (res.success && res.data) {
          const saudiProvinces = [
            'riyadh', 'الرياض',
            'makkah', 'مكة',
            'madinah', 'المدينة',
            'tabuk', 'تبوك',
            'eastern', 'الشرقية',
            'asir', 'عسير',
            'qassim', 'القصيم',
            'hail', 'حائل',
            'jazan', 'جازان',
            'najran', 'نجران',
            'northern', 'الحدود الشمالية',
            'jouf', 'الجوف',
            'bahah', 'الباحة',
          ]
          const saudiProjects = res.data.filter((p) => {
            const r = (p.provinceRegion || '').toLowerCase()
            return saudiProvinces.some((prov) => r.includes(prov))
          })
          setFetchedProjects(saudiProjects)
        }
      } catch (err) {
        console.error('Error loading projects map data:', err)
      }
    }
    loadProjects()
  }, [passedProjects])

  const projects = passedProjects || fetchedProjects
  const isRtl = i18n.language === 'ar'

  const regions = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.provinceRegion).filter((r): r is string => !!r)))
  }, [projects])

  const projectMarkers = useMemo(() => {
    const getRegionCenter = (rName?: string): [number, number] => {
      const lower = (rName || '').toLowerCase()
      if (lower.includes('riyadh') || lower.includes('الرياض')) return [24.7136, 46.6753]
      if (lower.includes('makkah') || lower.includes('مكة')) return [21.4858, 39.1925]
      if (lower.includes('madinah') || lower.includes('المدينة')) return [24.5247, 39.5692]
      if (lower.includes('tabuk') || lower.includes('تبوك')) return [28.3835, 36.5662]
      if (lower.includes('eastern') || lower.includes('الشرقية')) return [26.4207, 50.0888]
      if (lower.includes('asir') || lower.includes('عسير')) return [18.2164, 42.5053]
      return [24.7136, 46.6753]
    }

    const fallbackCounts: Record<string, number> = {}

    return projects.map((project) => {
      let lat = project.mapCentroidLat
      let lng = project.mapCentroidLng

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        if (isPolygon(project.mapGeometryJson) && project.mapGeometryJson.coordinates[0]?.[0]) {
          lat = project.mapGeometryJson.coordinates[0][0][1]
          lng = project.mapGeometryJson.coordinates[0][0][0]
        }
      }

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        const [baseLat, baseLng] = getRegionCenter(project.provinceRegion)
        const key = `${baseLat}-${baseLng}`
        const count = fallbackCounts[key] || 0
        fallbackCounts[key] = count + 1

        const angle = count * 2.4
        const radius = 0.05 + Math.floor(count / 4) * 0.05
        lat = baseLat + (count === 0 ? 0 : Math.sin(angle) * radius)
        lng = baseLng + (count === 0 ? 0 : Math.cos(angle) * radius)
      }

      return {
        ...project,
        renderLat: lat,
        renderLng: lng,
      }
    })
  }, [projects])

  const getLocalizedRegionName = (rName: string) => {
    if (!rName) return ''
    const lower = rName.toLowerCase()

    if (isRtl) {
      if (lower.includes('riyadh') || lower.includes('الرياض')) return 'منطقة الرياض'
      if (lower.includes('makkah') || lower.includes('مكة')) return 'منطقة مكة المكرمة'
      if (lower.includes('madinah') || lower.includes('المدينة')) return 'منطقة المدينة المنورة'
      if (lower.includes('tabuk') || lower.includes('تبوك')) return 'منطقة تبوك'
      if (lower.includes('eastern') || lower.includes('الشرقية')) return 'المنطقة الشرقية'
      if (lower.includes('asir') || lower.includes('عسير')) return 'منطقة عسير'

      const lines = rName.split(/[\r\n]+/)
      const arabicLine = lines.find((l) => /[\u0600-\u06FF]/.test(l))
      if (arabicLine) return arabicLine.replace(/^-?\s*/, '').trim()
      return rName
    }

    if (lower.includes('riyadh') || lower.includes('الرياض')) return 'Riyadh Province'
    if (lower.includes('makkah') || lower.includes('مكة')) return 'Makkah Province'
    if (lower.includes('madinah') || lower.includes('المدينة')) return 'Madinah Province'
    if (lower.includes('tabuk') || lower.includes('تبوك')) return 'Tabuk Province'
    if (lower.includes('eastern') || lower.includes('الشرقية')) return 'Eastern Province'
    if (lower.includes('asir') || lower.includes('عسير')) return 'Asir Province'

    const lines = rName.split(/[\r\n]+/)
    const englishLine = lines.find((l) => /[a-zA-Z]/.test(l))
    if (englishLine) return englishLine.replace(/^-?\s*/, '').trim()
    return rName
  }

  const allPolygons = useMemo(() => {
    const list: { id: string; rings: LatLngExpression[][]; isSelected: boolean; isHighlighted: boolean }[] = []
    projects.forEach((p) => {
      const isSelected = selectedRegion
        ? p.provinceRegion?.toLowerCase() === selectedRegion.toLowerCase()
        : true
      const isHighlighted = p.id === highlightedProjectId

      if (isPolygon(p.mapGeometryJson)) {
        const rings = p.mapGeometryJson.coordinates.map(ringToLatLngs)
        list.push({ id: p.id, rings, isSelected, isHighlighted })
      } else if (isMultiPolygon(p.mapGeometryJson)) {
        p.mapGeometryJson.coordinates.forEach((poly) => {
          const rings = poly.map(ringToLatLngs)
          list.push({ id: p.id, rings, isSelected, isHighlighted })
        })
      }
    })
    return list
  }, [projects, selectedRegion, highlightedProjectId])

  const displayedProjects = useMemo(() => {
    if (!selectedRegion) return projectMarkers
    return projectMarkers.filter((p) => p.provinceRegion?.toLowerCase() === selectedRegion.toLowerCase())
  }, [projectMarkers, selectedRegion])

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: { xs: 360, sm: 420, md: 560 },
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        ...sx,
      }}
    >
      <MapContainer
        center={[24.7136, 46.6753]}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />

        <MapResizeInvalidate />
        <ZoomTracker onZoomChange={setCurrentZoom} />
        <MapController
          selectedRegion={selectedRegion}
          projects={projectMarkers}
          resetTrigger={resetTrigger}
          highlightedProjectId={highlightedProjectId}
        />

        {allPolygons.map((item, idx) =>
          item.rings.map((ring, rIdx) => (
            <Polygon
              key={`${idx}-${rIdx}`}
              positions={ring}
              pathOptions={{
                color: item.isHighlighted ? '#c9a227' : '#e91e63',
                weight: item.isHighlighted ? 4.0 : (item.isSelected ? 2.5 : 1.5),
                dashArray: item.isHighlighted ? '0' : '5, 5',
                fillColor: item.isHighlighted ? '#c9a227' : '#1b5e20',
                fillOpacity: item.isHighlighted ? 0.5 : (item.isSelected ? 0.35 : 0.15),
              }}
            />
          ))
        )}

        {displayedProjects.map((project) => {
          const isHighlighted = highlightedProjectId === project.id
          const isSoldOut = !project.hasAvailability && (project.availablePhasesCount ?? 0) === 0
          const projectName = isRtl ? project.nameAr : project.name
          const statusLabel = isSoldOut
            ? isRtl ? 'مباع بالكامل' : 'Sold Out'
            : isRtl ? 'استكشف' : 'Explore'

          return (
            <Marker
              key={project.id}
              position={[project.renderLat, project.renderLng]}
              icon={getProjectPinIcon(project, isHighlighted)}
              eventHandlers={{
                click: () => {
                  if (highlightedProjectId === project.id) {
                    navigate(`/project/${project.id}`)
                  } else {
                    onProjectSelect?.(project.id)
                  }
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -36]} opacity={0.95}>
                <span style={{ fontWeight: 600 }}>{projectName}</span>
                <br />
                <span style={{ fontSize: 11, opacity: 0.85 }}>{statusLabel}</span>
              </Tooltip>
            </Marker>
          )
        })}

        {currentZoom >= 10 && POIs.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={icons[poi.type]}
            zIndexOffset={100}
          >
            <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
              <span style={{ fontWeight: 600 }}>{isRtl ? poi.nameAr : poi.nameEn}</span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            setSelectedRegion(null)
            setResetTrigger((prev) => prev + 1)
          }}
          sx={{
            bgcolor: '#000',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'none',
            px: 2,
            py: 1,
            borderRadius: 1,
            boxShadow: 4,
            '&:hover': {
              bgcolor: '#222',
            },
          }}
        >
          {isRtl ? 'إعادة ضبط الخريطة' : 'Reset Zoom'}
        </Button>
      </Box>

      {regions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1,
            width: 'calc(100% - 32px)',
            maxWidth: '100%',
            bgcolor: 'rgba(34, 53, 89, 0.92)',
            backdropFilter: 'blur(12px)',
            p: 0.75,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {regions.map((regionName) => {
            const isSelected = selectedRegion?.toLowerCase() === regionName.toLowerCase()
            return (
              <Button
                key={regionName}
                onClick={() => setSelectedRegion(regionName)}
                sx={{
                  color: '#fff',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 2,
                  py: 0.75,
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  opacity: isSelected ? 1 : 0.6,
                  borderBottom: isSelected ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                {getLocalizedRegionName(regionName)}
              </Button>
            )
          })}
        </Box>
      )}
    </Paper>
  )
}
