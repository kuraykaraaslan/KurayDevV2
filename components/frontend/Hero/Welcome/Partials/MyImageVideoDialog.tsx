'use client';
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { createRef } from "react";
import ReactPlayer from "react-player";

const MyImage = () => {

  const [playing, setPlaying] = React.useState(false);
  const player = createRef<ReactPlayer>();

  const handleOpenModal = () => {
    const modal = document.getElementById("my_modal");

    if (!modal) {
      return;
    }

    // @ts-ignore
    document.getElementById("my_modal")?.showModal();

    // wait for the modal to open
    setTimeout(() => {
      player.current?.seekTo(0);
      setPlaying(true);
    }, 1000);

  }

  const handleCloseModal = () => {
    const modal = document.getElementById("my_modal");

    if (!modal) {
      return;
    }

    player.current?.seekTo(0);
    setPlaying(false);
    // @ts-ignore
    document.getElementById("my_modal")?.close();
    setPlaying(false);
  }


  return (
    <>
      <div className="relative w-full h-full flex flex-col" onClick={handleOpenModal}>
        <FontAwesomeIcon icon={faPlayCircle} className="text-white w-16 h-16 m-auto" />
      </div>
      <dialog id="my_modal" className="modal modal-middle" onClick={handleCloseModal}>
        <div className="modal-box p-0">
          <ReactPlayer url="https://www.youtube.com/watch?v=eJO5HU_7_1w?modestbranding=1&rel=0&showinfo=0&autoplay=1" controls={true} width="100%" playing={playing} ref={player} />
        </div>
      </dialog>
    </>
  );
};

export default MyImage;