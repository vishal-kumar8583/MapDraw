/**
 * Dynamic configuration for maximum shapes per type
 * Easily adjustable limits for each shape type
 */
export interface ShapeLimits {
  polygon: number
  rectangle: number
  circle: number
  lineString: number
}

export const DEFAULT_SHAPE_LIMITS: ShapeLimits = {
  polygon: 10,
  rectangle: 5,
  circle: 5,
  lineString: 20, // LineStrings have no overlap restrictions, so higher limit
}
