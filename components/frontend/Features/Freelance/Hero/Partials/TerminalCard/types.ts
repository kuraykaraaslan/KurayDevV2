import type { AppTheme } from '@/types/ui/UITypes'

export type TerminalLineVariant = 'default' | 'success' | 'error'

export interface TerminalCommandLine {
  kind: 'command'
  text: string
}

export interface TerminalOutputLine {
  kind: 'output'
  text: string
  variant: TerminalLineVariant
}

export type TerminalScrollbackEntry = TerminalCommandLine | TerminalOutputLine

export interface FsFile {
  type: 'file'
  name: string
  content: string[]
}

export interface FsDirectory {
  type: 'dir'
  name: string
  children: Record<string, FsNode>
}

export type FsNode = FsFile | FsDirectory

export type FsMutationResult = { ok: true; fs: FsDirectory } | { ok: false; error: string }

export type TerminalCommandCategory = 'portfolio' | 'system'

export interface TerminalCommandResult {
  lines: string[]
  variant?: TerminalLineVariant
}

export interface TerminalCommandContext {
  // Filesystem
  cwd: string
  fs: FsDirectory
  setCwd: (path: string) => void
  setFs: (fs: FsDirectory) => void

  // History
  history: string[]

  // Theme
  theme: AppTheme
  availableThemes: readonly AppTheme[]
  setTheme: (theme: AppTheme) => void

  // Navigation / external side effects
  openExternal: (url: string) => void
  scrollToContact: () => void
  navigateTo: (path: string) => void

  // Scrollback control
  clearScrollback: () => void
}

export type TerminalCommandHandler = (args: string[], ctx: TerminalCommandContext) => TerminalCommandResult

export interface TerminalCommand {
  description: string
  usage?: string
  category: TerminalCommandCategory
  aliases?: string[]
  run: TerminalCommandHandler
}
