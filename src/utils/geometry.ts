// @ts-ignore
import * as turf from '@turf/turf'
import { Feature, Polygon } from 'geojson'
import { DrawingFeature, ShapeType } from '../types/feature'

/**
 * Generate a unique ID for a feature
 */
export const generateFeatureId = (type: ShapeType): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get color for a shape type
 */
export const getShapeColor = (type: ShapeType): string => {
  const colors: Record<ShapeType, string> = {
    polygon: '#3388ff',
    rectangle: '#ff7800',
    circle: '#ff0000',
    lineString: '#00ff00',
  }
  return colors[type]
}

/**
 * Check if a polygon fully encloses another polygon
 */
export const isPolygonEnclosed = (
  outer: Feature<Polygon>,
  inner: Feature<Polygon>
): boolean => {
  try {
    // Check if all points of inner polygon are inside outer polygon
    const innerPoints = turf.explode(inner)
    const allInside = innerPoints.features.every((point: any) =>
      turf.booleanPointInPolygon(point, outer)
    )
    return allInside
  } catch (error) {
    console.error('Error checking polygon enclosure:', error)
    return false
  }
}

/**
 * Check if two polygons overlap
 */
export const doPolygonsOverlap = (
  poly1: Feature<Polygon>,
  poly2: Feature<Polygon>
): boolean => {
  try {
    const intersection = turf.intersect(poly1, poly2)
    return intersection !== null && turf.area(intersection) > 0
  } catch (error) {
    console.error('Error checking polygon overlap:', error)
    return false
  }
}

/**
 * Auto-trim a polygon to remove overlaps with existing polygons
 * Uses Turf.js difference operation to subtract overlapping areas
 */
export const trimPolygonOverlaps = (
  newPolygon: Feature<Polygon>,
  existingPolygons: Feature<Polygon>[]
): Feature<Polygon> | null => {
  let result: Feature<Polygon> | null = newPolygon

  try {
    // Iterate through existing polygons and subtract overlaps
    for (const existing of existingPolygons) {
      if (result && doPolygonsOverlap(result, existing)) {
        // Check if new polygon is fully enclosed
        if (isPolygonEnclosed(existing, result)) {
          return null // Block fully enclosed polygons
        }

        // Check if existing polygon is fully enclosed (shouldn't happen if we trim as we go)
        if (isPolygonEnclosed(result, existing)) {
          continue // Skip this one, it's inside the new polygon
        }

        // Subtract the overlapping area
        const difference: any = turf.difference(result, existing)
        if (!difference) {
          // If difference results in nothing, return null
          return null
        }
        
        if (difference.geometry.type === 'Polygon') {
          result = difference as Feature<Polygon>
        } else if (difference.geometry.type === 'MultiPolygon') {
          // If result is MultiPolygon, take the largest polygon
          // Use turf.flatten to get individual polygons
          const flattened: any = turf.flatten(difference)
          if (flattened.features.length === 0) {
            return null
          }
          // Find the largest polygon by area
          result = flattened.features.reduce((largest: any, current: any) => {
            if (current.geometry.type === 'Polygon') {
              const currentArea = turf.area(current)
              const largestArea = largest ? turf.area(largest) : 0
              return currentArea > largestArea ? current : largest
            }
            return largest
          }, null as Feature<Polygon> | null)
          
          if (!result) {
            return null
          }
        } else {
          // Unknown geometry type
          return null
        }
      }
    }
  } catch (error) {
    console.error('Error trimming polygon overlaps:', error)
    return null
  }

  return result
}

/**
 * Convert a circle (center + radius) to a polygon
 */
export const circleToPolygon = (
  center: [number, number],
  radiusInKm: number,
  steps: number = 64
): Feature<Polygon> => {
  return turf.circle(center, radiusInKm, { steps, units: 'kilometers' })
}

/**
 * Convert a rectangle (bounds) to a polygon
 */
export const rectangleToPolygon = (
  bounds: [[number, number], [number, number]]
): Feature<Polygon> => {
  const [southWest, northEast] = bounds
  return turf.bboxPolygon([
    southWest[1], // minX
    southWest[0], // minY
    northEast[1], // maxX
    northEast[0], // maxY
  ])
}

/**
 * Get all polygon features (including circles and rectangles converted to polygons)
 */
export const getPolygonFeatures = (
  features: DrawingFeature[]
): Feature<Polygon>[] => {
  return features
    .filter((f) => ['polygon', 'rectangle', 'circle'].includes(f.properties.type))
    .map((f) => {
      if (f.properties.type === 'polygon') {
        return f as Feature<Polygon>
      }
      // For rectangle and circle, they should already be stored as polygons
      return f as Feature<Polygon>
    })
}
