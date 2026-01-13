// @ts-ignore
import * as turf from '@turf/turf'
import { DrawingFeature } from '../types/feature'

export interface FeatureMeasurements {
  area?: string
  perimeter?: string
  length?: string
  center: string
  boundingBox: string
}

/**
 * Format area in appropriate units (sq meters or sq km)
 */
const formatArea = (areaInSquareMeters: number): string => {
  if (areaInSquareMeters >= 1000000) {
    // Convert to square kilometers
    const areaInSqKm = areaInSquareMeters / 1000000
    return `${areaInSqKm.toFixed(2)} km²`
  } else {
    // Keep in square meters
    return `${Math.round(areaInSquareMeters)} m²`
  }
}

/**
 * Format length/perimeter in appropriate units (meters or km)
 */
const formatLength = (lengthInMeters: number): string => {
  if (lengthInMeters >= 1000) {
    // Convert to kilometers
    const lengthInKm = lengthInMeters / 1000
    return `${lengthInKm.toFixed(2)} km`
  } else {
    // Keep in meters
    return `${Math.round(lengthInMeters)} m`
  }
}

/**
 * Format coordinates to 6 decimal places
 */
const formatCoordinates = (lat: number, lon: number): string => {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`
}

/**
 * Format bounding box coordinates
 */
const formatBoundingBox = (bbox: number[]): string => {
  const [minLon, minLat, maxLon, maxLat] = bbox
  return `SW: ${formatCoordinates(minLat, minLon)} | NE: ${formatCoordinates(maxLat, maxLon)}`
}

/**
 * Calculate measurements for any drawing feature
 */
export const calculateMeasurements = (feature: DrawingFeature): FeatureMeasurements => {
  try {
    const { geometry } = feature
    const measurements: FeatureMeasurements = {
      center: '',
      boundingBox: ''
    }

    // Calculate center point
    const center = turf.center(feature)
    const [centerLon, centerLat] = center.geometry.coordinates
    measurements.center = formatCoordinates(centerLat, centerLon)

    // Calculate bounding box
    const bbox = turf.bbox(feature)
    measurements.boundingBox = formatBoundingBox(bbox)

    // Calculate measurements based on geometry type
    if (geometry.type === 'Polygon') {
      // Calculate area
      const areaInSquareMeters = turf.area(feature)
      measurements.area = formatArea(areaInSquareMeters)

      // Calculate perimeter
      const perimeterInMeters = turf.length(feature, { units: 'meters' })
      measurements.perimeter = formatLength(perimeterInMeters)
    } else if (geometry.type === 'LineString') {
      // Calculate length
      const lengthInMeters = turf.length(feature, { units: 'meters' })
      measurements.length = formatLength(lengthInMeters)
    }

    return measurements
  } catch (error) {
    console.error('Error calculating measurements:', error)
    return {
      center: 'Error calculating',
      boundingBox: 'Error calculating'
    }
  }
}

/**
 * Get a compact measurement summary for display
 */
export const getMeasurementSummary = (feature: DrawingFeature): string => {
  const measurements = calculateMeasurements(feature)
  const { properties } = feature

  if (properties.type === 'lineString') {
    return measurements.length ? `Length: ${measurements.length}` : ''
  } else {
    // For polygons, rectangles, and circles
    const parts = []
    if (measurements.area) parts.push(`Area: ${measurements.area}`)
    if (measurements.perimeter) parts.push(`Perimeter: ${measurements.perimeter}`)
    return parts.join(' | ')
  }
}