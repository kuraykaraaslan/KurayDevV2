'use client'
import HeadlessModal, { useModal } from '@/components/common/Layout/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons'
import KnowledgeGraph2D from './index'

export default function KnowledgeGraph2DButton() {
  const { open, openModal, closeModal } = useModal()

  return (
    <div className="">
      <button onClick={openModal} className="">
        <FontAwesomeIcon icon={faProjectDiagram} className="mr-2 text-lg" />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title="3D Knowledge Graph"
        size="lg" // modal boyutu daha kontrollü
        className="!max-w-5xl" // genişlik sınırlı
      >
        <div className="flex items-center justify-center w-full h-[70vh] bg-base-200 rounded-box">
          <KnowledgeGraph2D/>
        </div>
      </HeadlessModal>
    </div>
  )
}
