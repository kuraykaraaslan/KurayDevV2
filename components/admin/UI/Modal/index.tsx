// Public API barrel — import everything from this file
export { HeadlessModal } from './HeadlessModal'
export type { HeadlessModalProps } from './HeadlessModal'

export { ConfirmModal } from './ConfirmModal'
export type { ConfirmModalProps, ConfirmModalVariant } from './ConfirmModal'

export { ModalProvider, useModalContext } from './ModalContext'
export type { ConfirmOptions } from './ModalContext'

export { useModal } from './hooks/useModal'
export { usePreventClose } from './hooks/usePreventClose'

export { HeadlessModal as default } from './HeadlessModal'
