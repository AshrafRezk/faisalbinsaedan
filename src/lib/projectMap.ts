type GeoJsonPolygon = { type: 'Polygon'; coordinates: number[][][] }
type GeoJsonMultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] }

export type UnitStatusGroup = 'available' | 'reserved' | 'sold' | 'blocked' | 'unknown' | 'outline'

export function isGeoJsonPolygon(g: unknown): g is GeoJsonPolygon {
  return !!g && typeof g === 'object' && (g as GeoJsonPolygon).type === 'Polygon'
}

export function isGeoJsonMultiPolygon(g: unknown): g is GeoJsonMultiPolygon {
  return !!g && typeof g === 'object' && (g as GeoJsonMultiPolygon).type === 'MultiPolygon'
}

function isPolygon(g: unknown): g is GeoJsonPolygon {
  return isGeoJsonPolygon(g)
}

function isMultiPolygon(g: unknown): g is GeoJsonMultiPolygon {
  return isGeoJsonMultiPolygon(g)
}

export function ringToLatLngs(ring: number[][]): [number, number][] {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number])
}

export function geometryToLatLngRings(geometry: unknown): [number, number][][] {
  if (isGeoJsonPolygon(geometry)) {
    return geometry.coordinates.map(ringToLatLngs)
  }
  if (isGeoJsonMultiPolygon(geometry)) {
    return geometry.coordinates.flatMap((poly) => poly.map(ringToLatLngs))
  }
  return []
}

export function parseMapGeometryJson(raw?: string | null): unknown | undefined {
  const trimmed = (raw || '').trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return undefined
  }
}

export function parseMapGeometry(raw?: unknown): unknown | undefined {
  if (raw == null || raw === '') return undefined
  if (typeof raw === 'string') return parseMapGeometryJson(raw)
  if (typeof raw === 'object') {
    const g = raw as { type?: string; geometry?: unknown }
    if (g.type === 'Feature' && g.geometry) return parseMapGeometry(g.geometry)
    if (isGeoJsonPolygon(g) || isGeoJsonMultiPolygon(g)) return g
  }
  return undefined
}

/** Match Property Finder / maplibreMapHost status groups. */
export function normalizeUnitStatusGroup(status?: string | null): UnitStatusGroup {
  const raw = (status || '').trim().toLowerCase()
  if (!raw) return 'unknown'
  if (raw.includes('avail')) return 'available'
  if (raw.includes('reserv')) return 'reserved'
  if (raw.includes('contract') || raw.includes('sold')) return 'sold'
  if (raw.includes('hold') || raw.includes('block')) return 'blocked'
  return 'unknown'
}

export function unitStatusColors(statusGroup: UnitStatusGroup, selected = false) {
  if (selected) {
    return { fill: '#c49c4f', stroke: '#f6d27f', fillOpacity: 0.5, weight: 3.6 }
  }
  switch (statusGroup) {
    case 'available':
      return { fill: '#2e8b57', stroke: '#1f5f3d', fillOpacity: 0.3, weight: 2.2 }
    case 'reserved':
      return { fill: '#d32f2f', stroke: '#9a1818', fillOpacity: 0.3, weight: 2.2 }
    case 'sold':
      return { fill: '#c0392b', stroke: '#8e2419', fillOpacity: 0.3, weight: 2.2 }
    case 'blocked':
      return { fill: '#6c757d', stroke: '#495057', fillOpacity: 0.3, weight: 2.2 }
    case 'outline':
      return { fill: '#1c3a5e', stroke: '#1c3a5e', fillOpacity: 0.12, weight: 2.5 }
    default:
      return { fill: '#4a6fa5', stroke: '#2f4f7a', fillOpacity: 0.3, weight: 2.2 }
  }
}

/** ~15 m square footprint when only centroid is known (matches Salesforce browser default). */
export function buildSquareFootprint(lng: number, lat: number, halfSize = 0.00007): unknown {
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - halfSize, lat - halfSize],
      [lng + halfSize, lat - halfSize],
      [lng + halfSize, lat + halfSize],
      [lng - halfSize, lat + halfSize],
      [lng - halfSize, lat - halfSize],
    ]],
  }
}

/** Polygon editors and Sakani map visibility use Map_Show_On_Map__c. */
export function resolveProjectShowOnMap(record: {
  Map_Show_On_Map__c?: boolean | null
}): boolean {
  return record.Map_Show_On_Map__c !== false
}

export function projectHasMapData(project: {
  mapCentroidLat?: number
  mapCentroidLng?: number
  mapGeometryJson?: unknown
}): boolean {
  if (typeof project.mapCentroidLat === 'number' && typeof project.mapCentroidLng === 'number') {
    return true
  }
  return isPolygon(project.mapGeometryJson) || isMultiPolygon(project.mapGeometryJson)
}

export function resolveMapCentroid(project: {
  mapCentroidLat?: number
  mapCentroidLng?: number
  mapGeometryJson?: unknown
}): { lat: number; lng: number } | undefined {
  if (typeof project.mapCentroidLat === 'number' && typeof project.mapCentroidLng === 'number') {
    return { lat: project.mapCentroidLat, lng: project.mapCentroidLng }
  }
  if (isPolygon(project.mapGeometryJson) && project.mapGeometryJson.coordinates[0]?.[0]) {
    const [lng, lat] = project.mapGeometryJson.coordinates[0][0]
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
  }
  if (isMultiPolygon(project.mapGeometryJson)) {
    const ring = project.mapGeometryJson.coordinates[0]?.[0]
    if (ring?.[0]) {
      const [lng, lat] = ring[0]
      if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
    }
  }
  return undefined
}

export function filterMapEligibleProjects<T extends {
  showOnMap?: boolean
  mapCentroidLat?: number
  mapCentroidLng?: number
  mapGeometryJson?: unknown
}>(projects: T[]): T[] {
  return projects.filter((p) => p.showOnMap !== false && projectHasMapData(p))
}

export function unitHasMapData(unit: {
  mapCentroidLat?: number
  mapCentroidLng?: number
  mapGeometryJson?: unknown
}): boolean {
  if (typeof unit.mapCentroidLat === 'number' && typeof unit.mapCentroidLng === 'number') return true
  return isGeoJsonPolygon(unit.mapGeometryJson) || isGeoJsonMultiPolygon(unit.mapGeometryJson)
}

export function resolveUnitMapGeometry(unit: {
  mapCentroidLat?: number
  mapCentroidLng?: number
  mapGeometryJson?: unknown
}): unknown | undefined {
  const parsed = parseMapGeometry(unit.mapGeometryJson)
  if (parsed) return parsed
  if (typeof unit.mapCentroidLat === 'number' && typeof unit.mapCentroidLng === 'number') {
    return buildSquareFootprint(unit.mapCentroidLng, unit.mapCentroidLat)
  }
  return undefined
}

export function filterMapEligibleUnits<T extends {
  showOnMap?: boolean
  mapCentroidLat?: number
  mapCentroidLng?: number
  mapGeometryJson?: unknown
}>(units: T[]): T[] {
  return units.filter((u) => u.showOnMap !== false && unitHasMapData(u))
}
