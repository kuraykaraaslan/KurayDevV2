import { ReactNode } from 'react'

type ModalFooterProps = {
  children: ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex flex-shrink-0 items-center justify-end gap-2 p-4 border-t border-base-200">
      {children}
    </div>
  )
}
