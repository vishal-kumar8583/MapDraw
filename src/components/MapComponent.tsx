import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useMultiDrawingHandlers } from '../hooks/useMultiDrawingHandlers'
import FeatureLayer from './FeatureLayer'

const MapComponent = () => {
  const map = useMap()
  const { cleanup } = useMultiDrawingHandlers(map)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 MapComponent unmounting, cleaning up')
      cleanup()
    }
  }, [cleanup])

  return <FeatureLayer />
}

export default MapComponent
