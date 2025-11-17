import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SafeUser } from '@/types/UserTypes';

type GlobalState = {
  user: SafeUser | null;
  availableLanguages: string[];
  language: string;
  availableThemes: string[];
  theme: string;

  setUser: (user: SafeUser | null) => void;
  clearUser: () => void;

  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
};

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, _get) => ({
      user: null,
      availableLanguages: ['en', 'tr', 'de', 'gr', 'et', 'mt', 'th', 'nl', 'uk'],
      availableThemes: ['light', 'dark'],
      language: 'en',
      theme: 'dark',
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => localStorage),
      version: 0.7,
    }
  )
);


export default useGlobalStore
