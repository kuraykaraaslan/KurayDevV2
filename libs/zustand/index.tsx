'use client';
import { create } from 'zustand'
import SessionWithUser from '@/types/SessionWithUser'
import { persist, createJSONStorage } from 'zustand/middleware'
import {PersistOptions} from "zustand/middleware";
// @ts-ignore
export const useGlobalStore = create<
    {
        session: SessionWithUser | null
        token: string
        availableLanguages: string[]
        language: string
        availableThemes: string[]
        theme: string 
        setSession: (session: SessionWithUser | undefined) => void
        setToken: (token: string | undefined) => void
        clearSession: () => void
        setLanguage: (language: string) => void
        setTheme: (theme: string) => void
    }>
    // @ts-ignore
    (persist(
        (set, get) => ({
            session: null as SessionWithUser | null,
            token: '',
            availableLanguages: ['en', 'tr', 'de', 'gr'],
            availableThemes: ['light', 'dark', 'black'],
            language: 'en',
            theme: 'dark',
            setSession: (session: SessionWithUser | undefined) => set({ session }),
            setToken: (token: string | undefined) => set({ token }),
            clearSession: () => set({ session: null }),
            setLanguage: (language: string) => set({ language }),
            setTheme: (theme: string) => set({ theme }),
        }),
        {
            name: 'global-storage',
            storage: createJSONStorage(() => sessionStorage),
            version: 0.5,
        }
    ))


export default useGlobalStore
