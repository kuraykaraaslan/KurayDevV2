'use client';
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { createRef, useState } from "react";
import dynamic from "next/dynamic";
import LoadingElement from "@/components/frontend/LoadingElement";

// ⬇️ ReactPlayer artık sadece modal açıldığında yüklenecek
const ReactPlayer = dynamic(() => import("react-player/youtube"), {
  ssr: false,
  loading: () => <LoadingElement title="Video Player" />,
});

const MyImage = () => {
  const [comingSoon] = useState(false);
  const [playing, setPlaying] = useState(false);
  const player = createRef<any>();

  const handleOpenModal = () => {
    const modal = document.getElementById("my_video") as HTMLDialogElement | null;
    if (!modal) return;
    modal.showModal();
    setTimeout(() => {
      player.current?.seekTo(0);
      setPlaying(true);
    }, 600);
  };

  const handleCloseModal = () => {
    const modal = document.getElementById("my_video") as HTMLDialogElement | null;
    if (!modal) return;
    player.current?.seekTo(0);
    setPlaying(false);
    modal.close();
  };

  return (
    <>
      <div className="relative w-full h-full flex flex-col" onClick={handleOpenModal}>
        <FontAwesomeIcon icon={faPlayCircle} className="text-white w-16 h-16 m-auto" />
      </div>

      <dialog id="my_video" className="modal modal-middle" onClick={handleCloseModal}>
        <div className="modal-box p-0">
          {!comingSoon ? (
            <ReactPlayer
              url="https://www.youtube.com/watch?v=oJN50oOlW-c?modestbranding=1&rel=0&showinfo=0"
              controls
              width="100%"
              playing={playing}
              ref={player}
            />
          ) : (
            <div className="w-full h-[200px] flex flex-col">
              <div className="m-auto text-center">A video is coming soon! Stay tuned!</div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
};

export default MyImage;
