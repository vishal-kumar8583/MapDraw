import React from 'react'
import { GeoJSON, Marker } from 'react-leaflet'
import { useDrawingStore } from '../store/useDrawingStore'
import { getMeasurementSummary } from '../utils/measurements'
import { getFeatureShortName } from '../utils/naming'
// @ts-ignore
import * as turf from '@turf/turf'
import L from 'leaflet'

const FeatureLayer = () => {
  const { features } = useDrawingStore()

  console.log('🗺️ FeatureLayer rendering with features:', features.length)
  console.log('🗺️ Features data:', features)

  const getFeatureStyle = (feature: any): any => {
    const type = feature?.properties?.type
    const color = feature?.properties?.color || '#3388ff'

    // Enhanced styling based on feature type
    const baseStyle = {
      weight: 3,
      opacity: 0.9,
      fillOpacity: 0.4,
    }

    switch (type) {
      case 'polygon':
        return {
          ...baseStyle,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          weight: 3,
          dashArray: '',
          fillOpacity: 0.3,
        }
      
      case 'rectangle':
        return {
          ...baseStyle,
          color: '#10b981',
          fillColor: '#10b981',
          weight: 3,
          dashArray: '',
          fillOpacity: 0.3,
        }
      
      case 'circle':
        return {
          ...baseStyle,
          color: '#ef4444',
          fillColor: '#ef4444',
          weight: 3,
          dashArray: '',
          fillOpacity: 0.3,
        }
      
      case 'lineString':
        return {
          ...baseStyle,
          color: '#8b5cf6',
          weight: 4,
          opacity: 0.8,
          dashArray: '',
        }
      
      default:
        return {
          ...baseStyle,
          color: color,
          fillColor: color,
        }
    }
  }

  // Create custom icon for shape labels
  const createLabelIcon = (text: string, color: string) => {
    return L.divIcon({
      html: `<div class="shape-label" style="background-color: ${color}; color: white;">${text}</div>`,
      className: 'shape-label-marker',
      iconSize: [30, 20],
      iconAnchor: [15, 10]
    })
  }

  if (features.length === 0) {
    console.log('🗺️ No features to render')
    return null
  }

  console.log('🗺️ Rendering', features.length, 'features')

  // Render each feature as a separate GeoJSON component to ensure proper updates
  return (
    <>
      {features.map((feature, index) => {
        console.log(`🗺️ Rendering feature ${index}:`, feature)
        
        const shortName = getFeatureShortName(feature, features)
        const color = getFeatureStyle(feature).color
        
        // Calculate center point for label
        const center = turf.center(feature)
        const [centerLon, centerLat] = center.geometry.coordinates
        
        return (
          <React.Fragment key={`feature-group-${feature.properties.id}-${index}`}>
            <GeoJSON
              key={`feature-${feature.properties.id}-${index}`}
              data={feature}
              style={() => getFeatureStyle(feature)}
              onEachFeature={(geoJsonFeature, layer) => {
                // Add measurement tooltip
                const summary = getMeasurementSummary(feature)
                if (summary) {
                  layer.bindTooltip(`${shortName}: ${summary}`, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -10],
                    className: 'measurement-tooltip'
                  })
                }

                // Add hover effects
                layer.on('mouseover', function(e) {
                  const layer = e.target
                  layer.setStyle({
                    weight: 5,
                    opacity: 1,
                    fillOpacity: 0.6,
                  })
                })

                layer.on('mouseout', function(e) {
                  const layer = e.target
                  const originalStyle = getFeatureStyle(geoJsonFeature)
                  layer.setStyle(originalStyle)
                })
              }}
            />
            
            {/* Shape label marker */}
            <Marker
              key={`label-${feature.properties.id}-${index}`}
              position={[centerLat, centerLon]}
              icon={createLabelIcon(shortName, color)}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}

export default FeatureLayer
