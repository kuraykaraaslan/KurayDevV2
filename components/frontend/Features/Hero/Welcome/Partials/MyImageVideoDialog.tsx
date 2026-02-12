'use client'
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { createRef, useState } from 'react'
import dynamic from 'next/dynamic'
import LoadingElement from '@/components/frontend/UI/Content/LoadingElement'

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <LoadingElement title="Video Player" />,
})

const MyImageVideoDialog = () => {
  const [playing, setPlaying] = useState(false)
  const player = createRef<any>()

  const handleOpenModal = () => {
    const modal = document.getElementById('my_video') as HTMLDialogElement | null
    if (!modal) return
    modal.showModal()
    setTimeout(() => {
      //player.current?.seekTo(0);
      setPlaying(true)
    }, 600)
  }

  const handleCloseModal = () => {
    const modal = document.getElementById('my_video') as HTMLDialogElement | null
    if (!modal) return
    //player.current?.seekTo(0);
    setPlaying(false)
    modal.close()
  }

  return (
    <>
      <div className="relative w-full h-full flex flex-col" onClick={handleOpenModal}>
        <FontAwesomeIcon icon={faPlayCircle} className="text-white w-48 h-48 m-auto" size="3x" />
      </div>

      <dialog id="my_video" className="modal" onClick={handleCloseModal}>
        <div
          className="modal-box max-w-5xl w-full p-0 bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          <ReactPlayer
            src="https://www.youtube.com/watch?v=oJN50oOlW-c?modestbranding=1&rel=0&showinfo=0"
            controls
            width="100%"
            height="60vh"
            playing={playing}
            ref={player}
          />
        </div>
      </dialog>
    </>
  )
}

export default MyImageVideoDialog
