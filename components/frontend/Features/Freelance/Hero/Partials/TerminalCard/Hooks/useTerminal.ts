import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useThemeStore } from '@/libs/zustand'
import { useRouter } from '@/libs/i18n/useI18nRouter'
import { COMMAND_NAMES, resolveCommand } from '../commands'
import { createInitialFs } from '../fileSystem'
import type { TerminalCommandContext, TerminalLineVariant, TerminalScrollbackEntry } from '../types'

const MAX_SCROLLBACK_ENTRIES = 200

function buildSeedScrollback(availabilityText: string): TerminalScrollbackEntry[] {
  return [
    { kind: 'command', text: 'whoami' },
    { kind: 'output', variant: 'default', text: 'kuray karaaslan — software architect & product engineer' },
    { kind: 'command', text: 'status --availability' },
    { kind: 'output', variant: 'success', text: `✓ ${availabilityText}` },
    { kind: 'command', text: 'stack --domains' },
    { kind: 'output', variant: 'default', text: 'saas · iot · bim · real-time' },
  ]
}

export function useTerminal(availabilityText: string) {
  const [scrollback, setScrollback] = useState<TerminalScrollbackEntry[]>(() => buildSeedScrollback(availabilityText))
  const [inputValue, setInputValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [draftBeforeHistory, setDraftBeforeHistory] = useState('')
  const [cwd, setCwd] = useState('~')
  const [fs, setFs] = useState(() => createInitialFs())

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme, availableThemes } = useThemeStore()
  const router = useRouter()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [scrollback])

  function pushLines(lines: string[], variant: TerminalLineVariant = 'default') {
    if (lines.length === 0) return
    setScrollback((prev) =>
      [...prev, ...lines.map((text) => ({ kind: 'output' as const, text, variant }))].slice(-MAX_SCROLLBACK_ENTRIES)
    )
  }

  function executeCommand(raw: string) {
    const trimmed = raw.trim()

    setScrollback((prev) => [...prev, { kind: 'command' as const, text: raw }].slice(-MAX_SCROLLBACK_ENTRIES))

    if (trimmed === '') return

    setHistory((prev) => [...prev, trimmed])

    const [name, ...args] = trimmed.split(/\s+/)
    const command = resolveCommand(name)

    if (!command) {
      pushLines([`sh: ${name}: command not found`], 'error')
      return
    }

    // data-theme/cookie sync happens globally via ThemeButton's effect — setTheme() alone is sufficient here
    const ctx: TerminalCommandContext = {
      cwd,
      fs,
      setCwd,
      setFs,
      history,
      theme,
      availableThemes,
      setTheme,
      openExternal: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
      scrollToContact: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }),
      navigateTo: (path) => router.push(path),
      clearScrollback: () => setScrollback([]),
    }

    const result = command.run(args, ctx)
    pushLines(result.lines, result.variant ?? 'default')
  }

  function navigateHistory(direction: -1 | 1) {
    if (history.length === 0) return

    if (direction === -1) {
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      if (historyIndex === null) setDraftBeforeHistory(inputValue)
      setHistoryIndex(nextIndex)
      setInputValue(history[nextIndex])
      return
    }

    if (historyIndex === null) return
    const nextIndex = historyIndex + 1
    if (nextIndex >= history.length) {
      setHistoryIndex(null)
      setInputValue(draftBeforeHistory)
      return
    }
    setHistoryIndex(nextIndex)
    setInputValue(history[nextIndex])
  }

  function handleTabComplete() {
    const trimmed = inputValue.trimStart()
    if (trimmed === '' || trimmed.includes(' ')) return

    const matches = COMMAND_NAMES.filter((name) => name.startsWith(trimmed))
    if (matches.length === 1) setInputValue(matches[0])
    else if (matches.length > 1) pushLines([matches.join('  ')])
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    setHistoryIndex(null)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      setScrollback([])
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      handleTabComplete()
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      navigateHistory(-1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      navigateHistory(1)
      return
    }

    if (e.key === 'Enter') {
      const submitted = inputValue
      setInputValue('')
      setHistoryIndex(null)
      executeCommand(submitted)
    }
  }

  function handleBodyClick() {
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  return {
    scrollback,
    inputValue,
    inputRef,
    scrollRef,
    handleChange,
    handleKeyDown,
    handleBodyClick,
  }
}
