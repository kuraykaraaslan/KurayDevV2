'use client'
import { createRef, useState } from 'react'
import ReactPlayer from 'react-player'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'

const HireMeVideo = () => {
  const [playing, setPlaying] = useState(false)
  const player = createRef<any>()
  const { open, openModal, closeModal } = useModal()

  const handleOpenModal = () => {
    openModal()
    setTimeout(() => {
      setPlaying(true)
    }, 1000)
  }

  const handleCloseModal = () => {
    setPlaying(false)
    closeModal()
  }

  return (
    <>
      <button className="btn btn-ghost me-2" onClick={handleOpenModal}>
        <FontAwesomeIcon icon={faPlayCircle} className="me-2 text-xl w-6 h-6" />
        Watch Video
      </button>
      <HeadlessModal
        open={open}
        onClose={handleCloseModal}
        showClose={false}
        size="lg"
        className="!bg-black overflow-hidden"
      >
        <div className="-m-4">
          <ReactPlayer
            src="https://www.youtube.com/watch?v=eJO5HU_7_1w?modestbranding=1&rel=0&showinfo=0&autoplay=1"
            controls={true}
            width="100%"
            playing={playing}
            ref={player}
          />
        </div>
      </HeadlessModal>
    </>
  )
}

export default HireMeVideo
