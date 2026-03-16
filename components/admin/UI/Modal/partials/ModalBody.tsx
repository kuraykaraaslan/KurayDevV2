import { ReactNode } from 'react'

type ModalBodyProps = {
  description?: ReactNode
  describedById: string
  children?: ReactNode
}

export function ModalBody({ description, describedById, children }: ModalBodyProps) {
  return (
    <>
      {description && (
        <div id={describedById} className="flex-shrink-0 px-4 pt-3 text-sm text-base-content/70">
          {description}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </>
  )
}
