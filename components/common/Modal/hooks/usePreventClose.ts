import { useCallback, useState } from 'react'

type UsePreventCloseReturn = {
  /** Pass directly to `<HeadlessModal preventClose={...}>` */
  preventClose: boolean
  /** Call when the form/content becomes dirty (has unsaved changes) */
  markDirty: () => void
  /** Call when changes are saved or discarded — allows closing again */
  markClean: () => void
  /** Force-reset dirty state (e.g. after modal fully closes) */
  reset: () => void
}

/**
 * Tracks unsaved-changes state for use with `HeadlessModal.preventClose`.
 *
 * @example
 * const { preventClose, markDirty, markClean } = usePreventClose()
 *
 * <form onChange={markDirty} onSubmit={async (e) => { await save(); markClean() }}>
 *
 * <HeadlessModal
 *   preventClose={preventClose}
 *   onCloseAttempt={() => setShowWarning(true)}
 *   onAfterClose={reset}
 * >
 */
export function usePreventClose(initial = false): UsePreventCloseReturn {
  const [dirty, setDirty] = useState(initial)

  const markDirty = useCallback(() => setDirty(true), [])
  const markClean = useCallback(() => setDirty(false), [])
  const reset = useCallback(() => setDirty(false), [])

  return { preventClose: dirty, markDirty, markClean, reset }
}
