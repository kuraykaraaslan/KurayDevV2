import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HeadlessModal, HeadlessModalProps } from './HeadlessModal'

export type ConfirmModalVariant = 'error' | 'warning' | 'info' | 'success'

export type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: ReactNode
  /** Body text shown inside the modal */
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmModalVariant
  size?: HeadlessModalProps['size']
  closeOnEsc?: boolean
}

const VARIANT_BTN: Record<ConfirmModalVariant, string> = {
  error: 'btn-error',
  warning: 'btn-warning',
  info: 'btn-info',
  success: 'btn-success',
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'error',
  size = 'sm',
  closeOnEsc = true,
}: ConfirmModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }, [onConfirm])

  // Reset loading state when modal closes
  useEffect(() => {
    if (!open) setLoading(false)
  }, [open])

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      closeOnEsc={closeOnEsc && !loading}
      closeOnBackdrop={!loading}
      preventClose={loading}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel ?? t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${VARIANT_BTN[variant]}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-xs" />}
            {confirmLabel ?? t('common.confirm', 'Confirm')}
          </button>
        </>
      }
    >
      {description && <p className="text-sm text-base-content/80">{description}</p>}
    </HeadlessModal>
  )
}
