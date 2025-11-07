import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import { useApp } from './context/AppContext'
import { performSearch, sortResults } from './utils/searchUtils'
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
  const { addToSearchHistory, trackExport, viewPreference, setViewPreference } = useApp()

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
    if (!useCases.length) return

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
  }, [searchQuery, useCases, filters, sortBy])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: (e) => {
        searchInputRef.current?.focus()
      }
    },
    {
      key: '/',
      callback: (e) => {
        if (e.target.tagName !== 'INPUT') {
          searchInputRef.current?.focus()
        }
      }
    },
    {
      key: 'Escape',
      callback: () => {
        if (showFilters) {
          setShowFilters(false)
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
    const result = exportResults(searchResults, format, searchQuery)
    trackExport(format, searchResults.length)
    return result
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }

  const hasResults = searchResults.length > 0
  const hasQuery = searchQuery.trim().length > 0 || Object.keys(filters).length > 0

  return (
    <div className={`app theme-${theme}`}>
      <div className={`search-container ${hasResults ? 'has-results' : ''}`}>
        {/* Header with filters and theme toggle */}
        {hasResults && (
          <div className="results-header">
            <div className="results-header-left">
              <button
                className={`filter-toggle ${getActiveFilterCount() > 0 ? 'active' : ''}`}
                onClick={() => setShowFilters(true)}
                title="Filters"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 4h16M4 10h12M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {getActiveFilterCount() > 0 && (
                  <span className="filter-badge">{getActiveFilterCount()}</span>
                )}
                <span>Filters</span>
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
                  aria-label="Expanded view"
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
                  aria-label="Compact view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <rect x="2" y="3" width="12" height="2" fill="currentColor"/>
                    <rect x="2" y="7" width="12" height="2" fill="currentColor"/>
                    <rect x="2" y="11" width="12" height="2" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              <div className="export-dropdown-container">
                <button className="export-button" title="Export results">
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

              <ThemeToggle />
            </div>
          </div>
        )}

        {/* Active Filters Chips */}
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
            <button
              className="clear-filters-btn"
              onClick={() => setFilters({})}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Search Header */}
        <div className="search-header">
          {!hasResults && (
            <>
              <h1 className="app-title">What Can I Use Copilot for?</h1>
              <p className="app-subtitle">
                Search through {useCases.length} GitHub Copilot use cases
              </p>
            </>
          )}

          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search GitHub Copilot use cases..."
            isLoading={isLoading}
            large={!hasResults}
            showSuggestions={true}
            useCases={useCases}
          />

          {!hasQuery && !hasResults && (
            <div className="quick-actions">
              <p>Try searching for: </p>
              <button onClick={() => setSearchQuery('code generation')}>code generation</button>
              <button onClick={() => setSearchQuery('testing')}>testing</button>
              <button onClick={() => setSearchQuery('documentation')}>documentation</button>
              <button onClick={() => setSearchQuery('refactoring')}>refactoring</button>
            </div>
          )}

          {!hasResults && !hasQuery && (
            <div className="header-actions-bottom">
              <button
                className="filter-toggle-large"
                onClick={() => setShowFilters(true)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 4h16M4 10h12M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Browse by Filters
              </button>
              <ThemeToggle />
            </div>
          )}
        </div>

        {/* Results */}
        {hasResults && (
          <SearchResults
            results={searchResults}
            searchQuery={searchQuery}
            viewMode={viewPreference}
            allUseCases={useCases}
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
        Press <kbd>Ctrl</kbd> + <kbd>K</kbd> or <kbd>/</kbd> to search
      </div>
    </div>
  )
}

export default App
