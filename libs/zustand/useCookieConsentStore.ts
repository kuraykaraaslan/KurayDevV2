import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CookieConsentStatus = 'accepted' | 'declined' | undefined

type CookieConsentState = {
  status: CookieConsentStatus
  setStatus: (status: CookieConsentStatus) => void
  accept: () => void
  decline: () => void
}

const CURRENT_VERSION = 1

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      status: undefined,
      setStatus: (status) => set({ status }),
      accept: () => set({ status: 'accepted' }),
      decline: () => set({ status: 'declined' }),
    }),
    {
      name: 'cookie-consent-storage',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      migrate: (_persistedState, _version) => {
        // Reset to default on version mismatch
        return { status: undefined }
      },
    }
  )
)

export default useCookieConsentStore
