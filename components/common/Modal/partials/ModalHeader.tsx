import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpDownLeftRight } from '@fortawesome/free-solid-svg-icons'

type ModalHeaderProps = {
  title?: ReactNode
  showClose: boolean
  labelledById: string
  onClose: () => void
  /** Called with the button element when it mounts — feeds useDraggable */
  onDragHandleMount?: (el: HTMLElement | null) => void
  draggable?: boolean
}

export function ModalHeader({ title, showClose, labelledById, onClose, onDragHandleMount, draggable }: ModalHeaderProps) {
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

      <div className="flex items-center gap-1">
        {draggable && (
          <button
            ref={onDragHandleMount}
            type="button"
            aria-label={t('common.modal.drag_handle', 'Move dialog')}
            className="btn btn-ghost btn-sm text-base-content/40 hover:text-base-content/70 cursor-grab active:cursor-grabbing"
          >
            <FontAwesomeIcon icon={faUpDownLeftRight} />
          </button>
        )}
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.modal.close_dialog', 'Close dialog')}
            className="btn btn-ghost btn-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
