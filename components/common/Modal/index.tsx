// Public API barrel — prefer importing Modal APIs from this file.
// Internal modules inside this folder should import directly to avoid circular dependencies.
export { HeadlessModal } from './HeadlessModal'
export type { HeadlessModalProps } from './HeadlessModal'

export { ConfirmModal } from './ConfirmModal'
export type { ConfirmModalProps, ConfirmModalVariant } from './ConfirmModal'

export { ModalProvider, useModalContext } from './ModalContext'
export type { ConfirmOptions } from './ModalContext'

export { useModal } from './hooks/useModal'
export { usePreventClose } from './hooks/usePreventClose'

export { HeadlessModal as default } from './HeadlessModal'
