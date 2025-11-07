import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getCollections,
  addCollection,
  deleteCollection,
  addToCollection,
  removeFromCollection,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  getViewPreference,
  setViewPreference as saveViewPreference,
  trackEvent
} from '../utils/localStorage'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  // Favorites
  const [favorites, setFavorites] = useState(() => getFavorites())

  const toggleFavorite = useCallback((useCaseId) => {
    if (isFavorite(useCaseId)) {
      const updated = removeFavorite(useCaseId)
      setFavorites(updated)
      trackEvent('favorites', { action: 'remove', useCaseId })
    } else {
      const updated = addFavorite(useCaseId)
      setFavorites(updated)
      trackEvent('favorites', { action: 'add', useCaseId })
    }
  }, [])

  const checkIsFavorite = useCallback((useCaseId) => {
    return favorites.includes(useCaseId)
  }, [favorites])

  // Collections
  const [collections, setCollections] = useState(() => getCollections())

  const createCollection = useCallback((name, description) => {
    const newCollection = addCollection(name, description)
    setCollections(getCollections())
    trackEvent('collections', { action: 'create', collectionId: newCollection.id })
    return newCollection
  }, [])

  const removeCollection = useCallback((collectionId) => {
    deleteCollection(collectionId)
    setCollections(getCollections())
    trackEvent('collections', { action: 'delete', collectionId })
  }, [])

  const addUseCaseToCollection = useCallback((collectionId, useCaseId) => {
    addToCollection(collectionId, useCaseId)
    setCollections(getCollections())
    trackEvent('collections', { action: 'add_usecase', collectionId, useCaseId })
  }, [])

  const removeUseCaseFromCollection = useCallback((collectionId, useCaseId) => {
    removeFromCollection(collectionId, useCaseId)
    setCollections(getCollections())
    trackEvent('collections', { action: 'remove_usecase', collectionId, useCaseId })
  }, [])

  // Search History
  const [searchHistory, setSearchHistory] = useState(() => getSearchHistory())

  const addToSearchHistory = useCallback((query) => {
    const updated = addSearchHistory(query)
    setSearchHistory(updated)
    trackEvent('searches', { query })
  }, [])

  const clearHistory = useCallback(() => {
    clearSearchHistory()
    setSearchHistory([])
  }, [])

  // View Preference
  const [viewPreference, setViewPreferenceState] = useState(() => getViewPreference())

  const setViewPreference = useCallback((preference) => {
    saveViewPreference(preference)
    setViewPreferenceState(preference)
    trackEvent('settings', { action: 'change_view', preference })
  }, [])

  // Track view events
  const trackView = useCallback((useCaseId) => {
    trackEvent('views', { useCaseId })
  }, [])

  const trackExport = useCallback((format, count) => {
    trackEvent('exports', { format, count })
  }, [])

  const value = {
    // Favorites
    favorites,
    toggleFavorite,
    isFavorite: checkIsFavorite,

    // Collections
    collections,
    createCollection,
    removeCollection,
    addUseCaseToCollection,
    removeUseCaseFromCollection,

    // Search History
    searchHistory,
    addToSearchHistory,
    clearHistory,

    // View Preference
    viewPreference,
    setViewPreference,

    // Analytics
    trackView,
    trackExport
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppContext
