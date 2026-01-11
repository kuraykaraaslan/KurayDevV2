'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { HeadlessModal } from '@/components/common/Layout/Modal';

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

export interface TranslateRequest {
  sourceLang: string;
  targetLang: string;
  fields: string[];
}

export const TRANSLATABLE_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
  { key: 'keywords', label: 'Keywords' },
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
  /** Optional callback for translation requests */
  onTranslateRequest?: (request: TranslateRequest) => void;
  /** Whether translation is in progress */
  isTranslating?: boolean;
  /** Available fields for translation (defaults to all) */
  availableFields?: string[];
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
  onTranslateRequest,
  isTranslating = false,
  availableFields,
  className = '',
  cardBgClass = 'bg-base-200',
  buttonBgClass = 'bg-base-100',
}: LanguageSelectorProps) => {

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
  const availableLanguages = SUPPORTED_LANGUAGES.filter(l => !activeLanguages.includes(l.code));

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetLang: string } | null>(null);
  const [translateModal, setTranslateModal] = useState<{ sourceLang: string; targetLang: string } | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Get fields to show based on availableFields prop
  const fieldsToShow = availableFields
    ? TRANSLATABLE_FIELDS.filter(f => availableFields.includes(f.key))
    : TRANSLATABLE_FIELDS;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemove = useCallback((e: React.MouseEvent, langCode: string) => {
    e.stopPropagation();
    onRemoveLanguage(langCode);
  }, [onRemoveLanguage]);

  const handleContextMenu = useCallback((e: React.MouseEvent, langCode: string) => {
    if (!onTranslateRequest || activeLanguages.length < 2) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetLang: langCode });
  }, [onTranslateRequest, activeLanguages.length]);

  const openTranslateModal = useCallback((sourceLang: string, targetLang: string) => {
    setContextMenu(null);
    setSelectedFields(fieldsToShow.map(f => f.key)); // Select all by default
    setTranslateModal({ sourceLang, targetLang });
  }, [fieldsToShow]);

  const handleTranslate = useCallback(() => {
    if (!translateModal || !onTranslateRequest || selectedFields.length === 0) return;
    onTranslateRequest({
      sourceLang: translateModal.sourceLang,
      targetLang: translateModal.targetLang,
      fields: selectedFields,
    });
    setTranslateModal(null);
  }, [translateModal, onTranslateRequest, selectedFields]);

  const toggleField = useCallback((fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  }, []);

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
                  onContextMenu={(e) => handleContextMenu(e, langCode)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                    transition-all duration-200 ease-out
                    ${isActive
                      ? 'bg-primary text-primary-content shadow-md scale-[1.02]'
                      : `${buttonBgClass} hover:bg-base-300 text-base-content/80 hover:text-base-content`
                    }
                    ${isTranslating ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  disabled={isTranslating}
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
          <div className="flex-1">
            <p className="text-sm font-medium">
              Editing in {currentLanguage?.label}
            </p>
            <p className="text-xs opacity-50">
              {onTranslateRequest ? 'Right-click on a language to translate' : 'Changes will be saved for this language only'}
            </p>
          </div>
          {isTranslating && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <span className="loading loading-spinner loading-sm"></span>
              Translating...
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-base-100 rounded-lg shadow-xl border border-base-300 py-2 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide opacity-50 border-b border-base-300 mb-1">
            Translate to {SUPPORTED_LANGUAGES.find(l => l.code === contextMenu.targetLang)?.label}
          </div>
          {activeLanguages
            .filter(lang => lang !== contextMenu.targetLang)
            .map(sourceLang => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang);
              const status = getTranslationStatus(sourceLang);
              return (
                <button
                  key={sourceLang}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-3 text-sm"
                  onClick={() => openTranslateModal(sourceLang, contextMenu.targetLang)}
                  disabled={status === 'empty'}
                >
                  <span className="text-lg">{lang?.flag}</span>
                  <span className="flex-1">From {lang?.label}</span>
                  {status === 'empty' && (
                    <span className="text-xs opacity-50">(empty)</span>
                  )}
                </button>
              );
            })}
        </div>
      )}

      {/* Translate Modal */}
      <HeadlessModal
        open={!!translateModal}
        onClose={() => setTranslateModal(null)}
        title={
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Translate Content
          </span>
        }
        description={translateModal && (
          <span>
            {SUPPORTED_LANGUAGES.find(l => l.code === translateModal.sourceLang)?.flag}{' '}
            {SUPPORTED_LANGUAGES.find(l => l.code === translateModal.sourceLang)?.label}
            {' → '}
            {SUPPORTED_LANGUAGES.find(l => l.code === translateModal.targetLang)?.flag}{' '}
            {SUPPORTED_LANGUAGES.find(l => l.code === translateModal.targetLang)?.label}
          </span>
        )}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm opacity-70">Select fields to translate:</p>
          <div className="space-y-2">
            {fieldsToShow.map(field => (
              <label
                key={field.key}
                className="flex items-center gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={selectedFields.includes(field.key)}
                  onChange={() => toggleField(field.key)}
                />
                <span className="font-medium">{field.label}</span>
              </label>
            ))}
          </div>

          {/* Select All / None */}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() => setSelectedFields(fieldsToShow.map(f => f.key))}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() => setSelectedFields([])}
            >
              Select None
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={() => setTranslateModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={handleTranslate}
              disabled={selectedFields.length === 0}
            >
              Translate ({selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''})
            </button>
          </div>
        </div>
      </HeadlessModal>
    </div>
  );
};

export default LanguageSelector;
