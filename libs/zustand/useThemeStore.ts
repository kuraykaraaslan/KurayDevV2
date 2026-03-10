import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AppTheme, AVAILABLE_THEMES, DEFAULT_THEME } from '@/types/ui/UITypes'

type ThemeState = {
  availableThemes: readonly AppTheme[]
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const CURRENT_VERSION = 1

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      availableThemes: AVAILABLE_THEMES,
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      migrate: (persistedState, _version) => {
        const state = persistedState as Partial<ThemeState>
        return {
          theme: state.theme ?? DEFAULT_THEME,
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[zustand/theme] Rehydration failed, resetting store:', error)
          useThemeStore.setState({ theme: DEFAULT_THEME })
        }
      },
    }
  )
)

export default useThemeStore
