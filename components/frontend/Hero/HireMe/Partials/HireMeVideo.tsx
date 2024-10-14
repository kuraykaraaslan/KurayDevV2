'use client';
import React , { useEffect , createRef } from "react";
import ReactPlayer from 'react-player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons';


const HireMeVideo: React.FC = () => {

    const [playing, setPlaying] = React.useState(false);
    const player = createRef<ReactPlayer>();

    const handleOpenModal = () => {
        const modal = document.getElementById("my_modal");

        if (!modal) {
            return;
        }

        // @ts-ignore
        document.getElementById("my_modal")?.showModal();
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
            <button className="btn btn-ghost mr-2" onClick={handleOpenModal}>
                <FontAwesomeIcon icon={faPlayCircle} className="mr-2 text-xl w-6 h-6" />
                Watch Video
            </button>
            <dialog id="my_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                <ReactPlayer url="https://www.youtube.com/watch?v=uBBDMqZKagY" controls={true} width="100%" playing={playing} ref={player} />
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
};

export default HireMeVideo;