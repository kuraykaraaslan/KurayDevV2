import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import {SafeUser} from '@/types/UserTypes';

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

// Extend the store type to include PersistOptions
type GlobalStatePersist = PersistOptions<GlobalState>;

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      user: null,
      availableLanguages: ['en', 'tr', 'de', 'gr', 'et', 'mt', 'th'],
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
      storage: createJSONStorage(() => sessionStorage),
      version: 0.6,
    }
  )
);


export default useGlobalStore
