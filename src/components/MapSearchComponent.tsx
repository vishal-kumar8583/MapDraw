import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import { useDrawingStore } from '../store/useDrawingStore'
import * as L from 'leaflet'

interface MapSearchComponentProps {
  searchLocation: { lat: number; lon: number; name: string } | null
}

const MapSearchComponent = ({ searchLocation }: MapSearchComponentProps) => {
  const map = useMap()
  const { setError } = useDrawingStore()
  const [searchMarker, setSearchMarker] = useState<L.Marker | null>(null)

  // Handle location updates with useEffect
  useEffect(() => {
    if (searchLocation) {
      // Validate coordinates
      if (isNaN(searchLocation.lat) || isNaN(searchLocation.lon)) {
        setError('Invalid location coordinates')
        return
      }
      
      try {
        // Remove previous search marker if it exists
        if (searchMarker) {
          map.removeLayer(searchMarker)
        }

        const targetCoords: [number, number] = [searchLocation.lat, searchLocation.lon]

        // Create a simple search marker
        const searchIcon = L.divIcon({
          html: `
            <div style="
              background: #3b82f6;
              border: 2px solid white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            "></div>
          `,
          className: 'search-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })

        // Add new search marker
        const marker = L.marker(targetCoords, {
          icon: searchIcon
        }).addTo(map)

        // Add simple popup
        marker.bindPopup(`📍 ${searchLocation.name.split(',')[0]}`, {
          closeButton: false,
          className: 'search-popup'
        }).openPopup()

        setSearchMarker(marker)

        // Navigate to location
        map.setView(targetCoords, 13)
        
        // Remove the marker after 3 seconds
        setTimeout(() => {
          if (marker && map.hasLayer(marker)) {
            map.removeLayer(marker)
            setSearchMarker(null)
          }
        }, 3000)
        
      } catch (error) {
        console.error('❌ Error navigating to location:', error)
        setError('Failed to navigate to selected location')
      }
    }
  }, [searchLocation, map, setError, searchMarker])

  // Cleanup marker on unmount
  useEffect(() => {
    return () => {
      if (searchMarker && map.hasLayer(searchMarker)) {
        map.removeLayer(searchMarker)
      }
    }
  }, [searchMarker, map])

  return null // This component doesn't render anything
}

export default MapSearchComponent