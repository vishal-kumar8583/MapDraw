import { useRef, useCallback, useEffect } from 'react'
import { Map as LeafletMap } from 'leaflet'
import 'leaflet-draw'
import { useDrawingStore } from '../store/useDrawingStore'
import { ShapeType, DrawingFeature } from '../types/feature'
import {
  generateFeatureId,
  getShapeColor,
  getPolygonFeatures,
  trimPolygonOverlaps,
  isPolygonEnclosed,
} from '../utils/geometry'
import * as L from 'leaflet'
import { Feature, Polygon } from 'geojson'

export const useMultiDrawingHandlers = (map: LeafletMap) => {
  const { addFeature, setError, activeTool, setActiveTool, features } = useDrawingStore()
  const currentHandlerRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const isProcessingRef = useRef(false) // Prevent race conditions

  // Handle draw created event
  const handleDrawCreated = useCallback((e: any) => {
    if (isProcessingRef.current) return // Prevent multiple simultaneous processing
    isProcessingRef.current = true
    
    console.log('🎨 Shape drawn:', e.layerType)
    console.log('🎨 Draw event:', e)
    console.log('🎨 Layer:', e.layer)
    
    try {
      const layer = e.layer
      const layerType = e.layerType
      let feature: DrawingFeature

      // Process different shape types
      if (layerType === 'rectangle') {
        console.log('🟩 Processing rectangle...')
        console.log('🟩 Rectangle layer:', layer)
        
        if (!layer.getBounds) {
          console.error('🟩 Rectangle layer does not have getBounds method')
          isProcessingRef.current = false
          return
        }
        
        const bounds = layer.getBounds()
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        
        console.log('🟩 Rectangle bounds:', { sw, ne })
        
        feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [sw.lng, sw.lat],
              [sw.lng, ne.lat],
              [ne.lng, ne.lat],
              [ne.lng, sw.lat],
              [sw.lng, sw.lat]
            ]]
          },
          properties: {
            id: generateFeatureId('rectangle'),
            type: 'rectangle',
            color: getShapeColor('rectangle'),
            order: features.length + 1,
          }
        }
        console.log('🟩 Rectangle feature created:', feature)
      } else if (layerType === 'circle') {
        const center = layer.getLatLng()
        const radius = layer.getRadius()
        const points = []
        const steps = 32
        
        for (let i = 0; i < steps; i++) {
          const angle = (i * 360) / steps * Math.PI / 180
          const lat = center.lat + (radius / 111320) * Math.cos(angle)
          const lng = center.lng + (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle)
          points.push([lng, lat])
        }
        points.push(points[0])
        
        feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [points]
          },
          properties: {
            id: generateFeatureId('circle'),
            type: 'circle',
            color: getShapeColor('circle'),
            order: features.length + 1,
          }
        }
      } else {
        // Handle polygon and polyline
        const geoJson = layer.toGeoJSON()
        feature = geoJson as DrawingFeature
        
        let shapeType: ShapeType = 'polygon'
        if (layerType === 'polyline') shapeType = 'lineString'
        else if (layerType === 'polygon') shapeType = 'polygon'
        
        feature.properties = {
          id: generateFeatureId(shapeType),
          type: shapeType,
          color: getShapeColor(shapeType),
          order: features.length + 1,
        }
      }

      console.log('✅ Feature created:', feature.properties.type)
      
      // Apply overlap constraints for polygonal features only
      if (['polygon', 'rectangle', 'circle'].includes(feature.properties.type)) {
        console.log('🔍 Checking overlap constraints for polygonal feature...')
        
        const existingPolygons = getPolygonFeatures(features)
        const newPolygon = feature as Feature<Polygon>
        
        // Check if the new polygon fully encloses any existing polygon
        const enclosesExisting = existingPolygons.some(existing => 
          isPolygonEnclosed(newPolygon, existing)
        )
        
        if (enclosesExisting) {
          console.log('❌ New polygon fully encloses an existing polygon - blocking')
          setError('🚫 Cannot create a polygon that fully encloses another polygon. Please draw in a different area.')
          isProcessingRef.current = false
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            setError(null)
          }, 5000)
          
          // Clean up and exit
          setTimeout(() => {
            setActiveTool(null)
          }, 50)
          return
        }
        
        // Check if any existing polygon fully encloses the new one
        const isEnclosedByExisting = existingPolygons.some(existing => 
          isPolygonEnclosed(existing, newPolygon)
        )
        
        if (isEnclosedByExisting) {
          console.log('❌ New polygon is fully enclosed by an existing polygon - blocking')
          setError('🚫 Cannot create a polygon inside another polygon. Please draw in a different area.')
          isProcessingRef.current = false
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            setError(null)
          }, 5000)
          
          // Clean up and exit
          setTimeout(() => {
            setActiveTool(null)
          }, 50)
          return
        }
        
        // Auto-trim overlaps if any exist
        const trimmedPolygon = trimPolygonOverlaps(newPolygon, existingPolygons)
        
        if (!trimmedPolygon) {
          console.log('❌ Polygon was completely trimmed away - blocking')
          setError('✂️ The drawn area overlaps too much with existing polygons. Please draw in a different area.')
          isProcessingRef.current = false
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            setError(null)
          }, 5000)
          
          // Clean up and exit
          setTimeout(() => {
            setActiveTool(null)
          }, 50)
          return
        }
        
        // If trimming occurred, update the feature
        if (trimmedPolygon !== newPolygon) {
          console.log('✂️ Polygon was auto-trimmed to remove overlaps')
          // Show success message for auto-trimming
          setError('✂️ Polygon auto-trimmed to remove overlaps with existing shapes.')
          setTimeout(() => {
            setError(null)
          }, 3000)
          
          feature = {
            ...feature,
            geometry: trimmedPolygon.geometry
          } as DrawingFeature
        }
      } else {
        console.log('📏 Line string feature - no overlap constraints applied')
      }

      addFeature(feature)

      // CRITICAL FIX: Properly sequence the cleanup
      console.log('🔄 Starting proper tool cleanup sequence')
      
      // Step 1: Disable the current handler immediately
      if (currentHandlerRef.current) {
        try {
          currentHandlerRef.current.disable()
          console.log('✅ Handler disabled')
        } catch (e) {
          console.log('⚠️ Error disabling handler:', e)
        }
        currentHandlerRef.current = null
      }
      
      // Step 2: Clean up map state
      const mapContainer = map.getContainer()
      if (mapContainer) {
        mapContainer.classList.remove('leaflet-draw-drawing')
        mapContainer.classList.remove('leaflet-draw-drawing-polygon')
        mapContainer.classList.remove('leaflet-draw-drawing-rectangle')
        mapContainer.classList.remove('leaflet-draw-drawing-circle')
        mapContainer.classList.remove('leaflet-draw-drawing-polyline')
      }
      
      // Step 3: Clear active tool state AFTER cleanup is complete
      setTimeout(() => {
        setActiveTool(null)
        isProcessingRef.current = false
        console.log('✅ Tool cleanup sequence completed')
      }, 50) // Small delay to ensure cleanup completes

    } catch (error) {
      console.error('❌ Error creating feature:', error)
      setError('Failed to create feature. Please try again.')
      isProcessingRef.current = false
    }
  }, [addFeature, setError, setActiveTool, map, features])

  // Complete tool cleanup function
  const forceCleanupTool = useCallback(() => {
    console.log('🧹 Force cleaning up current tool')
    
    // Reset cursor to default by removing all drawing classes
    const mapContainer = map.getContainer()
    mapContainer.classList.remove('rectangle-drawing', 'circle-drawing', 'polygon-drawing', 'line-drawing')
    
    // Disable current handler
    if (currentHandlerRef.current) {
      try {
        currentHandlerRef.current.disable()
      } catch (e) {
        console.log('⚠️ Error during force cleanup:', e)
      }
      currentHandlerRef.current = null
    }
    
    // Clean up map container classes
    if (mapContainer) {
      mapContainer.classList.remove('leaflet-draw-drawing')
      mapContainer.classList.remove('leaflet-draw-drawing-polygon')
      mapContainer.classList.remove('leaflet-draw-drawing-rectangle')
      mapContainer.classList.remove('leaflet-draw-drawing-circle')
      mapContainer.classList.remove('leaflet-draw-drawing-polyline')
    }
    
    // Remove any lingering event listeners
    map.off('draw:drawstart')
    map.off('draw:drawstop')
    map.off('draw:cancelled')
    
    console.log('✅ Force cleanup completed')
  }, [map])

  // Enable a specific tool with proper sequencing
  const enableTool = useCallback((toolType: ShapeType) => {
    if (isProcessingRef.current) {
      console.log('⏳ Tool processing in progress, skipping enable')
      return false
    }
    
    console.log(`🎯 Enabling ${toolType} tool`)
    
    // Step 1: Force cleanup any existing tool
    forceCleanupTool()
    
    // Step 2: Wait a moment for cleanup to complete, then create new tool
    setTimeout(() => {
      try {
        let newHandler: any = null
        
        switch (toolType) {
          case 'polygon':
            newHandler = new L.Draw.Polygon(map as any, {
              allowIntersection: false,
              shapeOptions: {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                weight: 3
              }
            })
            // Change cursor for polygon drawing
            if (newHandler) {
              const originalEnable = newHandler.enable
              const originalDisable = newHandler.disable
              
              newHandler.enable = function() {
                map.getContainer().classList.add('polygon-drawing')
                return originalEnable.call(this)
              }
              
              newHandler.disable = function() {
                map.getContainer().classList.remove('polygon-drawing')
                return originalDisable.call(this)
              }
            }
            break
            
          case 'rectangle':
            console.log('🟩 Creating custom rectangle handler...')
            
            // Custom rectangle drawing implementation
            let startPoint: L.LatLng | null = null
            let tempRectangle: L.Rectangle | null = null
            
            // Create a custom rectangle handler
            const customRectangleHandler: any = {
              _enabled: false,
              _clickHandler: null,
              _mouseMoveHandler: null,
              
              enable() {
                this._enabled = true
                console.log('🟩 Custom rectangle handler enabled')
                
                // Change cursor to custom rectangle cursor
                const mapContainer = map.getContainer()
                mapContainer.classList.add('rectangle-drawing')
                
                // Add click handler for rectangle drawing
                const onMapClick = (e: L.LeafletMouseEvent) => {
                  if (!startPoint) {
                    // First click - set start point
                    startPoint = e.latlng
                    console.log('🟩 Rectangle start point:', startPoint)
                    
                    // Create temporary rectangle for preview
                    const bounds = L.latLngBounds([startPoint.lat, startPoint.lng], [startPoint.lat, startPoint.lng])
                    tempRectangle = L.rectangle(bounds, {
                      color: '#10b981',
                      fillColor: '#10b981',
                      fillOpacity: 0.3,
                      weight: 3,
                      dashArray: '5, 5'
                    }).addTo(map)
                    
                    // Add mousemove handler for preview
                    const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
                      if (tempRectangle && startPoint) {
                        const bounds = L.latLngBounds([startPoint.lat, startPoint.lng], [moveEvent.latlng.lat, moveEvent.latlng.lng])
                        tempRectangle.setBounds(bounds)
                      }
                    }
                    
                    map.on('mousemove', onMouseMove)
                    this._mouseMoveHandler = onMouseMove
                  } else {
                    // Second click - complete rectangle
                    const endPoint = e.latlng
                    console.log('🟩 Rectangle end point:', endPoint)
                    
                    // Clean up temporary rectangle
                    if (tempRectangle) {
                      map.removeLayer(tempRectangle)
                      tempRectangle = null
                    }
                    
                    // Clean up mousemove handler
                    if (this._mouseMoveHandler) {
                      map.off('mousemove', this._mouseMoveHandler)
                      this._mouseMoveHandler = null
                    }
                    
                    // Create final rectangle bounds
                    const bounds = L.latLngBounds([startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng])
                    
                    // Create a temporary rectangle layer for the draw:created event
                    const finalRectangle = L.rectangle(bounds, {
                      color: '#10b981',
                      fillColor: '#10b981',
                      fillOpacity: 0.3,
                      weight: 3
                    })
                    
                    // Fire the draw:created event manually
                    map.fire('draw:created', {
                      layer: finalRectangle,
                      layerType: 'rectangle'
                    })
                    
                    // Reset for next rectangle
                    startPoint = null
                    this.disable()
                  }
                }
                
                map.on('click', onMapClick)
                this._clickHandler = onMapClick
              },
              
              disable() {
                this._enabled = false
                console.log('🟩 Custom rectangle handler disabled')
                
                // Reset cursor to default
                const mapContainer = map.getContainer()
                mapContainer.classList.remove('rectangle-drawing')
                
                // Clean up event handlers
                if (this._clickHandler) {
                  map.off('click', this._clickHandler)
                  this._clickHandler = null
                }
                
                if (this._mouseMoveHandler) {
                  map.off('mousemove', this._mouseMoveHandler)
                  this._mouseMoveHandler = null
                }
                
                // Clean up temporary rectangle
                if (tempRectangle) {
                  map.removeLayer(tempRectangle)
                  tempRectangle = null
                }
                
                // Reset state
                startPoint = null
              }
            }
            
            newHandler = customRectangleHandler
            console.log('🟩 Custom rectangle handler created')
            break
            
          case 'circle':
            newHandler = new L.Draw.Circle(map as any, {
              shapeOptions: {
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.3,
                weight: 3
              }
            })
            // Change cursor for circle drawing
            if (newHandler) {
              const originalEnable = newHandler.enable
              const originalDisable = newHandler.disable
              
              newHandler.enable = function() {
                map.getContainer().classList.add('circle-drawing')
                return originalEnable.call(this)
              }
              
              newHandler.disable = function() {
                map.getContainer().classList.remove('circle-drawing')
                return originalDisable.call(this)
              }
            }
            break
            
          case 'lineString':
            newHandler = new L.Draw.Polyline(map as any, {
              shapeOptions: {
                color: '#8b5cf6',
                weight: 4,
                opacity: 0.8
              }
            })
            // Change cursor for line drawing
            if (newHandler) {
              const originalEnable = newHandler.enable
              const originalDisable = newHandler.disable
              
              newHandler.enable = function() {
                map.getContainer().classList.add('line-drawing')
                return originalEnable.call(this)
              }
              
              newHandler.disable = function() {
                map.getContainer().classList.remove('line-drawing')
                return originalDisable.call(this)
              }
            }
            break
        }

        if (newHandler) {
          currentHandlerRef.current = newHandler
          try {
            newHandler.enable()
            console.log(`✅ ${toolType} tool enabled successfully`)
            
            // Special debugging for rectangle
            if (toolType === 'rectangle') {
              console.log('🟩 Rectangle handler enabled, checking state...')
              console.log('🟩 Handler enabled state:', newHandler._enabled)
              console.log('🟩 Handler methods:', Object.getOwnPropertyNames(newHandler))
            }
          } catch (enableError) {
            console.error(`❌ Error enabling ${toolType} tool:`, enableError)
          }
        } else {
          console.error(`❌ Failed to create ${toolType} handler`)
        }
      } catch (error) {
        console.error(`❌ Failed to enable ${toolType} tool:`, error)
        setError(`Failed to enable ${toolType} tool`)
      }
    }, 100) // Delay to ensure cleanup completes
    
    return true
  }, [map, setError, forceCleanupTool])

  // Initialize drawing system
  const initializeDrawing = useCallback(() => {
    if (isInitializedRef.current) return
    
    console.log('🚀 Initializing drawing system...')
    
    try {
      // Add draw created listener
      map.on('draw:created', handleDrawCreated)
      
      isInitializedRef.current = true
      console.log('✅ Drawing system initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize drawing system:', error)
      setError('Failed to initialize drawing tools. Please refresh the page.')
    }
  }, [handleDrawCreated, map, setError])

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up drawing system...')
    
    try {
      forceCleanupTool()
      map.off('draw:created', handleDrawCreated)
      isInitializedRef.current = false
      console.log('✅ Drawing system cleaned up')
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
    }
  }, [forceCleanupTool, map, handleDrawCreated])

  // FIXED: Handle tool changes with proper sequencing
  useEffect(() => {
    console.log(`🔄 Tool state changed to: ${activeTool}`)
    
    if (activeTool) {
      enableTool(activeTool)
    } else {
      forceCleanupTool()
    }
  }, [activeTool]) // Removed function dependencies to prevent race conditions

  // Initialize on mount
  useEffect(() => {
    initializeDrawing()
    return cleanup
  }, [initializeDrawing, cleanup])

  return {
    enableTool,
    forceCleanupTool,
    cleanup
  }
}