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
      version: 1.3,
    }
  )
)

export default useGlobalStore
