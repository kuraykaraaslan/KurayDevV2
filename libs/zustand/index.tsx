import { create } from 'zustand'
import SessionWithUser from '@/types/SessionWithUser'
import { persist, createJSONStorage } from 'zustand/middleware'

// Zustand store


// @ts-ignore
export const useAuthStore = create<
    {
        session: SessionWithUser | null
        token: string
        setSession: (session: SessionWithUser | undefined) => void
        setToken: (token: string | undefined) => void
        clearSession: () => void
    }>
    // @ts-ignore
    (persist(
        (set, get) => ({
            session: null as SessionWithUser | null,
            token: '',
            setSession: (session: SessionWithUser | undefined) => set({ session }),
            setToken: (token: string | undefined) => set({ token }),
            clearSession: () => set({ session: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    ))


/* session storage key
useAuthStore.subscribe((state) => {
    sessionStorage.setItem('session', JSON.stringify(state.session))
    sessionStorage.setItem('token', state.token || '')
});
*/

export default useAuthStore
