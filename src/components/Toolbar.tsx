import { useDrawingStore } from '../store/useDrawingStore'
import { ShapeType } from '../types/feature'
import { downloadGeoJSON } from '../utils/export'
import { getFeatureDisplayName } from '../utils/naming'
import { useState, useEffect } from 'react'
import './Toolbar.css'

const Toolbar = () => {
  const { 
    activeTool, 
    features, 
    clearAllFeatures, 
    removeLastFeature,
    error, 
    setActiveTool, 
    isToolActive
  } = useDrawingStore()
  
  const [isChangingTool, setIsChangingTool] = useState(false)
  const [undoJustUsed, setUndoJustUsed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const handleShapeClick = (shapeType: ShapeType) => {
    if (isChangingTool) {
      console.log('⏳ Tool change in progress, ignoring click')
      return
    }
    
    console.log(`🖱️ Tool button clicked: ${shapeType}`)
    setIsChangingTool(true)
    
    if (isToolActive(shapeType)) {
      // If tool is active, deactivate it
      console.log(`🔄 Deactivating ${shapeType} tool`)
      setActiveTool(null)
    } else {
      // Activate the clicked tool (this will automatically deactivate any other active tool)
      console.log(`🔄 Activating ${shapeType} tool`)
      setActiveTool(shapeType)
    }
    
    // Reset the changing flag after a delay
    setTimeout(() => {
      setIsChangingTool(false)
    }, 200)
  }

  const handleExport = () => {
    if (features.length === 0) {
      setAlertMessage('No features to export')
      setShowAlert(true)
      return
    }
    downloadGeoJSON(features)
  }

  const handleClear = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmClear = () => {
    clearAllFeatures()
    setShowConfirmDialog(false)
  }

  const handleCancelClear = () => {
    setShowConfirmDialog(false)
  }

  const handleUndo = () => {
    removeLastFeature()
    setUndoJustUsed(true)
    setTimeout(() => setUndoJustUsed(false), 500) // Reset after animation
  }

  // Add keyboard shortcut for undo (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (features.length > 0) {
          handleUndo()
        }
      }
      // Add keyboard shortcut for toolbar toggle (Ctrl+T)
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault()
        setIsCollapsed(!isCollapsed)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [features.length, isCollapsed])

  // Calculate shape counts
  const getShapeCount = (shapeType: ShapeType): number => {
    return features.filter(feature => feature.properties.type === shapeType).length
  }

  const getShapeCounts = () => {
    return {
      polygon: getShapeCount('polygon'),
      rectangle: getShapeCount('rectangle'),
      circle: getShapeCount('circle'),
      lineString: getShapeCount('lineString')
    }
  }

  const shapeCounts = getShapeCounts()
  const totalShapes = Object.values(shapeCounts).reduce((sum, count) => sum + count, 0)

  const tools = [
    {
      type: 'polygon' as ShapeType,
      name: 'Polygon',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
        </svg>
      ),
      color: '#3b82f6'
    },
    {
      type: 'rectangle' as ShapeType,
      name: 'Rectangle',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
      ),
      color: '#10b981'
    },
    {
      type: 'circle' as ShapeType,
      name: 'Circle',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      ),
      color: '#ef4444'
    },
    {
      type: 'lineString' as ShapeType,
      name: 'Line String',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12H21M3 6H21M3 18H21"/>
        </svg>
      ),
      color: '#8b5cf6'
    }
  ]

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button 
        className={`toolbar-toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Show Toolbar (Ctrl+T)' : 'Hide Toolbar (Ctrl+T)'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`toggle-icon ${isCollapsed ? 'rotated' : ''}`}
        >
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
      </button>

      {/* Main Toolbar */}
      <div className={`modern-toolbar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="toolbar-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="toolbar-icon">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
        </svg>
        <h2 className="toolbar-title">Drawing Tools</h2>
      </div>

      <div className="tools-grid">
        {tools.map((tool) => {
          const shapeCount = getShapeCount(tool.type)
          return (
            <button
              key={tool.type}
              className={`tool-button ${isToolActive(tool.type) ? 'active' : ''} ${isChangingTool ? 'changing' : ''}`}
              onClick={() => handleShapeClick(tool.type)}
              disabled={isChangingTool}
              style={{
                '--tool-color': tool.color,
                background: isToolActive(tool.type) 
                  ? `linear-gradient(135deg, ${tool.color}20, ${tool.color}40)` 
                  : undefined
              } as React.CSSProperties}
            >
              <div className="tool-icon">{tool.icon}</div>
              <span className="tool-name">{tool.name}</span>
              <div className="shape-counter" style={{ color: tool.color }}>
                {shapeCount}
              </div>
              {isToolActive(tool.type) && <div className="active-indicator"></div>}
            </button>
          )
        })}
      </div>

      <div className="toolbar-divider"></div>

      <div className="actions-section">
        <h3 className="section-title">Actions</h3>
        <div className="action-buttons">
          <button
            className="action-button export-button"
            onClick={handleExport}
            disabled={features.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export GeoJSON
          </button>
          
          <button
            className={`action-button undo-button ${undoJustUsed ? 'undo-used' : ''}`}
            onClick={handleUndo}
            disabled={features.length === 0}
            title="Remove last drawn shape (Ctrl+Z)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V3H7"/>
              <path d="M21 17A9 9 0 0 0 3 7L7 11"/>
            </svg>
            Undo Last
          </button>
          
          <button
            className={`action-button clear-button ${features.length > 0 ? 'has-features' : ''}`}
            onClick={handleClear}
            disabled={features.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6V20A2,2 0 0,1 17,20H7A2,2 0 0,1 5,20V6M8,6V4A2,2 0 0,1 10,4H14A2,2 0 0,1 16,4V6"/>
            </svg>
            Clear All {features.length > 0 && `(${features.length})`}
            {features.length > 0 && <div className="clear-pulse"></div>}
          </button>
        </div>
      </div>

      <div className="toolbar-stats">
        <div className="stat-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stat-icon">
            <path d="M3 3V21H21V9L15 3H3Z"/>
            <path d="M9 9H15M9 13H15M9 17H13"/>
          </svg>
          <div className="stat-content">
            <div className="stat-label">Total Features</div>
            <div className="stat-value">{features.length}</div>
          </div>
        </div>
      </div>

      {/* Feature List Section */}
      {features.length > 0 && (
        <div className="feature-list-section">
          <h3 className="section-title">Drawn Shapes</h3>
          <div className="feature-list">
            {features.slice(-5).reverse().map((feature) => {
              const displayName = getFeatureDisplayName(feature, features)
              const tool = tools.find(t => t.type === feature.properties.type)
              
              return (
                <div key={feature.properties.id} className="feature-list-item">
                  <div className="feature-icon" style={{ color: tool?.color }}>
                    {tool?.icon}
                  </div>
                  <div className="feature-info">
                    <div className="feature-name">{displayName}</div>
                    <div className="feature-type">{tool?.name}</div>
                  </div>
                  <div className="feature-order">#{feature.properties.order || 0}</div>
                </div>
              )
            })}
            {features.length > 5 && (
              <div className="feature-list-more">
                +{features.length - 5} more shapes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shape Usage Statistics */}
      {totalShapes > 0 ? (
        <div className="shape-stats-section">
          <h3 className="section-title">Shape Usage</h3>
          <div className="shape-stats-grid">
            {tools.map((tool) => {
              const count = getShapeCount(tool.type)
              const percentage = totalShapes > 0 ? Math.round((count / totalShapes) * 100) : 0
              
              return (
                <div 
                  key={tool.type} 
                  className={`shape-stat-item ${count > 0 ? 'has-shapes' : ''}`}
                  style={{ '--shape-color': tool.color } as React.CSSProperties}
                >
                  <div className="shape-stat-header">
                    <div className="shape-stat-icon" style={{ color: tool.color }}>
                      {tool.icon}
                    </div>
                    <div className="shape-stat-info">
                      <div className="shape-stat-name">{tool.name}</div>
                      <div className="shape-stat-count">
                        <span className="count-number">{count}</span>
                        {count > 0 && (
                          <span className="count-percentage">({percentage}%)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {count > 0 && (
                    <div className="shape-stat-bar">
                      <div 
                        className="shape-stat-fill" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: tool.color 
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="usage-summary">
            <div className="summary-item">
              <span className="summary-label">Most Used:</span>
              <span className="summary-value">
                {(() => {
                  const maxCount = Math.max(...Object.values(shapeCounts))
                  if (maxCount === 0) return 'None'
                  const mostUsedShape = Object.entries(shapeCounts).find(([_, count]) => count === maxCount)?.[0]
                  const toolName = tools.find(t => t.type === mostUsedShape)?.name || mostUsedShape
                  return `${toolName} (${maxCount})`
                })()}
              </span>
            </div>
            {features.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">Last Drawn:</span>
                <span className="summary-value">
                  {(() => {
                    const lastFeature = features[features.length - 1]
                    if (!lastFeature) return 'None'
                    return getFeatureDisplayName(lastFeature, features)
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-shapes-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="no-shapes-icon">
            <path d="M3 3V21H21V9L15 3H3Z"/>
            <path d="M9 9H15M9 13H15M9 17H13"/>
          </svg>
          <div className="no-shapes-text">
            <div className="no-shapes-title">No shapes drawn yet</div>
            <div className="no-shapes-subtitle">Start drawing to see usage statistics</div>
          </div>
        </div>
      )}

      {activeTool && (
        <div className="active-tool-info">
          <div className="info-header">
            <div className="info-pulse"></div>
            <span className="info-title">Drawing: {activeTool}</span>
          </div>
          <div className="info-instructions">
            {activeTool === 'polygon' && 'Click to place points, double-click to finish'}
            {activeTool === 'rectangle' && 'Click and drag to draw rectangle'}
            {activeTool === 'circle' && 'Click and drag to draw circle'}
            {activeTool === 'lineString' && 'Click to place points, double-click to finish'}
          </div>
          {['polygon', 'rectangle', 'circle'].includes(activeTool) && (
            <div className="constraint-info">
              <div className="constraint-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7A5 5 0 0 1 17 7V11"/>
                </svg>
                Non-overlap Rule:
              </div>
              <div className="constraint-text">
                Polygonal shapes cannot overlap. Overlaps will be auto-trimmed.
              </div>
            </div>
          )}
          {activeTool === 'lineString' && (
            <div className="constraint-info">
              <div className="constraint-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8A2 2 0 0 0 19 6H5A2 2 0 0 0 3 8V16A2 2 0 0 0 5 18H19A2 2 0 0 0 21 16Z"/>
                  <path d="M7 10H17M7 14H17"/>
                </svg>
                Line Freedom:
              </div>
              <div className="constraint-text">
                Lines can freely cross or overlap any shapes.
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className={`error-card ${error.includes('trimmed') ? 'info-card' : ''}`}>
          <div className="error-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {error.includes('trimmed') ? (
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              ) : (
                <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"/>
              )}
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="error-message">{error}</div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3>Confirm Action</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to clear all features?</p>
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel-button" onClick={handleCancelClear}>
                Cancel
              </button>
              <button className="modal-button confirm-button" onClick={handleConfirmClear}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Dialog */}
      {showAlert && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h3>Information</h3>
            </div>
            <div className="modal-body">
              <p>{alertMessage}</p>
            </div>
            <div className="modal-actions">
              <button className="modal-button confirm-button" onClick={() => setShowAlert(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default Toolbar
