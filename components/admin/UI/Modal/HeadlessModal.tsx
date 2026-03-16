import {
  ReactNode,
  RefObject,
  MouseEvent,
  TransitionEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { useFocusTrap } from './hooks/useFocusTrap'
import { useModalStack } from './hooks/useModalStack'
import { useDraggable } from './hooks/useDraggable'
import { ModalBackdrop } from './partials/ModalBackdrop'
import { ModalHeader } from './partials/ModalHeader'
import { ModalBody } from './partials/ModalBody'
import { ModalFooter } from './partials/ModalFooter'

export type HeadlessModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  /** Fallback accessible name when `title` is not provided */
  ariaLabel?: string
  /** Sticky footer slot — ideal for action buttons */
  footer?: ReactNode
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  showClose?: boolean
  /**
   * When truthy (or when the callback returns true), closing is blocked.
   * Pair with `onCloseAttempt` to show a warning (e.g. unsaved changes).
   */
  preventClose?: boolean | (() => boolean)
  /** Called when a close attempt is blocked by `preventClose` */
  onCloseAttempt?: () => void
  /** Called after the exit animation completes — ideal for form resets or state cleanup */
  onAfterClose?: () => void
  /**
   * Keep the modal in the DOM while closed (display:none).
   * Preserves child form state across open/close cycles.
   */
  keepMounted?: boolean
  initialFocusRef?: RefObject<HTMLElement>
  /** Scroll locking strategy used while the modal is visible */
  scrollLockStrategy?: 'auto' | 'html-overflow' | 'body-fixed'
  /**
   * When false (default), opening this modal closes all other open modals.
   * Set to true to allow multiple modals to be open simultaneously.
   */
  allowMultiple?: boolean
  /**
   * Allow the modal to be dragged by its header.
   * Always disabled on touch/mobile devices regardless of this value.
   */
  draggable?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  backdropClassName?: string
  children?: ReactNode
}

const SIZE_CLASS: Record<NonNullable<HeadlessModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'w-screen h-screen',
}

export function HeadlessModal({
  open,
  onClose,
  title,
  description,
  ariaLabel,
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  showClose = true,
  preventClose,
  onCloseAttempt,
  onAfterClose,
  keepMounted = false,
  initialFocusRef,
  scrollLockStrategy,
  allowMultiple = false,
  draggable = false,
  size = 'md',
  className = '',
  backdropClassName = '',
  children,
}: HeadlessModalProps) {
  const [mounted, setMounted] = useState(false)
  // `visible` controls DOM presence; `open` drives animation classes.
  // Decoupled so exit animations play before the element is removed.
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)
  const labelledById = useId()
  const describedById = useId()

  // Portal root — client only
  useEffect(() => setMounted(true), [])

  // Mount immediately on open; unmount deferred to onTransitionEnd
  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  // Scroll lock covers the exit animation duration
  useScrollLock(visible, { strategy: scrollLockStrategy })

  // Save + restore focus around open/close
  useEffect(() => {
    if (open) {
      lastActiveRef.current = (document.activeElement as HTMLElement) ?? null
    } else {
      lastActiveRef.current?.focus?.()
    }
  }, [open])

  // Wrap onClose with the preventClose guard
  const handleClose = useCallback(() => {
    const blocked = typeof preventClose === 'function' ? preventClose() : !!preventClose
    if (blocked) {
      onCloseAttempt?.()
      return
    }
    onClose()
  }, [preventClose, onCloseAttempt, onClose])

  useFocusTrap({ open, closeOnEsc, panelRef, initialFocusRef, onClose: handleClose })

  const { zIndex } = useModalStack(open, onClose, allowMultiple)

  const { dragStyle, resetPosition } = useDraggable({ enabled: draggable, handleRef: dragHandleRef })

  // Reset drag offset whenever the modal closes
  useEffect(() => {
    if (!open) resetPosition()
  }, [open, resetPosition])

  const sizeClass = useMemo(() => SIZE_CLASS[size] ?? SIZE_CLASS.md, [size])

  const handleBackdrop = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!closeOnBackdrop) return
      if (e.target === e.currentTarget) handleClose()
    },
    [closeOnBackdrop, handleClose]
  )

  // Remove from DOM after exit transition (unless keepMounted); fire onAfterClose
  const handleTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      // Transition events bubble; only react to the dialog panel's own transition.
      if (e.target !== e.currentTarget) return
      // Avoid double-calling for opacity+transform.
      if (e.propertyName !== 'transform') return
      if (!open) {
        setVisible(false)
        onAfterClose?.()
      }
    },
    [open, onAfterClose]
  )

  if (!mounted) return null
  if (!visible && !keepMounted) return null

  return createPortal(
    <div
      style={keepMounted && !visible ? { display: 'none', zIndex } : { zIndex }}
      className={['fixed inset-0', open ? 'pointer-events-auto' : 'pointer-events-none'].join(
        ' '
      )}
      aria-hidden={!open}
    >
      <ModalBackdrop open={open} onMouseDown={handleBackdrop} className={backdropClassName} />

      {/* Center wrapper */}
      <div
        className={['absolute inset-0 flex items-center justify-center', size === 'full' ? '' : 'p-4'].join(' ')}
        onMouseDown={handleBackdrop}
      >
        {/* Dialog panel — flex column: header + footer sticky, body scrolls */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? labelledById : undefined}
          aria-label={!title ? ariaLabel : undefined}
          aria-describedby={description ? describedById : undefined}
          className={[
            'flex flex-col bg-base-100 text-base-content shadow-2xl rounded-box',
            'w-full max-w-[95vw] max-h-[90vh]',
            sizeClass,
            'transition-opacity transition-transform duration-200',
            open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            className,
          ].join(' ')}
          style={dragStyle}
          onMouseDown={(e) => e.stopPropagation()}
          onTransitionEnd={handleTransitionEnd}
        >
          <ModalHeader
            title={title}
            showClose={showClose}
            labelledById={labelledById}
            onClose={handleClose}
            dragHandleRef={dragHandleRef}
            draggable={draggable}
          />
          <ModalBody description={description} describedById={describedById}>
            {children}
          </ModalBody>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </div>
      </div>
    </div>,
    document.body
  )
}
