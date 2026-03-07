'use client'
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { createRef, useState } from 'react'
import dynamic from 'next/dynamic'
import LoadingElement from '@/components/frontend/UI/Content/LoadingElement'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <LoadingElement title="Video Player" />,
})

const MyImageVideoDialog = () => {
  const [playing, setPlaying] = useState(false)
  const player = createRef<any>()
  const { open, openModal, closeModal } = useModal()

  const handleOpenModal = () => {
    openModal()
    setTimeout(() => {
      setPlaying(true)
    }, 600)
  }

  const handleCloseModal = () => {
    setPlaying(false)
    closeModal()
  }

  return (
    <>
      <div className="relative w-full h-full flex flex-col" onClick={handleOpenModal}>
        <FontAwesomeIcon icon={faPlayCircle} className="text-white w-48 h-48 m-auto" size="3x" />
      </div>

      <HeadlessModal
        open={open}
        onClose={handleCloseModal}
        showClose={false}
        size="xl"
        className="!bg-black overflow-hidden"
      >
        <div className="-m-4">
          <ReactPlayer
            src="https://www.youtube.com/watch?v=oJN50oOlW-c?modestbranding=1&rel=0&showinfo=0"
            controls
            width="100%"
            height="60vh"
            playing={playing}
            ref={player}
          />
        </div>
      </HeadlessModal>
    </>
  )
}

export default MyImageVideoDialog
