import { create } from 'zustand'
import { DrawingFeature, ShapeType } from '../types/feature'

interface DrawingState {
  activeTool: ShapeType | null
  features: DrawingFeature[]
  error: string | null
}

interface DrawingStore extends DrawingState {
  setActiveTool: (tool: ShapeType | null) => void
  isToolActive: (tool: ShapeType) => boolean
  addFeature: (feature: DrawingFeature) => void
  removeFeature: (id: string) => void
  removeLastFeature: () => void
  updateFeature: (id: string, feature: Partial<DrawingFeature>) => void
  setError: (error: string | null) => void
  clearAllFeatures: () => void
}

// Debounce timer for tool changes
let toolChangeTimer: number | null = null

export const useDrawingStore = create<DrawingStore>((set, get) => ({
  activeTool: null,
  features: [],
  error: null,

  setActiveTool: (tool) => {
    const currentTool = get().activeTool
    console.log(`📝 Store: Setting active tool from ${currentTool} to ${tool}`)
    
    // Clear any pending tool change
    if (toolChangeTimer) {
      clearTimeout(toolChangeTimer)
    }
    
    // Debounce rapid tool changes
    toolChangeTimer = setTimeout(() => {
      set({ activeTool: tool, error: null })
      toolChangeTimer = null
    }, 10) // Small debounce to prevent race conditions
  },

  isToolActive: (tool) => {
    return get().activeTool === tool
  },

  addFeature: (feature) => {
    console.log(`📝 Store: Adding feature ${feature.properties.type}`)
    set((state) => ({
      features: [...state.features, feature],
      error: null,
    }))
  },

  removeFeature: (id) =>
    set((state) => ({
      features: state.features.filter((f) => f.properties.id !== id),
    })),

  removeLastFeature: () => {
    const currentFeatures = get().features
    if (currentFeatures.length > 0) {
      const lastFeature = currentFeatures[currentFeatures.length - 1]
      console.log(`📝 Store: Removing last feature (${lastFeature.properties.type})`)
      set((state) => ({
        features: state.features.slice(0, -1), // Remove the last feature
        error: null,
      }))
    } else {
      console.log('📝 Store: No features to remove')
    }
  },

  updateFeature: (id, updates) =>
    set((state) => ({
      features: state.features.map((f) =>
        f.properties.id === id ? { ...f, ...updates } : f
      ),
    })),

  setError: (error) => {
    console.log(`📝 Store: Setting error:`, error)
    set({ error })
  },

  clearAllFeatures: () => {
    console.log('📝 Store: Clearing all features')
    set({ features: [], error: null })
  }
}))
