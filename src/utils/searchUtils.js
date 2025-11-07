import Fuse from 'fuse.js'

// Intelligent search with scoring
export const performSearch = (useCases, query, filters = {}, sortBy = 'relevance') => {
  if (!query.trim() && Object.keys(filters).length === 0) {
    return []
  }

  let results = [...useCases]

  // Apply filters first
  if (filters.surfaces && filters.surfaces.length > 0) {
    results = results.filter(useCase =>
      useCase.copilot_surface?.some(s => filters.surfaces.includes(s))
    )
  }

  if (filters.modes && filters.modes.length > 0) {
    results = results.filter(useCase =>
      useCase.mode?.some(m => filters.modes.includes(m))
    )
  }

  if (filters.riskLevels && filters.riskLevels.length > 0) {
    results = results.filter(useCase =>
      filters.riskLevels.includes(useCase.risk_level)
    )
  }

  if (filters.languages && filters.languages.length > 0) {
    results = results.filter(useCase =>
      useCase.languages?.some(l => filters.languages.includes(l)) ||
      (filters.languages.includes('all') && (!useCase.languages || useCase.languages.length === 0))
    )
  }

  if (filters.categories && filters.categories.length > 0) {
    results = results.filter(useCase =>
      filters.categories.includes(useCase.category)
    )
  }

  // If no query, return filtered results
  if (!query.trim()) {
    return sortResults(results, sortBy, query)
  }

  // Perform search with scoring
  const lowerQuery = query.toLowerCase()
  const searchTerms = lowerQuery.split(' ').filter(term => term.length > 0)

  results = results.map(useCase => {
    let score = 0

    // Title match (highest priority)
    if (useCase.title && useCase.title.toLowerCase().includes(lowerQuery)) {
      score += 100
    }

    // Exact title match
    if (useCase.title && useCase.title.toLowerCase() === lowerQuery) {
      score += 200
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

    // Multi-term matching
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

  return sortResults(results, sortBy, query)
}

// Fuzzy search using Fuse.js
export const performFuzzySearch = (useCases, query, filters = {}) => {
  const fuse = new Fuse(useCases, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.2 },
      { name: 'category', weight: 0.15 },
      { name: 'tags', weight: 0.15 },
      { name: 'example_prompts', weight: 0.1 }
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2
  })

  let results = fuse.search(query).map(result => ({
    ...result.item,
    score: (1 - result.score) * 100 // Convert to 0-100 scale
  }))

  // Apply filters
  if (filters.surfaces && filters.surfaces.length > 0) {
    results = results.filter(useCase =>
      useCase.copilot_surface?.some(s => filters.surfaces.includes(s))
    )
  }

  if (filters.modes && filters.modes.length > 0) {
    results = results.filter(useCase =>
      useCase.mode?.some(m => filters.modes.includes(m))
    )
  }

  if (filters.riskLevels && filters.riskLevels.length > 0) {
    results = results.filter(useCase =>
      filters.riskLevels.includes(useCase.risk_level)
    )
  }

  return results
}

// Sort results
export const sortResults = (results, sortBy, query = '') => {
  const sorted = [...results]

  switch (sortBy) {
    case 'relevance':
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0))

    case 'time_saved':
      return sorted.sort((a, b) =>
        (b.metrics?.time_saved_min || 0) - (a.metrics?.time_saved_min || 0)
      )

    case 'risk_asc':
      const riskOrder = { low: 1, medium: 2, high: 3 }
      return sorted.sort((a, b) =>
        (riskOrder[a.risk_level] || 999) - (riskOrder[b.risk_level] || 999)
      )

    case 'risk_desc':
      const riskOrderDesc = { high: 1, medium: 2, low: 3 }
      return sorted.sort((a, b) =>
        (riskOrderDesc[a.risk_level] || 999) - (riskOrderDesc[b.risk_level] || 999)
      )

    case 'category':
      return sorted.sort((a, b) =>
        (a.category || '').localeCompare(b.category || '')
      )

    case 'title':
      return sorted.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      )

    default:
      return sorted
  }
}

// Get related use cases
export const getRelatedUseCases = (useCase, allUseCases, limit = 5) => {
  if (!useCase) return []

  const scored = allUseCases
    .filter(uc => uc.id !== useCase.id)
    .map(uc => {
      let score = 0

      // Same category
      if (uc.category === useCase.category) {
        score += 50
      }

      // Same subcategory
      if (uc.subcategory && uc.subcategory === useCase.subcategory) {
        score += 30
      }

      // Shared surfaces
      if (uc.copilot_surface && useCase.copilot_surface) {
        const sharedSurfaces = uc.copilot_surface.filter(s =>
          useCase.copilot_surface.includes(s)
        ).length
        score += sharedSurfaces * 10
      }

      // Shared modes
      if (uc.mode && useCase.mode) {
        const sharedModes = uc.mode.filter(m => useCase.mode.includes(m)).length
        score += sharedModes * 10
      }

      // Shared tags
      if (uc.tags && useCase.tags) {
        const sharedTags = uc.tags.filter(t => useCase.tags.includes(t)).length
        score += sharedTags * 5
      }

      // Same risk level
      if (uc.risk_level === useCase.risk_level) {
        score += 10
      }

      return { ...uc, score }
    })
    .filter(uc => uc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}

// Generate autocomplete suggestions
export const generateSuggestions = (useCases, partialQuery) => {
  if (!partialQuery || partialQuery.length < 2) return []

  const lowerQuery = partialQuery.toLowerCase()
  const suggestions = new Set()

  useCases.forEach(useCase => {
    // Title suggestions
    if (useCase.title && useCase.title.toLowerCase().includes(lowerQuery)) {
      suggestions.add(useCase.title)
    }

    // Category suggestions
    if (useCase.category && useCase.category.toLowerCase().includes(lowerQuery)) {
      suggestions.add(useCase.category)
    }

    // Tag suggestions
    if (useCase.tags) {
      useCase.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestions.add(tag)
        }
      })
    }
  })

  return Array.from(suggestions).slice(0, 10)
}

// Extract all unique values for filters
export const extractFilterOptions = (useCases) => {
  const surfaces = new Set()
  const modes = new Set()
  const riskLevels = new Set()
  const languages = new Set()
  const categories = new Set()

  useCases.forEach(useCase => {
    if (useCase.copilot_surface) {
      useCase.copilot_surface.forEach(s => surfaces.add(s))
    }

    if (useCase.mode) {
      useCase.mode.forEach(m => modes.add(m))
    }

    if (useCase.risk_level) {
      riskLevels.add(useCase.risk_level)
    }

    if (useCase.languages && useCase.languages.length > 0) {
      useCase.languages.forEach(l => languages.add(l))
    }

    if (useCase.category) {
      categories.add(useCase.category)
    }
  })

  return {
    surfaces: Array.from(surfaces).sort(),
    modes: Array.from(modes).sort(),
    riskLevels: Array.from(riskLevels).sort(),
    languages: Array.from(languages).sort(),
    categories: Array.from(categories).sort()
  }
}

export default {
  performSearch,
  performFuzzySearch,
  sortResults,
  getRelatedUseCases,
  generateSuggestions,
  extractFilterOptions
}
