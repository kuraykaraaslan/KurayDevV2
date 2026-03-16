import { CSSProperties, RefObject, useCallback, useEffect, useRef, useState } from 'react'

type UseDraggableOptions = {
  /** Master switch — also internally gated by touch detection */
  enabled: boolean
  /** The element the user grabs to start dragging (e.g. modal header) */
  handleRef: RefObject<HTMLElement | null>
}

type UseDraggableReturn = {
  isDragging: boolean
  /** Reset offset to origin — call when modal closes so it reopens centred */
  resetPosition: () => void
  /** Apply to the draggable panel element */
  dragStyle: CSSProperties
}

/** Returns true on touch/pointer-coarse devices (phones, tablets). */
function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

export function useDraggable({ enabled, handleRef }: UseDraggableOptions): UseDraggableReturn {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Refs let closures always read the latest values without re-binding listeners
  const posRef = useRef({ x: 0, y: 0 })
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 })

  posRef.current = pos

  const resetPosition = useCallback(() => setPos({ x: 0, y: 0 }), [])

  useEffect(() => {
    const handle = handleRef.current
    // Disabled explicitly or on touch devices (mobile always off)
    if (!enabled || !handle || isTouchDevice()) return

    handle.style.cursor = 'grab'

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // left button only
      e.preventDefault()

      dragOrigin.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: posRef.current.x,
        posY: posRef.current.y,
      }

      setIsDragging(true)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'

      const onMouseMove = (e: MouseEvent) => {
        const x = dragOrigin.current.posX + (e.clientX - dragOrigin.current.mouseX)
        const y = dragOrigin.current.posY + (e.clientY - dragOrigin.current.mouseY)
        posRef.current = { x, y }
        setPos({ x, y })
      }

      const onMouseUp = () => {
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
  }, [enabled, handleRef])

  const dragStyle: CSSProperties = enabled
    ? { translate: `${pos.x}px ${pos.y}px` }
    : {}

  return { isDragging, resetPosition, dragStyle }
}
