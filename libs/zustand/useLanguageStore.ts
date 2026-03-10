import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE,
  type AppLanguage,
} from '@/types/common/I18nTypes'

// ─── Env-driven config ────────────────────────────────────────────────────────

function parseEnvLanguages(): readonly AppLanguage[] {
  const raw = process.env.NEXT_PUBLIC_I18N_LANGUAGES
  if (!raw) return AVAILABLE_LANGUAGES

  const parsed = raw
    .split(',')
    .map((l) => l.trim().toLowerCase())
    .filter((l): l is AppLanguage =>
      (AVAILABLE_LANGUAGES as readonly string[]).includes(l)
    )

  return parsed.length > 0 ? parsed : AVAILABLE_LANGUAGES
}

function parseEnvDefaultLanguage(): AppLanguage {
  const raw = process.env.NEXT_PUBLIC_I18N_DEFAULT_LANGUAGE?.trim().toLowerCase()
  if (raw && (AVAILABLE_LANGUAGES as readonly string[]).includes(raw)) {
    return raw as AppLanguage
  }
  return DEFAULT_LANGUAGE
}

export const ENV_LANGUAGES: readonly AppLanguage[] = parseEnvLanguages()
export const ENV_DEFAULT_LANGUAGE: AppLanguage = parseEnvDefaultLanguage()

// ─── Store ────────────────────────────────────────────────────────────────────

type LanguageState = {
  lang: AppLanguage
  availableLanguages: readonly AppLanguage[]
  defaultLanguage: AppLanguage
  setLang: (lang: AppLanguage) => void
}

const CURRENT_VERSION = 1

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: ENV_DEFAULT_LANGUAGE,
      availableLanguages: ENV_LANGUAGES,
      defaultLanguage: ENV_DEFAULT_LANGUAGE,
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      partialize: (state) => ({ lang: state.lang }),
      migrate: (persistedState, _version) => {
        const state = persistedState as Partial<LanguageState>
        return { lang: state.lang ?? ENV_DEFAULT_LANGUAGE }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[zustand/language] Rehydration failed, resetting store:', error)
          useLanguageStore.setState({ lang: ENV_DEFAULT_LANGUAGE })
        }
      },
    }
  )
)

export default useLanguageStore
