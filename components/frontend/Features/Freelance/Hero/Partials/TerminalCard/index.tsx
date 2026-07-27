'use client'

import { useTranslation } from 'react-i18next'
import { useTerminal } from './Hooks/useTerminal'
import type { TerminalLineVariant } from './types'

function outputClassName(variant: TerminalLineVariant) {
  if (variant === 'success') return 'ps-4 text-success'
  if (variant === 'error') return 'ps-4 text-error'
  return 'ps-4 opacity-80'
}

const TerminalCard = () => {
  const { t } = useTranslation()
  const { scrollback, inputValue, inputRef, scrollRef, handleChange, handleKeyDown, handleBodyClick } = useTerminal(
    t('pages.freelance.hero.availability')
  )

  return (
    <div className="hidden lg:block w-full max-w-md rounded-none border border-base-300 bg-base-300 shadow-2xl overflow-hidden font-mono text-sm">
      <div className="flex items-center gap-2 border-b border-base-content/10 bg-base-100 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
        <span className="ms-2 text-xs opacity-60">availability.sh</span>
      </div>
      <div
        ref={scrollRef}
        onClick={handleBodyClick}
        dir="ltr"
        className="p-6 space-y-2 leading-relaxed h-96 overflow-y-auto"
      >
        {scrollback.map((line, index) =>
          line.kind === 'command' ? (
            <p key={index} className={index === 0 ? undefined : 'pt-3'}>
              <span className="text-primary">$</span> {line.text}
            </p>
          ) : (
            <p key={index} className={outputClassName(line.variant)}>
              {line.text}
            </p>
          )
        )}

        <p className="flex items-center gap-1 pt-3">
          <span className="text-primary">$</span>
          <span className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none caret-transparent"
              aria-label="Terminal command input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <span
              className="pointer-events-none absolute inline-block h-4 w-2 animate-pulse bg-base-content"
              style={{ left: `${inputValue.length}ch` }}
              aria-hidden="true"
            />
          </span>
        </p>
      </div>
    </div>
  )
}

export default TerminalCard
