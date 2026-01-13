import { DrawingFeature, ShapeType } from '../types/feature'

/**
 * Get the display name for a feature
 */
export const getFeatureDisplayName = (feature: DrawingFeature, allFeatures: DrawingFeature[]): string => {
  // If user has set a custom name, use it
  if (feature.properties.customName?.trim()) {
    return feature.properties.customName.trim()
  }
  
  // Otherwise, generate automatic name with numbering
  const shapeType = feature.properties.type
  const shapeTypeName = getShapeTypeName(shapeType)
  
  // Count how many of this shape type exist before this one (by order)
  const sameTypeFeatures = allFeatures
    .filter(f => f.properties.type === shapeType)
    .sort((a, b) => (a.properties.order || 0) - (b.properties.order || 0))
  
  const index = sameTypeFeatures.findIndex(f => f.properties.id === feature.properties.id)
  const number = index + 1
  
  return `${shapeTypeName} ${number}`
}

/**
 * Get the short display name for tooltips and compact displays
 */
export const getFeatureShortName = (feature: DrawingFeature, allFeatures: DrawingFeature[]): string => {
  if (feature.properties.customName?.trim()) {
    return feature.properties.customName.trim()
  }
  
  const shapeType = feature.properties.type
  const sameTypeFeatures = allFeatures
    .filter(f => f.properties.type === shapeType)
    .sort((a, b) => (a.properties.order || 0) - (b.properties.order || 0))
  
  const index = sameTypeFeatures.findIndex(f => f.properties.id === feature.properties.id)
  const number = index + 1
  
  // Use short names for tooltips
  const shortNames: Record<ShapeType, string> = {
    polygon: 'P',
    rectangle: 'R', 
    circle: 'C',
    lineString: 'L'
  }
  
  return `${shortNames[shapeType]}${number}`
}

/**
 * Get human-readable shape type name
 */
export const getShapeTypeName = (shapeType: ShapeType): string => {
  const names: Record<ShapeType, string> = {
    polygon: 'Polygon',
    rectangle: 'Rectangle',
    circle: 'Circle',
    lineString: 'Line'
  }
  return names[shapeType]
}

/**
 * Get the next suggested name for a shape type
 */
export const getNextShapeName = (shapeType: ShapeType, allFeatures: DrawingFeature[]): string => {
  const shapeTypeName = getShapeTypeName(shapeType)
  const sameTypeCount = allFeatures.filter(f => f.properties.type === shapeType).length
  return `${shapeTypeName} ${sameTypeCount + 1}`
}