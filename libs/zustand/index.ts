import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SafeUser } from '@/types/user/UserTypes'
import {
  AppLanguage,
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE,
} from '@/types/common/I18nTypes'

import { AppTheme, AVAILABLE_THEMES, DEFAULT_THEME } from '@/types/ui/UITypes'

type GlobalState = {
  user: SafeUser | null
  availableLanguages: readonly AppLanguage[]
  language: AppLanguage
  availableThemes: readonly AppTheme[]
  theme: AppTheme

  setUser: (user: SafeUser | null) => void
  clearUser: () => void

  setLanguage: (language: AppLanguage) => void
  setTheme: (theme: AppTheme) => void
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, _get) => ({
      user: null,
      availableLanguages: AVAILABLE_LANGUAGES,
      availableThemes: AVAILABLE_THEMES,
      language: DEFAULT_LANGUAGE,
      theme: DEFAULT_THEME,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1.2,
    }
  )
)

export default useGlobalStore
