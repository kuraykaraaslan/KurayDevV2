import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SafeUser } from '@/types/user/UserTypes'

type UserState = {
  user: SafeUser | null
  setUser: (user: SafeUser | null) => void
  clearUser: () => void
}

const CURRENT_VERSION = 1

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      migrate: (persistedState, _version) => {
        const state = persistedState as Partial<UserState>
        return {
          user: state.user ?? null,
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[zustand/user] Rehydration failed, resetting store:', error)
          useUserStore.setState({ user: null })
        }
      },
    }
  )
)

export default useUserStore
