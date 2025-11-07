import { useRef, useEffect } from 'react'

// Returns a debounced version of the provided callback.
// Usage: const debounced = useDebounce(fn, 250); debounced(arg)
export default function useDebounce(callback, delay = 250) {
  const timer = useRef(null)
  const cbRef = useRef(callback)

  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return function debounced(...args) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      cbRef.current(...args)
    }, delay)
  }
}
