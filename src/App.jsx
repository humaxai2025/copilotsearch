import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import { useApp } from './context/AppContext'
import { performSearch } from './utils/searchUtils'
import { exportResults } from './utils/exportUtils'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import './App.css'

// Components
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import ThemeToggle from './components/ThemeToggle'
import FilterPanel from './components/FilterPanel'

function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme } = useTheme()
  const { favorites, addToSearchHistory, trackExport, viewPreference, setViewPreference } = useApp()

  const [currentView, setCurrentView] = useState('search') // 'search', 'favorites', 'detail'
  const [selectedUseCase, setSelectedUseCase] = useState(null)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')
  const [useCases, setUseCases] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)

  const searchInputRef = useRef(null)

  // Load use cases data
  useEffect(() => {
    fetch('/copilotusecases.json')
      .then(response => response.json())
      .then(data => {
        setUseCases(data.usecases || [])
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error loading use cases:', error)
        setIsLoading(false)
      })
  }, [])

  // Sync search query with URL
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
    }
  }, [searchParams])

  // Perform search
  useEffect(() => {
    if (!useCases.length || currentView !== 'search') return

    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      setSearchResults([])
      return
    }

    // Add to search history
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery)
    }

    // Perform search
    const results = performSearch(useCases, searchQuery, filters, sortBy)
    setSearchResults(results)

    // Update URL
    if (searchQuery) {
      searchParams.set('q', searchQuery)
      setSearchParams(searchParams, { replace: true })
    } else {
      searchParams.delete('q')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchQuery, useCases, filters, sortBy, currentView])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: (e) => {
        setCurrentView('search')
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    },
    {
      key: '/',
      callback: (e) => {
        if (e.target.tagName !== 'INPUT') {
          setCurrentView('search')
          setTimeout(() => searchInputRef.current?.focus(), 100)
        }
      }
    },
    {
      key: 'Escape',
      callback: () => {
        if (showFilters) {
          setShowFilters(false)
        } else if (currentView === 'detail') {
          setCurrentView('search')
          setSelectedUseCase(null)
        }
      }
    }
  ])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleExport = (format) => {
    const dataToExport = currentView === 'favorites'
      ? useCases.filter(uc => favorites.includes(uc.id))
      : searchResults
    const result = exportResults(dataToExport, format, searchQuery)
    trackExport(format, dataToExport.length)
    return result
  }

  const handleUseCaseClick = (useCase) => {
    setSelectedUseCase(useCase)
    setCurrentView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToSearch = () => {
    setCurrentView('search')
    setSelectedUseCase(null)
  }

  const handleViewFavorites = () => {
    setCurrentView('favorites')
    setSelectedUseCase(null)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }

  const getFavoriteUseCases = () => {
    return useCases.filter(uc => favorites.includes(uc.id))
  }

  const hasResults = currentView === 'search' && searchResults.length > 0
  const hasQuery = searchQuery.trim().length > 0 || Object.keys(filters).length > 0
  const favoriteUseCases = getFavoriteUseCases()

  return (
    <div className={`app theme-${theme}`}>
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-content">
          <button
            className="logo-button"
            onClick={handleBackToSearch}
            aria-label="Go to homepage"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.429 13.713c-.175 1.226-.927 2.337-2.042 3.014-1.114.677-2.518.849-3.812.473-1.294-.377-2.36-1.291-2.889-2.476-.528-1.185-.467-2.54.166-3.677.633-1.136 1.725-1.948 2.96-2.197 1.235-.25 2.509.037 3.451.779.941.741 1.493 1.854 1.495 3.017 0 .022 0 .045.002.067.012.334.013.668.003 1.001-.002.022-.002.044-.004.066-.023.645-.103 1.289-.33 1.904-.229.616-.575 1.19-1.05 1.678-.476.487-1.068.875-1.74 1.144-.672.27-1.405.415-2.154.421-1.497.012-2.964-.56-4.092-1.59-1.127-1.031-1.835-2.448-1.963-3.935-.127-1.487.345-2.964 1.31-4.104.966-1.14 2.354-1.87 3.855-2.026 1.501-.157 3.001.272 4.165 1.189 1.164.918 1.918 2.249 2.093 3.695.026.217.042.436.05.655.004.11.007.22.007.33 0 .025 0 .05-.001.075-.004.268-.019.536-.045.803-.026.268-.063.535-.112.8-.048.266-.107.531-.177.793-.069.263-.148.523-.238.781-.18.516-.404 1.019-.67 1.503-.267.485-.574.949-.92 1.388-.345.438-.729.848-1.148 1.226-.42.377-.875.722-1.362 1.028-.974.613-2.062 1.054-3.206 1.295-1.145.24-2.327.277-3.49.105-1.163-.171-2.294-.557-3.328-1.135-1.034-.578-1.959-1.338-2.725-2.239-.766-.9-1.364-1.93-1.765-3.039-.401-1.109-.599-2.284-.583-3.464.016-1.18.242-2.353.665-3.457.424-1.105 1.042-2.128 1.825-3.018.782-.889 1.718-1.633 2.759-2.192 1.041-.558 2.175-.926 3.344-1.084 1.169-.158 2.357-.104 3.503.157 1.146.262 2.236.716 3.216 1.338.98.623 1.838 1.406 2.531 2.313.693.907 1.213 1.925 1.533 3.006.32 1.081.437 2.211.344 3.329-.093 1.118-.385 2.214-.862 3.234-.477 1.02-1.132 1.952-1.934 2.753-.803.801-1.741 1.461-2.768 1.95-1.027.488-2.13.8-3.256.919-1.127.12-2.264.046-3.358-.217-1.094-.264-2.133-.709-3.068-1.312-.935-.603-1.755-1.356-2.422-2.225-.666-.868-1.17-1.84-1.488-2.87-.318-1.031-.446-2.108-.378-3.177.068-1.069.34-2.119.803-3.095.463-.976 1.11-1.866 1.91-2.626.799-.76 1.74-1.379 2.773-1.828 1.033-.448 2.143-.721 3.275-.806 1.132-.085 2.271.027 3.357.33 1.086.304 2.106.8 3.01 1.461.904.662 1.682 1.479 2.297 2.413.615.933 1.059 1.968 1.31 3.055.25 1.086.302 2.211.152 3.315-.15 1.104-.507 2.175-1.055 3.156-.548.982-1.279 1.863-2.158 2.6-.879.737-1.893 1.319-2.994 1.72-1.101.4-2.274.614-3.463.631-1.189.017-2.379-.163-3.507-.53-1.128-.368-2.181-.918-3.106-1.622-.925-.704-1.712-1.553-2.325-2.507-.612-.954-1.042-2.001-1.268-3.091-.226-1.09-.246-2.21-.058-3.304.188-1.094.573-2.15 1.137-3.115.564-.965 1.3-1.826 2.174-2.544.874-.717 1.874-1.281 2.95-1.665 1.076-.384 2.215-.584 3.36-.59 1.145-.007 2.287.178 3.37.548 1.084.37 2.097.916 2.992 1.613.895.696 1.663 1.533 2.268 2.47.605.937 1.041 1.962 1.288 3.028.246 1.066.3 2.162.157 3.236z"/>
            </svg>
            <span className="logo-text">GitHub Copilot UseCases</span>
          </button>

          <div className="nav-actions">
            <button
              className={`nav-link ${currentView === 'favorites' ? 'active' : ''}`}
              onClick={handleViewFavorites}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Favorites</span>
              {favorites.length > 0 && (
                <span className="badge">{favorites.length}</span>
              )}
            </button>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="app-content">
        {/* Search View */}
        {currentView === 'search' && (
          <div className={`search-container ${hasResults ? 'has-results' : ''}`}>
            {/* Header with filters and controls */}
            {hasResults && (
              <div className="results-header">
                <div className="results-header-left">
                  <button
                    className={`filter-button ${getActiveFilterCount() > 0 ? 'active' : ''}`}
                    onClick={() => setShowFilters(true)}
                    title="Open filters"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2 4h16M4 10h12M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="filter-label">Filters</span>
                    {getActiveFilterCount() > 0 && (
                      <span className="filter-count">{getActiveFilterCount()}</span>
                    )}
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                    aria-label="Sort results"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="time_saved">Time Saved</option>
                    <option value="risk_asc">Risk: Low to High</option>
                    <option value="risk_desc">Risk: High to Low</option>
                    <option value="category">Category</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>

                <div className="results-header-right">
                  <div className="view-toggle">
                    <button
                      className={viewPreference === 'expanded' ? 'active' : ''}
                      onClick={() => setViewPreference('expanded')}
                      title="Expanded view"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="12" height="3" fill="currentColor"/>
                        <rect x="2" y="7" width="12" height="3" fill="currentColor"/>
                        <rect x="2" y="12" width="12" height="3" fill="currentColor"/>
                      </svg>
                    </button>
                    <button
                      className={viewPreference === 'compact' ? 'active' : ''}
                      onClick={() => setViewPreference('compact')}
                      title="Compact view"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <rect x="2" y="3" width="12" height="2" fill="currentColor"/>
                        <rect x="2" y="7" width="12" height="2" fill="currentColor"/>
                        <rect x="2" y="11" width="12" height="2" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>

                  <div className="export-dropdown-container">
                    <button className="export-button">
                      Export
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <div className="export-dropdown">
                      <button onClick={() => handleExport('markdown')}>Markdown</button>
                      <button onClick={() => handleExport('json')}>JSON</button>
                      <button onClick={() => handleExport('csv')}>CSV</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {getActiveFilterCount() > 0 && (
              <div className="filter-chips">
                {Object.entries(filters).map(([key, values]) =>
                  values.map(value => (
                    <div key={`${key}-${value}`} className="filter-chip">
                      <span>{value}</span>
                      <button
                        onClick={() => {
                          const newFilters = { ...filters }
                          newFilters[key] = newFilters[key].filter(v => v !== value)
                          if (newFilters[key].length === 0) delete newFilters[key]
                          setFilters(newFilters)
                        }}
                        aria-label={`Remove ${value} filter`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
                <button className="clear-filters-btn" onClick={() => setFilters({})}>
                  Clear all
                </button>
              </div>
            )}

            {/* Search Header */}
            <div className="search-header">
              {!hasResults && (
                <h1 className="app-title">Can I Use GitHub Copilot for?</h1>
              )}

              <SearchBar
                ref={searchInputRef}
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Try 'code generation', 'testing', 'documentation'..."
                isLoading={isLoading}
                large={!hasResults}
                showSuggestions={true}
                useCases={useCases}
              />

              {!hasQuery && !hasResults && (
                <>
                  <div className="quick-actions">
                    <p>Popular searches:</p>
                    <button onClick={() => setSearchQuery('code generation')}>Code Generation</button>
                    <button onClick={() => setSearchQuery('testing')}>Testing</button>
                    <button onClick={() => setSearchQuery('documentation')}>Documentation</button>
                    <button onClick={() => setSearchQuery('refactoring')}>Refactoring</button>
                  </div>

                  <div className="home-actions">
                    <button className="action-card" onClick={() => setShowFilters(true)}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <h3>Browse by Filters</h3>
                      <p>Filter by surface, mode, risk level, and more</p>
                    </button>

                    {favorites.length > 0 && (
                      <button className="action-card" onClick={handleViewFavorites}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                            stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <h3>Your Favorites</h3>
                        <p>View your {favorites.length} saved use case{favorites.length !== 1 ? 's' : ''}</p>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Results */}
            {hasResults && (
              <SearchResults
                results={searchResults}
                searchQuery={searchQuery}
                viewMode={viewPreference}
                allUseCases={useCases}
                onUseCaseClick={handleUseCaseClick}
              />
            )}

            {/* No Results */}
            {hasQuery && !hasResults && !isLoading && (
              <div className="no-results">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                  <path d="M60 40v20M60 75v5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <h2>No results found</h2>
                <p>for "<strong>{searchQuery}</strong>"</p>
                <div className="suggestions">
                  <p>Try:</p>
                  <ul>
                    <li>Using different keywords</li>
                    <li>Removing some filters</li>
                    <li>Checking your spelling</li>
                    <li>Using more general terms</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorites View */}
        {currentView === 'favorites' && (
          <div className="favorites-container">
            <div className="favorites-header">
              <h1 className="page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    fill="currentColor" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Your Favorites
              </h1>
              <p className="page-subtitle">
                {favoriteUseCases.length === 0
                  ? "You haven't saved any favorites yet"
                  : `${favoriteUseCases.length} saved use case${favoriteUseCases.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            {favoriteUseCases.length > 0 ? (
              <SearchResults
                results={favoriteUseCases}
                searchQuery=""
                viewMode={viewPreference}
                allUseCases={useCases}
                onUseCaseClick={handleUseCaseClick}
              />
            ) : (
              <div className="empty-favorites">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <path d="M60 80L80 95l-5.33-22.67L95 57.33l-23.33-2L60 35l-11.67 20.33-23.33 2 20.33 15L40 95z"
                    stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                </svg>
                <h2>No favorites yet</h2>
                <p>Click the star icon on any use case to save it here</p>
                <button className="btn-primary" onClick={handleBackToSearch}>
                  Explore Use Cases
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detail View */}
        {currentView === 'detail' && selectedUseCase && (
          <div className="detail-container">
            <button className="back-button" onClick={handleBackToSearch}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 10H5M5 10l5-5M5 10l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Back to Search
            </button>

            <SearchResults
              results={[selectedUseCase]}
              searchQuery=""
              viewMode="expanded"
              allUseCases={useCases}
              onUseCaseClick={handleUseCaseClick}
              isDetailView={true}
            />
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        useCases={useCases}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Keyboard Hint */}
      <div className="keyboard-hint">
        <kbd>Ctrl</kbd> + <kbd>K</kbd> or <kbd>/</kbd> to search
      </div>

      {/* Footer */}
      <footer className="app-footer">
        Developed with ❤️ by Sriram Srinivasan
      </footer>
    </div>
  )
}

export default App
