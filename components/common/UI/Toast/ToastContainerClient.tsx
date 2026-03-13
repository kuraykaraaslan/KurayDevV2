'use client'

import { ToastContainer, type ToastContainerProps } from 'react-toastify'

interface ToastContainerClientProps {
  options?: Partial<ToastContainerProps>
}

export default function ToastContainerClient({ options }: ToastContainerClientProps) {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      {...options}
    />
  )
}
