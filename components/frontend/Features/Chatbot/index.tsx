'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { ChatMessageList } from '@/components/common/UI/Chat'
import { useChatbot } from './useChatbot'
import ChatbotHeader from './ChatbotHeader'
import ChatbotSources from './ChatbotSources'
import ChatbotInputBar from './ChatbotInputBar'

const Chatbot = () => {
  const { t } = useTranslation()
  const {
    user,
    isOpen,
    messages,
    input,
    isLoading,
    sources,
    sessionClosed,
    isConnected,
    status,
    setInput,
    handleSend,
    handleClear,
    closeChatbot,
  } = useChatbot()

  if (!user) return null

  return (
    <>
      {isOpen && (
        <div
          className="fixed z-[104] bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            right: '20px',
            bottom: '20px',
            width: 'min(380px, calc(100vw - 40px))',
            height: 'min(520px, calc(100vh - 100px))',
          }}
        >
          <ChatbotHeader
            isConnected={isConnected}
            status={status}
            onClear={handleClear}
            onClose={closeChatbot}
          />

          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            loadingText={t('shared.chatbot.thinking')}
            emptyContent={
              <div className="text-center text-base-content/50 mt-8 px-4">
                <FontAwesomeIcon icon={faRobot} className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('shared.chatbot.welcome_message')}</p>
              </div>
            }
          />

          <ChatbotSources sources={sources} />

          <ChatbotInputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            isLoading={isLoading}
            sessionClosed={sessionClosed}
            isConnected={isConnected}
            isOpen={isOpen}
          />
        </div>
      )}
    </>
  )
}

export default Chatbot
