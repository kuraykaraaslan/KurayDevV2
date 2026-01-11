'use client';

import { useCallback } from 'react';

export type TranslationStatus = 'complete' | 'partial' | 'empty';

export interface Language {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

interface LanguageSelectorProps {
  /** Currently selected language code */
  currentLang: string;
  /** Callback when language is changed */
  onLanguageChange: (langCode: string) => void;
  /** List of active language codes */
  activeLanguages: string[];
  /** Callback when a new language is added */
  onAddLanguage: (langCode: string) => void;
  /** Callback when a language is removed */
  onRemoveLanguage: (langCode: string) => void;
  /** Function to get translation status for a language */
  getTranslationStatus: (langCode: string) => TranslationStatus;
  /** Optional custom class name */
  className?: string;
  /** Optional card background class */
  cardBgClass?: string;
  /** Optional button background class for inactive buttons */
  buttonBgClass?: string;
}

const LanguageSelector = ({
  currentLang,
  onLanguageChange,
  activeLanguages,
  onAddLanguage,
  onRemoveLanguage,
  getTranslationStatus,
  className = '',
  cardBgClass = 'bg-base-200',
  buttonBgClass = 'bg-base-100',
}: LanguageSelectorProps) => {

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
  const availableLanguages = SUPPORTED_LANGUAGES.filter(l => !activeLanguages.includes(l.code));

  const handleRemove = useCallback((e: React.MouseEvent, langCode: string) => {
    e.stopPropagation();
    onRemoveLanguage(langCode);
  }, [onRemoveLanguage]);

  return (
    <div className={`card ${cardBgClass} shadow-sm mb-6 ${className}`}>
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70">
            Translations
          </h3>
          <div className="flex items-center gap-3 text-xs opacity-60">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Complete
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-base-300 border border-base-content/20"></span>
              Empty
            </span>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap gap-1">
          {activeLanguages.map((langCode) => {
            const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
            const status = getTranslationStatus(langCode);
            const isActive = currentLang === langCode;

            return (
              <div key={langCode} className="relative group">
                <button
                  type="button"
                  onClick={() => onLanguageChange(langCode)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                    transition-all duration-200 ease-out
                    ${isActive
                      ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
                      : `${buttonBgClass} hover:bg-base-300 text-base-content/80 hover:text-base-content`
                    }
                  `}
                >
                  <span className="text-lg">{lang?.flag || '🌐'}</span>
                  <span>{lang?.label || langCode.toUpperCase()}</span>

                  {/* Status indicator */}
                  <span className={`
                    w-2 h-2 rounded-full ml-1
                    ${status === 'complete' ? 'bg-success' : ''}
                    ${status === 'partial' ? 'bg-warning' : ''}
                    ${status === 'empty' ? 'bg-base-300 border border-current opacity-30' : ''}
                  `}></span>

                  {/* Active indicator line */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-content/50 rounded-full"></span>
                  )}
                </button>

                {/* Remove button */}
                {activeLanguages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, langCode)}
                    className="
                      absolute -top-1.5 -right-1.5 w-5 h-5
                      flex items-center justify-center
                      bg-error text-error-content text-xs rounded-full
                      opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100
                      transition-all duration-150 shadow-sm
                      hover:bg-error-focus
                    "
                    title={`Remove ${lang?.label}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Add language button */}
          {availableLanguages.length > 0 && (
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-lg
                  border-2 border-dashed border-base-content/20
                  text-base-content/50 hover:text-base-content hover:border-base-content/40
                  cursor-pointer transition-all duration-200
                  text-sm font-medium
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Language
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-xl w-56 mt-2 border border-base-300"
              >
                {availableLanguages.map((lang) => (
                  <li key={lang.code}>
                    <button
                      type="button"
                      onClick={() => onAddLanguage(lang.code)}
                      className="flex items-center gap-3 py-2"
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Current language indicator */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-base-300">
          <span className="text-2xl">{currentLanguage?.flag}</span>
          <div>
            <p className="text-sm font-medium">
              Editing in {currentLanguage?.label}
            </p>
            <p className="text-xs opacity-50">
              Changes will be saved for this language only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
