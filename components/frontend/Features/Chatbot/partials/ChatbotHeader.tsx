'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot, faTimes, faTrash, faWifi } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'

interface ChatbotHeaderProps {
  isConnected: boolean
  status: string
  onClear: () => void
  onClose: () => void
}

const ChatbotHeader = ({ isConnected, status, onClear, onClose }: ChatbotHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-content rounded-t-2xl">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faRobot} className="w-5 h-5" />
        <span className="font-semibold text-sm">
          {t('shared.chatbot.title')}
        </span>
        <FontAwesomeIcon
          icon={faWifi}
          className={`w-3 h-3 transition-colors ${isConnected ? 'text-success' : 'text-error/60'}`}
          title={status}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onClear}
          className="btn btn-ghost btn-xs btn-circle text-primary-content"
          aria-label={t('shared.chatbot.clear')}
          title={t('shared.chatbot.clear')}
        >
          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-xs btn-circle text-primary-content"
          aria-label={t('shared.chatbot.close')}
        >
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ChatbotHeader
