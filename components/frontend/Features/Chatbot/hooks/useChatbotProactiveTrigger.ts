'use client'

import { useEffect, useRef } from 'react'
import { useChatbotStore } from '@/libs/zustand'

interface UseChatbotProactiveTriggerOptions {
  /**
   * Title (or short description) of the current page.
   * Stored in localStorage as `chatbot_page_context` and consumed by the
   * chatbot on the first message to enrich the RAG query.
   */
  pageTitle: string
  /** Delay before the chatbot opens automatically. Default: 30 000 ms (30 s). */
  delayMs?: number
  /**
   * Set to `false` to disable the trigger (e.g. for users who already
   * opened the chatbot or who are on a page where the trigger is not wanted).
   * Default: true.
   */
  enabled?: boolean
}

/**
 * Proactive chatbot trigger (Phase 13).
 *
 * Automatically opens the chatbot while the user has been on the current
 * page for `delayMs` milliseconds AND the page content is visible in the
 * viewport (checked via IntersectionObserver on `[data-chatbot-trigger]`
 * or `document.body` as fallback).
 *
 * The page title is stored in `localStorage` under the key
 * `chatbot_page_context`. The chatbot's `useChatbot.handleSend()` reads and
 * clears this value on the first message, forwarding it to the AI as
 * `page_context` so the RAG query starts with the page's topic.
 *
 * Usage inside a Server Component page (or a client-side page layout):
 * ```tsx
 * import { useChatbotProactiveTrigger } from '@/components/frontend/Features/Chatbot/hooks/useChatbotProactiveTrigger'
 *
 * function BlogPostPage({ title }: { title: string }) {
 *   useChatbotProactiveTrigger({ pageTitle: title })
 *   // …
 * }
 * ```
 */
export function useChatbotProactiveTrigger({
  pageTitle,
  delayMs = 30_000,
  enabled = true,
}: UseChatbotProactiveTriggerOptions): void {
  const { openChatbot, isOpen } = useChatbotStore()
  const triggeredRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Skip if already triggered, chatbot already open, or feature disabled
    if (!enabled || triggeredRef.current || isOpen) return

    let isPageVisible = true // assume visible until observer says otherwise

    // Observe a designated trigger anchor, or fall back to body
    const target =
      document.querySelector<HTMLElement>('[data-chatbot-trigger]') ?? document.body

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        isPageVisible = entry.isIntersecting
      },
      { threshold: 0.1 },
    )
    observerRef.current.observe(target)

    timerRef.current = setTimeout(() => {
      if (!isPageVisible || triggeredRef.current || isOpen) return

      triggeredRef.current = true

      // Persist page context for the first chat message
      try {
        localStorage.setItem('chatbot_page_context', pageTitle)
      } catch { /* ignore storage errors */ }

      openChatbot()
    }, delayMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      observerRef.current?.disconnect()
    }
    // Only re-run if core options change; intentionally omit isOpen to avoid
    // resetting the timer every time the chatbot toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delayMs, pageTitle, openChatbot])
}
