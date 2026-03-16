import { MouseEvent } from 'react'

type ModalBackdropProps = {
  open: boolean
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void
  className?: string
}

export function ModalBackdrop({ open, onMouseDown, className = '' }: ModalBackdropProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={[
        'absolute inset-0 bg-base-300/60 backdrop-blur-sm transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0',
        className,
      ].join(' ')}
    />
  )
}
