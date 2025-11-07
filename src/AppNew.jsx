import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import { useApp } from './context/AppContext'
import { performSearch, performFuzzySearch, sortResults, getRelatedUseCases, generateSuggestions } from './utils/searchUtils'
import { exportResults, copyToClipboard } from './utils/exportUtils'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import './App.css'

// Components
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import ThemeToggle from './components/ThemeToggle'
import FilterPanel from './components/FilterPanel'

function AppNew() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [useFuzzySearch, setUseFuzzySearch] = useState(false)

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
    let results
    if (useFuzzySearch && searchQuery.trim()) {
      results = performFuzzySearch(useCases, searchQuery, filters)
    } else {
      results = performSearch(useCases, searchQuery, filters, sortBy)
    }

    setSearchResults(results)

    // Update URL
    if (searchQuery) {
      searchParams.set('q', searchQuery)
      setSearchParams(searchParams, { replace: true })
    } else {
      searchParams.delete('q')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchQuery, useCases, filters, sortBy, useFuzzySearch])

  // Generate suggestions
  useEffect(() => {
    if (searchQuery.length >= 2 && useCases.length) {
      const suggs = generateSuggestions(useCases, searchQuery)
      setSuggestions(suggs)
    } else {
      setSuggestions([])
    }
  }, [searchQuery, useCases])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: (e) => {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    },
    {
      key: '/',
      callback: (e) => {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    },
    {
      key: 'Escape',
      callback: () => {
        if (showFilters) {
          setShowFilters(false)
        } else if (showSuggestions) {
          setShowSuggestions(false)
        }
      }
    }
  ])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleExport = (format) => {
    const result = exportResults(searchResults, format, searchQuery)
    trackExport(format, searchResults.length)
    return result
  }

  const handleCopyAll = async () => {
    const text = searchResults.map((r, i) =>
      `${i + 1}. ${r.title}\n${r.description}\n`
    ).join('\n')
    await copyToClipboard(text)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }

  const isHomePage = location.pathname === '/'
  const hasResults = searchResults.length > 0
  const hasQuery = searchQuery.trim().length > 0 || Object.keys(filters).length > 0

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-logo" onClick={() => {
              navigate('/')
              setSearchQuery('')
              setFilters({})
            }}>
              What Can I Use Copilot for?
            </h1>
          </div>

          <div className="header-center">
            {!isHomePage && (
              <div className="header-search">
                <SearchBar
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search GitHub Copilot use cases..."
                  isLoading={isLoading}
                  suggestions={suggestions}
                  showSuggestions={showSuggestions}
                  onSuggestionClick={handleSuggestionClick}
                  onSuggestionsClose={() => setShowSuggestions(false)}
                />
              </div>
            )}
          </div>

          <div className="header-right">
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
            </button>

            <ThemeToggle />

            {hasResults && (
              <div className="header-actions">
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

                <div className="export-menu">
                  <button className="btn-secondary" title="Export results">
                    Export
                  </button>
                  <div className="export-dropdown">
                    <button onClick={() => handleExport('markdown')}>Markdown</button>
                    <button onClick={() => handleExport('json')}>JSON</button>
                    <button onClick={() => handleExport('csv')}>CSV</button>
                    <button onClick={handleCopyAll}>Copy All</button>
                  </div>
                </div>

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
              </div>
            )}
          </div>
        </div>

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
              className="clear-filters"
              onClick={() => setFilters({})}
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={
            <div className={`search-container ${hasResults ? 'has-results' : ''}`}>
              {!hasResults && !hasQuery && (
                <div className="search-header">
                  <h2 className="app-title">What Can I Use Copilot for?</h2>
                  <p className="app-subtitle">
                    Search through {useCases.length} GitHub Copilot use cases
                  </p>
                  <SearchBar
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search GitHub Copilot use cases..."
                    isLoading={isLoading}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    onSuggestionClick={handleSuggestionClick}
                    onSuggestionsClose={() => setShowSuggestions(false)}
                    large
                  />
                  <div className="quick-actions">
                    <p>Try searching for: </p>
                    <button onClick={() => setSearchQuery('code generation')}>code generation</button>
                    <button onClick={() => setSearchQuery('testing')}>testing</button>
                    <button onClick={() => setSearchQuery('documentation')}>documentation</button>
                    <button onClick={() => setSearchQuery('refactoring')}>refactoring</button>
                  </div>
                </div>
              )}

              {hasResults && (
                <SearchResults
                  results={searchResults}
                  searchQuery={searchQuery}
                  viewMode={viewPreference}
                  useCases={useCases}
                />
              )}

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
                      <li>Removing filters</li>
                      <li>Checking your spelling</li>
                      <li>Using more general terms</li>
                    </ul>
                    <button
                      className="btn-primary"
                      onClick={() => setUseFuzzySearch(!useFuzzySearch)}
                    >
                      {useFuzzySearch ? 'Use Exact Search' : 'Try Fuzzy Search'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          } />
        </Routes>
      </main>

      <FilterPanel
        useCases={useCases}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      <div className="keyboard-hint">
        Press <kbd>Ctrl</kbd> + <kbd>K</kbd> or <kbd>/</kbd> to search
      </div>
    </div>
  )
}

export default AppNew
