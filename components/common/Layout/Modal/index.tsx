import { ReactNode, RefObject, useCallback, useEffect, useId, useMemo, useRef, useState, MouseEvent } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from 'react-i18next'

/**
 * HeadlessModal (Tailwind + daisyUI friendly)
 * - Fully controlled via `open` + `onClose`
 * - Accessible: role="dialog", aria-labelledby/aria-describedby, focus trap, ESC to close
 * - No external deps. Uses daisyUI design tokens/classes (bg-base-100, text-base-content, btn, etc.)
 * - Works with Tailwind transitions; customizable via `size`, `className`, and `backdropClassName`.
 * - Now includes `maxWidth` and `maxHeight` that fit the screen.
 */

export type HeadlessModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  showClose?: boolean
  initialFocusRef?: RefObject<HTMLElement>
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
  backdropClassName?: string
  children?: ReactNode
}

export function HeadlessModal({
  open,
  onClose,
  title,
  description,
  closeOnBackdrop = true,
  closeOnEsc = true,
  showClose = true,
  initialFocusRef,
  size = "md",
  className = "",
  backdropClassName = "",
  children,
}: HeadlessModalProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)
  const labelledById = useId()
  const describedById = useId()

  // Create portal root (client-only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock scroll
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = prev
    }
  }, [open])

  // Restore focus
  useEffect(() => {
    if (open) {
      lastActiveRef.current = (document.activeElement as HTMLElement) ?? null
    } else {
      lastActiveRef.current?.focus?.()
    }
  }, [open])

  // Focus handling
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const target = initialFocusRef?.current || getFirstFocusable(panelRef.current)
      target?.focus?.()
    }, 0)
    return () => clearTimeout(timer)
  }, [open, initialFocusRef])

  // ESC to close + focus trap
  useEffect(() => {
    if (!open || !closeOnEsc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
      if (e.key === "Tab") {
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
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [open, closeOnEsc, onClose])

  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "max-w-sm"
      case "md":
        return "max-w-lg"
      case "lg":
        return "max-w-2xl"
      case "xl":
        return "max-w-4xl"
      case "full":
        return "w-screen h-screen"
      default:
        return "max-w-lg"
    }
  }, [size])

  const handleBackdrop = useCallback(
    (e: MouseEvent) => {
      if (!closeOnBackdrop) return
      if (e.target === e.currentTarget) onClose()
    },
    [closeOnBackdrop, onClose]
  )

  if (!mounted) return null

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onMouseDown={handleBackdrop}
        className={[
          "absolute inset-0 bg-base-300/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
          backdropClassName,
        ].join(" ")}
      />

      {/* Center wrapper */}
      <div
        className={[
          "absolute inset-0 flex items-center justify-center p-4",
          size === "full" ? "p-0" : "",
        ].join(" ")}
        onMouseDown={handleBackdrop}
      >
        {/* Dialog Panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? labelledById : undefined}
          aria-describedby={description ? describedById : undefined}
          className={[
            "bg-base-100 text-base-content shadow-2xl rounded-box",
            "w-full",
            sizeClass,
            // Fit to screen
            "max-w-[95vw] max-h-[90vh] overflow-auto",
            // Animation
            "transition-opacity transition-transform duration-200",
            open ? "opacity-100 scale-100" : "opacity-0 scale-95",
            className,
          ].join(" ")}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-center justify-between gap-2 p-4 border-b border-base-200">
              {title ? (
                <h2 id={labelledById} className="text-lg font-semibold">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('common.modal.close_dialog')}
                  className="btn btn-ghost btn-sm"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <div id={describedById} className="px-4 pt-3 text-sm text-base-content/70">
              {description}
            </div>
          )}

          {/* Body */}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Get all focusable elements inside container */
function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selectors.join(',')))
  return nodes.filter((el) => !el.hasAttribute("disabled") && isVisible(el))
}

function getFirstFocusable(root: HTMLElement | null): HTMLElement | null {
  return getFocusable(root)[0] ?? null
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  return style.visibility !== "hidden" && style.display !== "none"
}

/** useModal — simple local state helper */
export function useModal(initial = false) {
  const [open, setOpen] = useState(initial)
  const openModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])
  const toggleModal = useCallback(() => setOpen((v) => !v), [])
  return { open, openModal, closeModal, toggleModal, setOpen }
}

export default HeadlessModal
