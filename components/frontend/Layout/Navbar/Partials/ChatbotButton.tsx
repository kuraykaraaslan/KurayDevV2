'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { useChatbotStore } from '@/libs/zustand'

const ChatbotButton = () => {
  const { t } = useTranslation()
  const { isOpen, hasUnread, toggleChatbot } = useChatbotStore()

  return (
    <button
      className="btn btn-square btn-ghost rounded-full relative duration-300"
      onClick={toggleChatbot}
      aria-label={t('shared.chatbot.title')}
    >
      <FontAwesomeIcon
        icon={faRobot}
        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'text-primary scale-110' : ''}`}
      />
      {/* Pulsing dot when there are unread messages */}
      {hasUnread && !isOpen && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
        </span>
      )}
    </button>
  )
}

export default ChatbotButton
