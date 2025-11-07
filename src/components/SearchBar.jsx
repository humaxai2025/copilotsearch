import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { generateSuggestions } from '../utils/searchUtils'
import useDebounce from '../hooks/useDebounce'
import './SearchBar.css'

const SearchBar = forwardRef(({
  value,
  onChange,
  placeholder,
  isLoading,
  large = false,
  showSuggestions = false,
  useCases = [],
  onSuggestionSelect,
  searchHistory = []
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const [inputValue, setInputValue] = useState(value || '')

  const debouncedOnChange = useDebounce((v) => {
    onChange(v)
  }, 250)

  // Expose input methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    },
    blur: () => {
      if (inputRef.current) {
        inputRef.current.blur()
      }
    },
    clear: () => {
      handleClear()
    }
  }))

  useEffect(() => {
    // Focus on mount for better UX (only if not large/homepage version)
    if (!large && inputRef.current) {
      inputRef.current.focus()
    }
  }, [large])

  // Generate autocomplete suggestions
  useEffect(() => {
    const query = inputValue
    if (showSuggestions && query && query.length >= 2 && useCases.length > 0) {
      const newSuggestions = generateSuggestions(useCases, query)
      // Include recent searches (top 5) first
      const recent = (searchHistory || []).slice(0, 5).map(h => h.query).filter(Boolean)
      const combined = Array.from(new Set([...recent, ...newSuggestions]))
      setSuggestions(combined)
      setShowSuggestionsDropdown(combined.length > 0 && isFocused)
    } else {
      setSuggestions([])
      setShowSuggestionsDropdown(false)
    }
    setSelectedSuggestionIndex(-1)
  }, [inputValue, useCases, showSuggestions, isFocused, searchHistory])

  // Keep local input value in sync when parent value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '')
    }
  }, [value])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestionsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleClear = () => {
    setInputValue('')
    debouncedOnChange('')
    setShowSuggestionsDropdown(false)
    setSelectedSuggestionIndex(-1)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (showSuggestions && inputValue && inputValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestionsDropdown(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Delay hiding suggestions to allow click events to register
    setTimeout(() => {
      setShowSuggestionsDropdown(false)
    }, 200)
  }

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion)
    setShowSuggestionsDropdown(false)
    setSelectedSuggestionIndex(-1)
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (!showSuggestionsDropdown || suggestions.length === 0) {
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break

      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex])
        }
        break

      case 'Escape':
        e.preventDefault()
        setShowSuggestionsDropdown(false)
        setSelectedSuggestionIndex(-1)
        break

      default:
        break
    }
  }

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedSuggestionIndex])

  return (
    <div className={`search-bar-wrapper ${large ? 'large' : ''}`}>
      <div
        className={`search-bar ${isFocused ? 'focused' : ''} ${large ? 'large' : ''}`}
        role="search"
      >
        <div className="search-icon" aria-hidden="true">
          <svg width={large ? 24 : 20} height={large ? 24 : 20} viewBox="0 0 20 20" fill="none">
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            debouncedOnChange(e.target.value)
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          aria-label="Search Copilot use cases"
          aria-autocomplete="list"
          aria-controls={showSuggestionsDropdown ? 'search-suggestions' : undefined}
          aria-expanded={showSuggestionsDropdown}
          aria-activedescendant={
            selectedSuggestionIndex >= 0
              ? `suggestion-${selectedSuggestionIndex}`
              : undefined
          }
          autoComplete="off"
          spellCheck="false"
        />

        {inputValue && (
          <button
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
            tabIndex={0}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {showSuggestionsDropdown && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          className="suggestions-dropdown"
          ref={suggestionsRef}
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              id={`suggestion-${index}`}
              className={`suggestion-item ${selectedSuggestionIndex === index ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSuggestionClick(suggestion)
              }}
              role="option"
              aria-selected={selectedSuggestionIndex === index}
              tabIndex={-1}
            >
              <svg
                className="suggestion-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12zM14 14l-3.35-3.35"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="suggestion-text">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

SearchBar.displayName = 'SearchBar'

export default SearchBar
