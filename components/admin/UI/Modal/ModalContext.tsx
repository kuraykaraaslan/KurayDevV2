'use client'

import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { ConfirmModal, ConfirmModalVariant } from './index'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfirmOptions = {
  title?: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmModalVariant
}

type ModalContextValue = {
  /**
   * Open a confirmation dialog imperatively.
   * Resolves `true` if the user confirms, `false` if they cancel/dismiss.
   *
   * @example
   * const ok = await confirm({ title: 'Delete?', variant: 'error' })
   * if (ok) await deleteItem()
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ModalContext = createContext<ModalContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    pending?.resolve(true)
    setPending(null)
  }, [pending])

  const handleClose = useCallback(() => {
    pending?.resolve(false)
    setPending(null)
  }, [pending])

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        open={!!pending}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={pending?.title}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        variant={pending?.variant ?? 'error'}
      />
    </ModalContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModalContext must be used inside <ModalProvider>')
  return ctx
}
