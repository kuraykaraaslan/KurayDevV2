import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import SessionWithUser from '@/types/SessionWithUser';

type GlobalState = {
  session: SessionWithUser | null;
  token: string;
  availableLanguages: string[];
  language: string;
  availableThemes: string[];
  theme: string;
  setSession: (session: SessionWithUser | undefined) => void;
  setToken: (token: string | undefined) => void;
  clearSession: () => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
};

// Extend the store type to include PersistOptions
type GlobalStatePersist = PersistOptions<GlobalState>;

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      session: null,
      token: '',
      availableLanguages: ['en', 'tr', 'de', 'gr', 'et', 'mt', 'th'],
      availableThemes: ['light', 'dark'],
      language: 'en',
      theme: 'dark',
      setSession: (session) => set({ session: session ?? null }),
      setToken: (token) => set({ token: token ?? '' }),
      clearSession: () => set({ session: null }),
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
