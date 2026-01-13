import { Feature, Polygon, LineString, Point } from 'geojson'

export type ShapeType = 'polygon' | 'rectangle' | 'circle' | 'lineString'

export interface DrawingFeature extends Feature {
  geometry: Polygon | LineString | Point
  properties: {
    id: string
    type: ShapeType
    name?: string
    customName?: string
    color?: string
    order?: number
  }
}
