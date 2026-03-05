'use client'

import type { ChatSource } from '@/types/features/ChatbotTypes'
import { useTranslation } from 'react-i18next'

interface ChatbotSourcesProps {
  sources: ChatSource[]
}

const ChatbotSources = ({ sources }: ChatbotSourcesProps) => {
  const { t } = useTranslation()

  if (sources.length === 0) return null

  return (
    <div className="px-4 py-2 border-t border-base-300 bg-base-200/50">
      <p className="text-xs font-semibold text-base-content/70 mb-1">
        {t('shared.chatbot.sources')}
      </p>
      <div className="flex flex-wrap gap-1">
        {sources.map((source) => (
          <a
            key={source.postId}
            href={`/en/blog/${source.categorySlug}/${source.slug}`}
            className="text-xs text-primary hover:underline bg-base-100 px-2 py-0.5 rounded-full border border-base-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            {source.title}
          </a>
        ))}
      </div>
    </div>
  )
}

export default ChatbotSources
