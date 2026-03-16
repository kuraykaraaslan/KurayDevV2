import { RefObject, useEffect } from 'react'
import { getFocusable, getFirstFocusable } from '../utils/focusable'

type UseFocusTrapOptions = {
  open: boolean
  closeOnEsc: boolean
  panelRef: RefObject<HTMLElement | null>
  initialFocusRef?: RefObject<HTMLElement>
  onClose: () => void
}

export function useFocusTrap({
  open,
  closeOnEsc,
  panelRef,
  initialFocusRef,
  onClose,
}: UseFocusTrapOptions): void {
  // Move focus into the modal on open
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const target = initialFocusRef?.current || getFirstFocusable(panelRef.current)
      target?.focus?.()
    }, 0)
    return () => clearTimeout(timer)
  }, [open, initialFocusRef, panelRef])

  // ESC to close + Tab focus trap
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!closeOnEsc) return
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const focusables = getFocusable(panelRef.current)
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement
        if (e.shiftKey) {
          if (active === first || !panelRef.current?.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last || !panelRef.current?.contains(active)) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, closeOnEsc, onClose, panelRef])
}
