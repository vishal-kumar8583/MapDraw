import { FeatureCollection } from 'geojson'
import { DrawingFeature } from '../types/feature'

/**
 * Export all features as GeoJSON
 */
export const exportToGeoJSON = (features: DrawingFeature[]): string => {
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id: f.properties.id,
        type: f.properties.type,
        name: f.properties.name || `Untitled ${f.properties.type}`,
        color: f.properties.color,
      },
    })),
  }

  return JSON.stringify(featureCollection, null, 2)
}

/**
 * Download GeoJSON as a file
 */
export const downloadGeoJSON = (features: DrawingFeature[]): void => {
  const geoJson = exportToGeoJSON(features)
  const blob = new Blob([geoJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `map-features-${Date.now()}.geojson`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
