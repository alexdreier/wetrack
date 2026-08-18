'use client'

import { useEffect, useRef } from 'react'

type HotkeyMap = Record<string, (e: KeyboardEvent) => void>

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * Global single-key shortcuts. Keys match KeyboardEvent.key ('n', '/', '?').
 * Ignored while typing in a field or when a modifier is held.
 */
export function useHotkeys(hotkeys: HotkeyMap) {
  const hotkeysRef = useRef(hotkeys)
  useEffect(() => {
    hotkeysRef.current = hotkeys
  }, [hotkeys])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const handler = hotkeysRef.current[e.key]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
