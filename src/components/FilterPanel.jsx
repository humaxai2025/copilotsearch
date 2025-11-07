import { useState, useEffect } from 'react'
import { extractFilterOptions } from '../utils/searchUtils'
import './FilterPanel.css'

function FilterPanel({ useCases, filters, onFiltersChange, isOpen, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [filterOptions, setFilterOptions] = useState({
    surfaces: [],
    modes: [],
    riskLevels: [],
    languages: [],
    categories: []
  })

  useEffect(() => {
    if (useCases && useCases.length > 0) {
      const options = extractFilterOptions(useCases)
      setFilterOptions(options)
    }
  }, [useCases])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleToggle = (filterType, value) => {
    setLocalFilters(prev => {
      const current = prev[filterType] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]

      return { ...prev, [filterType]: updated }
    })
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleClear = () => {
    setLocalFilters({})
    onFiltersChange({})
    onClose()
  }

  const getActiveCount = () => {
    return Object.values(localFilters).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="filter-overlay" onClick={onClose} />
      <div className="filter-panel">
        <div className="filter-header">
          <h2>Filters</h2>
          <button className="close-button" onClick={onClose} aria-label="Close filters">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <div className="filter-content">
          {/* Copilot Surfaces */}
          <div className="filter-section">
            <h3>Copilot Surface</h3>
            <div className="filter-options">
              {filterOptions.surfaces.map(surface => (
                <label key={surface} className="filter-option">
                  <input
                    type="checkbox"
                    checked={localFilters.surfaces?.includes(surface) || false}
                    onChange={() => handleToggle('surfaces', surface)}
                  />
                  <span>{surface}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Modes */}
          <div className="filter-section">
            <h3>Mode</h3>
            <div className="filter-options">
              {filterOptions.modes.map(mode => (
                <label key={mode} className="filter-option">
                  <input
                    type="checkbox"
                    checked={localFilters.modes?.includes(mode) || false}
                    onChange={() => handleToggle('modes', mode)}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Levels */}
          <div className="filter-section">
            <h3>Risk Level</h3>
            <div className="filter-options">
              {filterOptions.riskLevels.map(risk => (
                <label key={risk} className="filter-option">
                  <input
                    type="checkbox"
                    checked={localFilters.riskLevels?.includes(risk) || false}
                    onChange={() => handleToggle('riskLevels', risk)}
                  />
                  <span className={`risk-${risk}`}>{risk}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <h3>Category</h3>
            <div className="filter-options scrollable">
              {filterOptions.categories.map(category => (
                <label key={category} className="filter-option">
                  <input
                    type="checkbox"
                    checked={localFilters.categories?.includes(category) || false}
                    onChange={() => handleToggle('categories', category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-footer">
          <button className="btn-secondary" onClick={handleClear}>
            Clear All
          </button>
          <button className="btn-primary" onClick={handleApply}>
            Apply ({getActiveCount()})
          </button>
        </div>
      </div>
    </>
  )
}

export default FilterPanel
