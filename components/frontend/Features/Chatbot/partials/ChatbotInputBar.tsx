'use client'

import { useTranslation } from 'react-i18next'
import { ChatInput } from '@/components/common/UI/Chat'

interface ChatbotInputBarProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
  sessionClosed: boolean
  isConnected: boolean
  isOpen: boolean
}

const ChatbotInputBar = ({
  value,
  onChange,
  onSend,
  isLoading,
  sessionClosed,
  isConnected,
  isOpen,
}: ChatbotInputBarProps) => {
  const { t } = useTranslation()

  return (
    <div className="px-3 py-2 border-t border-base-300 bg-base-100">
      <ChatInput
        value={value}
        onChange={onChange}
        onSend={onSend}
        disabled={isLoading || sessionClosed || !isConnected}
        placeholder={
          sessionClosed
            ? t('shared.chatbot.session_closed')
            : !isConnected
              ? t('shared.chatbot.connecting') ?? 'Connecting...'
              : t('shared.chatbot.placeholder')
        }
        autoFocusTrigger={isOpen}
        variant="compact"
      />
    </div>
  )
}

export default ChatbotInputBar
