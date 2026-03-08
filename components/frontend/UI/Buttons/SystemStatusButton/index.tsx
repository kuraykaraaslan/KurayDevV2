'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import SystemStatusModalContent from './content'
import i18n from '@/libs/localize/localize'

export default function SystemStatusButton() {
  const modal = useModal(false)

  return (
    <>
      <button onClick={modal.openModal}
        className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
        aria-label={i18n.t('shared.status.open_status')}
      >
        <FontAwesomeIcon
          icon={faServer}
           className="text-base"
        />
        <span className="text-sm hidden md:inline">{i18n.t('shared.status.title')}</span>
      </button>

      <HeadlessModal
        open={modal.open}
        onClose={modal.closeModal}
        size="md"
        className="!max-w-md"
        title={i18n.t('shared.status.title')}
      >
        <SystemStatusModalContent />
      </HeadlessModal>
    </>
  )
}
