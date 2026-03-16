import { CSSProperties, RefObject, useCallback, useEffect, useRef, useState } from 'react'

type UseDraggableOptions = {
  enabled: boolean
  handle: HTMLElement | null
  targetRef: RefObject<HTMLElement | null>
}

type UseDraggableReturn = {
  isDragging: boolean
  resetPosition: () => void
  /**
   * Apply as `style` on the panel element.
   * NOTE: intentionally never includes `translate` — position is managed
   * exclusively via direct DOM writes to avoid React re-renders overriding
   * the live value during drag.
   */
  dragStyle: CSSProperties
}

function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

export function useDraggable({ enabled, handle, targetRef }: UseDraggableOptions): UseDraggableReturn {
  const [isDragging, setIsDragging] = useState(false)
  const livePos = useRef({ x: 0, y: 0 })
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 })

  const setTranslate = useCallback(
    (x: number, y: number) => {
      if (!targetRef.current) return
      targetRef.current.style.translate = x === 0 && y === 0 ? '' : `${x}px ${y}px`
    },
    [targetRef]
  )

  const resetPosition = useCallback(() => {
    livePos.current = { x: 0, y: 0 }
    setTranslate(0, 0)
  }, [setTranslate])

  useEffect(() => {
    if (!enabled || !handle || isTouchDevice()) return

    handle.style.cursor = 'grab'

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()

      dragOrigin.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: livePos.current.x,
        posY: livePos.current.y,
      }

      // Disable CSS transitions so the panel follows the cursor with zero easing
      if (targetRef.current) targetRef.current.style.transition = 'none'

      setIsDragging(true)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'

      const onMouseMove = (e: MouseEvent) => {
        const x = dragOrigin.current.posX + (e.clientX - dragOrigin.current.mouseX)
        const y = dragOrigin.current.posY + (e.clientY - dragOrigin.current.mouseY)
        livePos.current = { x, y }
        // Direct DOM write — zero React re-renders, zero easing
        if (targetRef.current) targetRef.current.style.translate = `${x}px ${y}px`
      }

      const onMouseUp = () => {
        // Re-enable transitions after one frame so the restore doesn't animate
        requestAnimationFrame(() => {
          if (targetRef.current) targetRef.current.style.transition = ''
        })
        setIsDragging(false)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    handle.addEventListener('mousedown', onMouseDown)
    return () => {
      handle.removeEventListener('mousedown', onMouseDown)
      handle.style.cursor = ''
    }
  }, [enabled, handle, targetRef, setTranslate])

  // dragStyle intentionally has no `translate` key — React must never overwrite
  // the position that was set directly on the DOM node.
  const dragStyle: CSSProperties = {}

  return { isDragging, resetPosition, dragStyle }
}
