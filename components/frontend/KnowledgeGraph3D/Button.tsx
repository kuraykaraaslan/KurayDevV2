'use client'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import KnowledgeGraph3D from './index'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons'

export default function KnowledgeGraph3DButton() {
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
          <KnowledgeGraph3D className="w-full h-full" />
        </div>
      </HeadlessModal>
    </div>
  )
}
