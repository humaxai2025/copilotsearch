// Local Storage utility functions

const STORAGE_KEYS = {
  FAVORITES: 'copilot_favorites',
  COLLECTIONS: 'copilot_collections',
  SEARCH_HISTORY: 'copilot_search_history',
  THEME: 'copilot_theme',
  VIEW_PREFERENCE: 'copilot_view_preference',
  FILTERS: 'copilot_filters',
  ANALYTICS: 'copilot_analytics'
}

// Generic storage functions
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error)
    return false
  }
}

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error)
    return false
  }
}

// Favorites management
export const getFavorites = () => {
  return getFromStorage(STORAGE_KEYS.FAVORITES, [])
}

export const saveFavorites = (favorites) => {
  return setToStorage(STORAGE_KEYS.FAVORITES, favorites)
}

export const addFavorite = (useCaseId) => {
  const favorites = getFavorites()
  if (!favorites.includes(useCaseId)) {
    favorites.push(useCaseId)
    saveFavorites(favorites)
  }
  return favorites
}

export const removeFavorite = (useCaseId) => {
  const favorites = getFavorites()
  const updated = favorites.filter(id => id !== useCaseId)
  saveFavorites(updated)
  return updated
}

export const isFavorite = (useCaseId) => {
  const favorites = getFavorites()
  return favorites.includes(useCaseId)
}

// Collections management
export const getCollections = () => {
  return getFromStorage(STORAGE_KEYS.COLLECTIONS, [])
}

export const saveCollections = (collections) => {
  return setToStorage(STORAGE_KEYS.COLLECTIONS, collections)
}

export const addCollection = (name, description = '') => {
  const collections = getCollections()
  const newCollection = {
    id: Date.now().toString(),
    name,
    description,
    useCases: [],
    createdAt: new Date().toISOString()
  }
  collections.push(newCollection)
  saveCollections(collections)
  return newCollection
}

export const deleteCollection = (collectionId) => {
  const collections = getCollections()
  const updated = collections.filter(c => c.id !== collectionId)
  saveCollections(updated)
  return updated
}

export const addToCollection = (collectionId, useCaseId) => {
  const collections = getCollections()
  const collection = collections.find(c => c.id === collectionId)
  if (collection && !collection.useCases.includes(useCaseId)) {
    collection.useCases.push(useCaseId)
    saveCollections(collections)
  }
  return collections
}

export const removeFromCollection = (collectionId, useCaseId) => {
  const collections = getCollections()
  const collection = collections.find(c => c.id === collectionId)
  if (collection) {
    collection.useCases = collection.useCases.filter(id => id !== useCaseId)
    saveCollections(collections)
  }
  return collections
}

// Search history
export const getSearchHistory = () => {
  return getFromStorage(STORAGE_KEYS.SEARCH_HISTORY, [])
}

export const addSearchHistory = (query) => {
  if (!query.trim()) return

  const history = getSearchHistory()
  // Remove if exists (to move to top)
  const filtered = history.filter(item => item.query !== query)
  // Add to beginning
  filtered.unshift({
    query,
    timestamp: new Date().toISOString()
  })
  // Keep only last 50
  const limited = filtered.slice(0, 50)
  setToStorage(STORAGE_KEYS.SEARCH_HISTORY, limited)
  return limited
}

export const clearSearchHistory = () => {
  return setToStorage(STORAGE_KEYS.SEARCH_HISTORY, [])
}

// Theme
export const getTheme = () => {
  return getFromStorage(STORAGE_KEYS.THEME, 'light')
}

export const setTheme = (theme) => {
  return setToStorage(STORAGE_KEYS.THEME, theme)
}

// View preference
export const getViewPreference = () => {
  return getFromStorage(STORAGE_KEYS.VIEW_PREFERENCE, 'expanded')
}

export const setViewPreference = (preference) => {
  return setToStorage(STORAGE_KEYS.VIEW_PREFERENCE, preference)
}

// Filters
export const getSavedFilters = () => {
  return getFromStorage(STORAGE_KEYS.FILTERS, null)
}

export const saveFilters = (filters) => {
  return setToStorage(STORAGE_KEYS.FILTERS, filters)
}

// Analytics
export const getAnalytics = () => {
  return getFromStorage(STORAGE_KEYS.ANALYTICS, {
    searches: [],
    views: [],
    favorites: [],
    exports: []
  })
}

export const trackEvent = (eventType, data) => {
  const analytics = getAnalytics()
  const event = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  }

  if (!analytics[eventType]) {
    analytics[eventType] = []
  }

  analytics[eventType].push(event)

  // Keep only last 1000 events per type
  if (analytics[eventType].length > 1000) {
    analytics[eventType] = analytics[eventType].slice(-1000)
  }

  setToStorage(STORAGE_KEYS.ANALYTICS, analytics)
  return analytics
}

export default STORAGE_KEYS
