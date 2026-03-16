import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ModalHeaderProps = {
  title?: ReactNode
  showClose: boolean
  labelledById: string
  onClose: () => void
}

export function ModalHeader({ title, showClose, labelledById, onClose }: ModalHeaderProps) {
  const { t } = useTranslation()

  if (!title && !showClose) return null

  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-2 p-4 border-b border-base-200">
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
  )
}
