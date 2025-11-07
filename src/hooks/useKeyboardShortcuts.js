import { useEffect } from 'react'

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check each shortcut
      for (const shortcut of shortcuts) {
        const { key, ctrl, shift, alt, meta, callback } = shortcut
        const keyMatch = event.key.toLowerCase() === key.toLowerCase()
        const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : true
        const shiftMatch = shift ? event.shiftKey : true
        const altMatch = alt ? event.altKey : true
        const metaMatch = meta ? event.metaKey : true

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault()
          callback(event)
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

export default useKeyboardShortcuts
