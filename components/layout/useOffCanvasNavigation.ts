'use client'

import { useEffect, useRef } from 'react'

type UseOffCanvasNavigationArgs = {
  isOpen: boolean
  onClose: () => void
  toggleButtonId: string
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useOffCanvasNavigation({
  isOpen,
  onClose,
  toggleButtonId,
}: UseOffCanvasNavigationArgs) {
  const panelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen || !panelRef.current) {
      return
    }

    const panel = panelRef.current
    const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || focusableElements.length === 0) {
        return
      }

      const activeElement = document.activeElement as HTMLElement | null

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable?.focus()
      }

      if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable?.focus()
      }
    }

    panel.addEventListener('keydown', handleKeyDown)

    return () => {
      panel.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      return
    }

    const toggle = document.getElementById(toggleButtonId)
    toggle?.focus()
  }, [isOpen, toggleButtonId])

  return {
    panelRef,
  }
}
