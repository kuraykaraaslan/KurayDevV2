import { create } from 'zustand'

type ChatbotState = {
  isOpen: boolean
  hasUnread: boolean
  toggleChatbot: () => void
  openChatbot: () => void
  closeChatbot: () => void
  setHasUnread: (v: boolean) => void
}

/**
 * Non-persisted store for chatbot UI state.
 * Shared between navbar button and chat window.
 */
export const useChatbotStore = create<ChatbotState>((set) => ({
  isOpen: false,
  hasUnread: false,
  toggleChatbot: () => set((s) => ({ isOpen: !s.isOpen, hasUnread: s.isOpen ? s.hasUnread : false })),
  openChatbot: () => set({ isOpen: true, hasUnread: false }),
  closeChatbot: () => set({ isOpen: false }),
  setHasUnread: (v) => set({ hasUnread: v }),
}))
