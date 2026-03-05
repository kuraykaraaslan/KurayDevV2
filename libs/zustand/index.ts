import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SafeUser } from '@/types/user/UserTypes'
import { AppTheme, AVAILABLE_THEMES, DEFAULT_THEME } from '@/types/ui/UITypes'

type GlobalState = {
  user: SafeUser | null
  availableThemes: readonly AppTheme[]
  theme: AppTheme

  setUser: (user: SafeUser | null) => void
  clearUser: () => void
  setTheme: (theme: AppTheme) => void
}

const CURRENT_VERSION = 1.3

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, _get) => ({
      user: null,
      availableThemes: AVAILABLE_THEMES,
      theme: DEFAULT_THEME,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      migrate: (persistedState, _version) => {
        // Eski versiyonlardan güvenli geçiş: sadece bilinen alanları al
        const state = persistedState as Partial<GlobalState>
        return {
          user: state.user ?? null,
          theme: state.theme ?? DEFAULT_THEME,
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[zustand] Rehydration failed, resetting store:', error)
          useGlobalStore.setState({
            user: null,
            theme: DEFAULT_THEME,
          })
        }
      },
    }
  )
)

export default useGlobalStore
