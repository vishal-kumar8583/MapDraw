import { useState, useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import MapComponent from './components/MapComponent'
import Toolbar from './components/Toolbar'
import SearchBox from './components/SearchBox'
import MapSearchComponent from './components/MapSearchComponent'
import MeasurementsPanel from './components/MeasurementsPanel'
import LandingPage from './components/LandingPage'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './config/mapConfig'
import './utils/leafletIconFix'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import './App.css'

function App() {
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lon: number; name: string } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [tilesLoaded, setTilesLoaded] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleLocationSelect = (lat: number, lon: number, name: string) => {
    setSearchLocation({ lat, lon, name })
    
    // Clear the search location after the map updates
    setTimeout(() => {
      setSearchLocation(null)
    }, 1000)
  }

  const handleEnterApp = () => {
    setIsTransitioning(true)
    
    // Start the slide transition animation immediately
    // Remove landing page after animation completes
    setTimeout(() => {
      setShowLandingPage(false)
    }, 900) // Slightly longer than CSS transition to ensure smooth completion
  }

  // Handle when map tiles finish loading
  const handleTileLoadStart = () => {
    console.log('🗺️ Tiles started loading')
  }

  const handleTileLoad = () => {
    console.log('🗺️ Tiles loaded')
    setTilesLoaded(true)
  }

  // Hide loading after map is ready or timeout
  useEffect(() => {
    // Start loading map components as soon as transition begins
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setMapLoaded(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  // Also hide loading when tiles are loaded
  useEffect(() => {
    if (tilesLoaded) {
      const timer = setTimeout(() => {
        setMapLoaded(true)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [tilesLoaded])

  return (
    <div className="app">
      {/* Main App - always rendered but positioned off-screen initially */}
      <div className={`main-app ${isTransitioning ? 'slide-in' : ''}`}>
        {/* Map Loading Indicator */}
        {isTransitioning && !mapLoaded && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: 'white'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '20px'
            }}></div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '600' }}>Loading Map</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Preparing your mapping experience...</p>
          </div>
        )}
        
        <Toolbar />
        <MeasurementsPanel />
        <div className="search-overlay">
          <SearchBox onLocationSelect={handleLocationSelect} />
        </div>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100vh', width: '100vw' }}
          preferCanvas={true}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          attributionControl={false}
        >
          <TileLayer
            attribution=''
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            minZoom={3}
            tileSize={256}
            zoomOffset={0}
            crossOrigin={true}
            keepBuffer={4}
            updateWhenIdle={true}
            updateWhenZooming={false}
            updateInterval={200}
            eventHandlers={{
              loading: handleTileLoadStart,
              load: handleTileLoad,
            }}
          />
          <MapComponent />
          <MapSearchComponent searchLocation={searchLocation} />
        </MapContainer>
      </div>

      {/* Landing Page - overlays on top initially */}
      {showLandingPage && (
        <LandingPage onEnter={handleEnterApp} isTransitioning={isTransitioning} />
      )}
    </div>
  )
}

export default App
