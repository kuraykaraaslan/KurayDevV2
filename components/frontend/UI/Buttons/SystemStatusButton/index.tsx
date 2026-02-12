'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import HeadlessModal, { useModal } from '@/components/common/Layout/Modal'
import SystemStatusModalContent from './content'
import i18n from '@/libs/localize/localize'

export default function SystemStatusButton() {
  const modal = useModal(false)

  return (
    <>
      <button onClick={modal.openModal}>
        <FontAwesomeIcon
          icon={faCircle}
          className={`text-[8px] mr-1 text-gray-300`} // color comes from content
        />
        <span className="text-sm">{i18n.t('shared.status.title')}</span>
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
