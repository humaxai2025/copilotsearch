import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [useCases, setUseCases] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load the use cases data
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

  // Intelligent search function
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const searchTerms = lowerQuery.split(' ').filter(term => term.length > 0)

    const results = useCases
      .map(useCase => {
        let score = 0

        // Title match (highest priority)
        if (useCase.title && useCase.title.toLowerCase().includes(lowerQuery)) {
          score += 100
        }

        // Category match
        if (useCase.category && useCase.category.toLowerCase().includes(lowerQuery)) {
          score += 50
        }

        // Description match
        if (useCase.description && useCase.description.toLowerCase().includes(lowerQuery)) {
          score += 30
        }

        // Tags match
        if (useCase.tags && Array.isArray(useCase.tags)) {
          const tagMatches = useCase.tags.filter(tag =>
            tag.toLowerCase().includes(lowerQuery)
          ).length
          score += tagMatches * 20
        }

        // Example prompts match
        if (useCase.example_prompts && Array.isArray(useCase.example_prompts)) {
          const promptMatches = useCase.example_prompts.filter(prompt =>
            prompt.toLowerCase().includes(lowerQuery)
          ).length
          score += promptMatches * 15
        }

        // Multi-term matching (partial matches across fields)
        searchTerms.forEach(term => {
          const fields = [
            useCase.title,
            useCase.description,
            useCase.category,
            useCase.subcategory,
            ...(useCase.tags || []),
            ...(useCase.example_prompts || [])
          ].filter(Boolean)

          fields.forEach(field => {
            if (String(field).toLowerCase().includes(term)) {
              score += 5
            }
          })
        })

        return { ...useCase, score }
      })
      .filter(useCase => useCase.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50) // Limit to top 50 results

    setSearchResults(results)
  }

  // Handle search query changes
  useEffect(() => {
    performSearch(searchQuery)
  }, [searchQuery, useCases])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  return (
    <div className="app">
      <div className={`search-container ${searchResults.length > 0 ? 'has-results' : ''}`}>
        <div className="search-header">
          <h1 className="app-title">What Can I Use Copilot for?</h1>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search GitHub Copilot use cases..."
            isLoading={isLoading}
          />
        </div>

        {searchResults.length > 0 && (
          <SearchResults results={searchResults} searchQuery={searchQuery} />
        )}

        {searchQuery && searchResults.length === 0 && !isLoading && (
          <div className="no-results">
            <p>No results found for "<strong>{searchQuery}</strong>"</p>
            <p className="suggestion">Try different keywords or browse all categories</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
