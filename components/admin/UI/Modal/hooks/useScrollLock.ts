import { useEffect } from 'react'

export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return

    const html = document.documentElement

    // Measure scrollbar width before locking so we can compensate.
    // Without this the page content shifts left when the scrollbar disappears.
    const scrollbarWidth = window.innerWidth - html.clientWidth

    const prevOverflow = html.style.overflow
    const prevPaddingRight = html.style.paddingRight

    html.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      html.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      html.style.overflow = prevOverflow
      html.style.paddingRight = prevPaddingRight
    }
  }, [locked])
}
