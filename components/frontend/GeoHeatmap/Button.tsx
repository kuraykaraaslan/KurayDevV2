'use client'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap, faProjectDiagram } from '@fortawesome/free-solid-svg-icons'
import GeoHeatmap from './index'

export default function GeoHeatmapButton() {
  const { open, openModal, closeModal } = useModal()

  return (
    <div className="">
      <button onClick={openModal} className="">
        <FontAwesomeIcon icon={faMap} className="mr-2 text-lg" />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title="Global Visitors Heatmap"
        size="lg" 
        className="!max-w-5xl" 
      >
        <div className="flex items-center justify-center w-full h-[70vh] bg-base-200 rounded-box">
          <GeoHeatmap />
        </div>
      </HeadlessModal>
    </div>
  )
}
