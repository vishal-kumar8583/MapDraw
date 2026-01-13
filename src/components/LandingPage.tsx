import React, { useState, useEffect } from 'react'
import './LandingPage.css'

interface LandingPageProps {
  onEnter: () => void
  isTransitioning: boolean
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, isTransitioning }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)

  useEffect(() => {
    setIsLoaded(true)
    
    // Cycle through features
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
        </svg>
      ),
      title: "Draw Polygons",
      description: "Create complex shapes with precision"
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
      ),
      title: "Draw Rectangles",
      description: "Perfect geometric shapes made easy"
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      ),
      title: "Draw Circles",
      description: "Smooth circular shapes and areas"
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12H21M3 6H21M3 18H21"/>
        </svg>
      ),
      title: "Draw Lines",
      description: "Connect points with flowing lines"
    }
  ]

  return (
    <div className={`landing-page ${isLoaded ? 'loaded' : ''} ${isTransitioning ? 'slide-out' : ''}`}>
      {/* Animated Background */}
      <div className="landing-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
        <div className="bg-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="landing-content">
        {/* Header */}
        <header className="landing-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 21 10Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h1 className="logo-text">MapDraw</h1>
          </div>
        </header>

        {/* Hero Section */}
        <main className="hero-section">
          <div className="hero-content">
            <h2 className="hero-title">
              Create Beautiful
              <span className="gradient-text"> Geographic Shapes</span>
            </h2>
            <p className="hero-description">
              Professional mapping tool for drawing, measuring, and analyzing geometric shapes on interactive maps. 
              Perfect for urban planning, land surveying, and geographic analysis.
            </p>

            {/* Feature Showcase */}
            <div className="feature-showcase">
              <div className="feature-card active">
                <div className="feature-icon">
                  {features[currentFeature].icon}
                </div>
                <div className="feature-content">
                  <h3>{features[currentFeature].title}</h3>
                  <p>{features[currentFeature].description}</p>
                </div>
              </div>
            </div>

            {/* Feature Indicators */}
            <div className="feature-indicators">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentFeature ? 'active' : ''}`}
                  onClick={() => setCurrentFeature(index)}
                />
              ))}
            </div>

            {/* CTA Button */}
            <button className="cta-button" onClick={onEnter}>
              <span>Start Drawing</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12H19"/>
                <path d="M12 5L19 12L12 19"/>
              </svg>
            </button>
          </div>

          {/* Interactive Preview */}
          <div className="preview-container">
            <div className="preview-map">
              <div className="preview-shapes">
                <div className="preview-shape polygon"></div>
                <div className="preview-shape rectangle"></div>
                <div className="preview-shape circle"></div>
                <div className="preview-shape line"></div>
              </div>
              <div className="preview-grid"></div>
            </div>
          </div>
        </main>

        {/* Features Grid */}
        <section className="features-grid">
          <div className="feature-item">
            <div className="feature-item-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3V21H21V9L15 3H3Z"/>
                <path d="M9 9H15M9 13H15M9 17H13"/>
              </svg>
            </div>
            <h4>Real-time Measurements</h4>
            <p>Get instant area, perimeter, and coordinate data</p>
          </div>
          <div className="feature-item">
            <div className="feature-item-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h4>Export Data</h4>
            <p>Download your shapes as GeoJSON files</p>
          </div>
          <div className="feature-item">
            <div className="feature-item-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <h4>Multiple Shapes</h4>
            <p>Draw polygons, rectangles, circles, and lines</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LandingPage