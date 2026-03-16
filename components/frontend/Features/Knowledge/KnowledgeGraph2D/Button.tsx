'use client'
import { useTranslation } from 'react-i18next'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons'
import KnowledgeGraph2D from './index'

export default function KnowledgeGraph2DButton() {
  const { t } = useTranslation()
  const { open, openModal, closeModal } = useModal()

  return (
    <div className="">
      <button onClick={openModal} className="">
        <FontAwesomeIcon icon={faProjectDiagram} className="me-2 text-lg" />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title={t('frontend.knowledge_graph.title_3d')}
        size="lg" // modal size more controlled
        className="!max-w-5xl" // width limited
      >
        <div className="flex items-center justify-center w-full h-[70vh] bg-base-200 rounded-box">
          <KnowledgeGraph2D />
        </div>
      </HeadlessModal>
    </div>
  )
}
