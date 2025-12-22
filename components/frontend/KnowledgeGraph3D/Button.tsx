'use client'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import KnowledgeGraph3D from './index'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'

export default function KnowledgeGraph3DButton() {
  const { t } = useTranslation()
  const { open, openModal, closeModal } = useModal()

  return (
    <div className="">
      <button onClick={openModal} className="">
        <FontAwesomeIcon icon={faProjectDiagram} className="mr-2 text-lg" />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title={t('frontend.knowledge_graph.title_3d')}
        size="lg"
        className="!max-w-5xl"
      >
        <div className="flex items-center justify-center w-full h-[70vh] bg-base-200 rounded-box">
          <KnowledgeGraph3D className="w-full h-full" />
        </div>
      </HeadlessModal>
    </div>
  )
}
