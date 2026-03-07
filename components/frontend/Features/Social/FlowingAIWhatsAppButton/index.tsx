'use client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faRobot } from '@fortawesome/free-solid-svg-icons'
import { useChatbotStore } from '@/libs/zustand/chatbotStore'

const FlowingAIWhatsAppButton = () => {
  const { t } = useTranslation()
  const { toggleChatbot, hasUnread } = useChatbotStore()

  useEffect(() => {
    const btn = document.getElementById('whatsapp') as HTMLElement

    window.addEventListener('scroll', () => {
      let aligned = window.scrollY * 0.1 - 80
      if (aligned > 20) aligned = 20
      btn.style.right = aligned + 'px'

      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        btn.style.display = 'flex'
      } else {
        btn.style.display = 'none'
      }

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        const diff = window.innerHeight + window.scrollY - document.body.offsetHeight + 50
        btn.style.bottom = diff + 100 + 'px'
      } else {
        btn.style.bottom = '100px'
      }
    })
  }, [])

  return (
    <div
      id="whatsapp"
      className="fixed flex overflow-hidden shadow-lg transition duration-1000 ease-in-out"
      style={{
        zIndex: 103,
        right: '-160px',
        bottom: '100px',
        width: '64px',
        height: '64px',
        borderRadius: '9999px'
      }}
    >

      {/* AI */}
      <button
        aria-label={t('frontend.open_ai_assistant')}
        onClick={toggleChatbot}
        className="w-1/2 h-full flex items-center justify-center bg-accent hover:bg-accent/70 relative"
      >
        <FontAwesomeIcon icon={faRobot} className="w-5 h-5 text-white" />

        {hasUnread && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        )}
      </button>

      {/* WhatsApp */}
      <button
        aria-label={t('frontend.chat_on_whatsapp')}
        onClick={() => window.open('https://wa.me/905459223554')}
        className="w-1/2 h-full flex items-center justify-center bg-[#25D366] hover:bg-[#25D366]/70"
      >
        <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5 text-white" />
      </button>

    </div>
  )
}

export default FlowingAIWhatsAppButton