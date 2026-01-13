import { useState, useEffect, useRef, useCallback } from 'react'

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  boundingbox: [string, string, string, string]
}

interface SearchBoxProps {
  onLocationSelect: (lat: number, lon: number, name: string) => void
}

const SearchBox = ({ onLocationSelect }: SearchBoxProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Refs for optimization
  const debounceTimeoutRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Simple search function without caching to avoid issues
  const searchLocation = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim().toLowerCase()
    
    // Don't search for queries less than 2 characters
    if (trimmedQuery.length < 2) {
      setResults([])
      setShowResults(false)
      setIsLoading(false)
      return
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmedQuery
        )}&limit=5&addressdetails=1`,
        { 
          signal: abortControllerRef.current.signal
        }
      )
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data: NominatimResult[] = await response.json()
      setResults(data)
      // Always show results, don't depend on showResults state
      console.log('🔍 Search results received:', data)
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error)
        setResults([])
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchLocation(query)
    }, 500) // Back to 500ms for more stable searching

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, searchLocation])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    // Show loading immediately for better UX
    if (value.trim().length >= 2) {
      setIsLoading(true)
    }
  }

  const handleResultClick = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
      console.error('❌ Invalid coordinates:', { lat: result.lat, lon: result.lon })
      return
    }
    
    // Call the callback to update the map
    onLocationSelect(lat, lon, result.display_name)
    
    // Clear search completely after selection
    setQuery('')
    setResults([])
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0])
    }
    if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setIsLoading(false)
    
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '2px solid #1a73e8',
      borderRadius: '24px',
      padding: '6px',
      width: '280px',
      maxWidth: '90vw',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(26, 115, 232, 0.1)',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Compact Input Container - Pill Shape */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '20px',
        padding: '2px',
        border: '1px solid #dadce0',
        minHeight: '40px',
        transition: 'all 0.3s ease'
      }}>
        {/* Search Icon */}
        <div style={{
          padding: '8px 12px',
          color: '#5f6368',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isLoading ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e8eaed',
              borderTop: '2px solid #1a73e8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          )}
        </div>
        
        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Search cities, countries, places..."
          style={{
            flex: '1',
            border: 'none',
            outline: 'none',
            padding: '8px 4px',
            fontSize: '14px',
            fontWeight: '400',
            backgroundColor: 'transparent',
            color: '#202124',
            fontFamily: 'inherit'
          }}
        />
        
        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            style={{
              padding: '6px',
              border: 'none',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              cursor: 'pointer',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              width: '24px',
              height: '24px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      {/* Compact Hint */}
      {query.length > 0 && query.length < 2 && (
        <div style={{
          fontSize: '11px',
          color: '#5f6368',
          marginTop: '4px',
          padding: '4px 8px',
          backgroundColor: '#e3f2fd',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #bbdefb'
        }}>
          Type 2+ characters
        </div>
      )}
      
      {/* Compact Search Results */}
      {results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(26, 115, 232, 0.15)',
          border: '2px solid #1a73e8',
          zIndex: '1000',
          maxHeight: '300px',
          overflowY: 'auto',
          marginTop: '8px',
          padding: '8px'
        }}>
          {results.map((result) => (
            <div
              key={result.place_id}
              onClick={() => handleResultClick(result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '2px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e8eaed',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.borderColor = '#1a73e8';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#e8eaed';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ fontSize: '16px', color: '#1a73e8' }}>📍</div>
              <div style={{ flex: '1', minWidth: '0' }}>
                <div style={{
                  fontWeight: '500',
                  color: '#202124',
                  fontSize: '14px',
                  marginBottom: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {result.display_name.split(',')[0]}
                </div>
                <div style={{
                  color: '#5f6368',
                  fontSize: '12px',
                  lineHeight: '1.2',
                  fontWeight: '400',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {result.display_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Compact No Results */}
      {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(26, 115, 232, 0.15)',
          border: '2px solid #1a73e8',
          zIndex: '1000',
          marginTop: '8px',
          padding: '20px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', color: '#dadce0' }}>🔍</div>
          <div style={{
            color: '#202124',
            fontSize: '14px',
            fontWeight: '400',
            marginBottom: '2px'
          }}>
            No results found
          </div>
          <div style={{
            fontSize: '12px',
            color: '#5f6368',
            fontWeight: '400'
          }}>
            Try different keywords
          </div>
        </div>
      )}
      
      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default SearchBox