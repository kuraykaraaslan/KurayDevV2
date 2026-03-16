import { MutableRefObject, useEffect, useId, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Module-level stack — singleton shared across all HeadlessModal instances
// ---------------------------------------------------------------------------

const BASE_Z = 50
const Z_STEP = 10

type ModalEntry = {
  id: string
  /** Ref so we always call the latest onClose without stale-closure issues */
  closeRef: MutableRefObject<() => void>
}

const stack: ModalEntry[] = []

function push(id: string, closeRef: MutableRefObject<() => void>): void {
  if (!stack.some((e) => e.id === id)) {
    stack.push({ id, closeRef })
  }
}

function remove(id: string): void {
  const idx = stack.findIndex((e) => e.id === id)
  if (idx !== -1) stack.splice(idx, 1)
}

/**
 * Synchronously removes all other entries from the stack, then calls their
 * onClose so the parent state catches up. Sync removal is important so that
 * the new modal's push() sees a clean stack and gets z-index = BASE_Z.
 */
function closeAllExcept(id: string): void {
  const toClose = stack.filter((e) => e.id !== id)
  toClose.forEach((e) => remove(e.id))
  toClose.forEach((e) => e.closeRef.current())
}

function zIndexFor(id: string): number {
  const idx = stack.findIndex((e) => e.id === id)
  return BASE_Z + Math.max(0, idx) * Z_STEP
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

type UseModalStackReturn = {
  /** Dynamic z-index based on stack depth — pass via inline style */
  zIndex: number
  /** How many modals are currently open (including this one) */
  stackDepth: number
}

/**
 * Registers this modal in the global stack while it is open.
 * When `allowMultiple` is false (default), all other open modals are closed
 * before this one is registered.
 */
export function useModalStack(
  open: boolean,
  onClose: () => void,
  allowMultiple: boolean
): UseModalStackReturn {
  const id = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose // always latest

  const [zIndex, setZIndex] = useState(BASE_Z)
  const [stackDepth, setStackDepth] = useState(0)

  useEffect(() => {
    if (!open) {
      remove(id)
      setStackDepth(stack.length)
      return
    }

    if (!allowMultiple) {
      closeAllExcept(id)
    }

    push(id, onCloseRef)
    setZIndex(zIndexFor(id))
    setStackDepth(stack.length)

    return () => {
      remove(id)
    }
  }, [open, id, allowMultiple])

  return { zIndex, stackDepth }
}
