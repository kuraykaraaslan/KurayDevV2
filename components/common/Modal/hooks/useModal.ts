import { useCallback, useState } from 'react'

export function useModal(initial = false) {
  const [open, setOpen] = useState(initial)
  const openModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])
  const toggleModal = useCallback(() => setOpen((v) => !v), [])
  return { open, openModal, closeModal, toggleModal, setOpen }
}
