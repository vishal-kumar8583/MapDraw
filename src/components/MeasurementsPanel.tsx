import React, { useState, useEffect } from 'react'
import { useDrawingStore } from '../store/useDrawingStore'
import { calculateMeasurements, getMeasurementSummary } from '../utils/measurements'
import { getFeatureDisplayName, getShapeTypeName } from '../utils/naming'
import './MeasurementsPanel.css'

const MeasurementsPanel: React.FC = () => {
  const { features, updateFeature } = useDrawingStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isHidden, setIsHidden] = useState(false)

  // Add keyboard shortcut for measurements panel toggle (Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault()
        setIsHidden(!isHidden)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isHidden])

  const handleNameClick = (feature: any) => {
    setEditingId(feature.properties.id)
    setEditingName(feature.properties.customName || '')
  }

  const handleNameSave = (featureId: string) => {
    const currentFeature = features.find(f => f.properties.id === featureId)
    if (currentFeature) {
      updateFeature(featureId, {
        properties: {
          ...currentFeature.properties,
          customName: editingName.trim()
        }
      })
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleNameCancel = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent, featureId: string) => {
    if (e.key === 'Enter') {
      handleNameSave(featureId)
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }

  if (features.length === 0) {
    return null
  }

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button 
        className={`measurements-toggle ${isHidden ? 'collapsed' : 'expanded'}`}
        onClick={() => setIsHidden(!isHidden)}
        title={isHidden ? 'Show Measurements Panel (Ctrl+M)' : 'Hide Measurements Panel (Ctrl+M)'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`measurements-toggle-icon ${isHidden ? 'rotated' : ''}`}
        >
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      </button>
      
      <div className={`measurements-panel ${isHidden ? 'hidden' : ''}`}>
        <div className="measurements-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3V21H21V9L15 3H3Z"/>
            <path d="M9 9H15M9 13H15M9 17H13"/>
          </svg>
          <h3>Measurements & Stats</h3>
        </div>
        <div className="measurements-content">
          {features.map((feature, index) => {
            const measurements = calculateMeasurements(feature)
            const summary = getMeasurementSummary(feature)
            const { type } = feature.properties
            const displayName = getFeatureDisplayName(feature, features)
            const isEditing = editingId === feature.properties.id

            return (
              <div key={feature.properties.id} className="measurement-item">
                <div className="measurement-title">
                  <span className={`shape-icon shape-${type}`}>
                    {type === 'polygon' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                      </svg>
                    )}
                    {type === 'rectangle' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    )}
                    {type === 'circle' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    )}
                    {type === 'lineString' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12H21M3 6H21M3 18H21"/>
                      </svg>
                    )}
                  </span>
                  <div className="shape-name-container">
                    {isEditing ? (
                      <div className="name-edit-container">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleNameSave(feature.properties.id)}
                          onKeyDown={(e) => handleKeyPress(e, feature.properties.id)}
                          className="name-edit-input"
                          placeholder={`${getShapeTypeName(type)} ${index + 1}`}
                          autoFocus
                          maxLength={30}
                        />
                        <div className="name-edit-buttons">
                          <button 
                            className="name-save-btn"
                            onClick={() => handleNameSave(feature.properties.id)}
                            title="Save name"
                          >
                          </button>
                          <button 
                            className="name-cancel-btn"
                            onClick={handleNameCancel}
                            title="Cancel"
                          >
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span 
                        className="shape-name editable-name"
                        onClick={() => handleNameClick(feature)}
                        title="Click to edit name"
                      >
                        {displayName}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="edit-icon">
                          <path d="M11 4H4A2 2 0 0 0 2 6V20A2 2 0 0 0 4 22H18A2 2 0 0 0 20 20V13"/>
                          <path d="M18.5 2.5A2.121 2.121 0 0 1 21 5L12 14L8 15L9 11L18.5 2.5Z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                
                {summary && (
                  <div className="measurement-summary">
                    {summary}
                  </div>
                )}
                
                <div className="measurement-details">
                  <div className="measurement-row">
                    <span className="measurement-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 21 10Z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Center:
                    </span>
                    <span className="measurement-value">{measurements.center}</span>
                  </div>
                  <div className="measurement-row">
                    <span className="measurement-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12H22"/>
                        <path d="M12 2A15.3 15.3 0 0 1 4 6"/>
                        <path d="M12 2A15.3 15.3 0 0 0 20 6"/>
                      </svg>
                      Bounds:
                    </span>
                    <span className="measurement-value">{measurements.boundingBox}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default MeasurementsPanel