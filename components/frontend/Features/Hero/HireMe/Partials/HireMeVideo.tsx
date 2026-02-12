'use client'
import { createRef, useState } from 'react'
import ReactPlayer from 'react-player'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons'

const HireMeVideo = () => {
  const [playing, setPlaying] = useState(false)
  const player = createRef<any>()

  const handleOpenModal = () => {
    const modal = document.getElementById('my_modal')

    if (!modal) {
      return
    }

    // @ts-ignore
    document.getElementById('my_modal')?.showModal()
    // wait for the modal to open
    setTimeout(() => {
      //player.current?.seekTo(0);
      setPlaying(true)
    }, 1000)
  }

  const handleCloseModal = () => {
    const modal = document.getElementById('my_modal')

    if (!modal) {
      return
    }

    //player.current?.seekTo(0);
    setPlaying(false)
    // @ts-ignore
    document.getElementById('my_modal')?.close()
    setPlaying(false)
  }

  return (
    <>
      <button className="btn btn-ghost mr-2" onClick={handleOpenModal}>
        <FontAwesomeIcon icon={faPlayCircle} className="mr-2 text-xl w-6 h-6" />
        Watch Video
      </button>
      <dialog id="my_modal" className="modal modal-middle" onClick={handleCloseModal}>
        <div className="modal-box p-0">
          <ReactPlayer
            src="https://www.youtube.com/watch?v=eJO5HU_7_1w?modestbranding=1&rel=0&showinfo=0&autoplay=1"
            controls={true}
            width="100%"
            playing={playing}
            ref={player}
          />
        </div>
      </dialog>
    </>
  )
}

export default HireMeVideo
