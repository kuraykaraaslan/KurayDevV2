import { AVAILABLE_THEMES, type AppTheme } from '@/types/ui/UITypes'
import { formatLsLine, getNode, listDir, mkdir, removeFile, resolvePath, touch } from './fileSystem'
import type { TerminalCommand, TerminalCommandContext } from './types'

function isAppTheme(value: string): value is AppTheme {
  return (AVAILABLE_THEMES as readonly string[]).includes(value)
}

const OPEN_HANDLERS: Record<string, (ctx: TerminalCommandContext) => void> = {
  github: (ctx) => ctx.openExternal('https://github.com/kuraykaraaslan'),
  linkedin: (ctx) => ctx.openExternal('https://www.linkedin.com/in/kuraykaraaslan/'),
  twitter: (ctx) => ctx.openExternal('https://twitter.com/kuraykaraaslan'),
  x: (ctx) => ctx.openExternal('https://twitter.com/kuraykaraaslan'),
  telegram: (ctx) => ctx.openExternal('https://t.me/kuraykaraaslan'),
  contact: (ctx) => ctx.scrollToContact(),
  projects: (ctx) => ctx.navigateTo('/projects'),
}

export const COMMANDS: Record<string, TerminalCommand> = {
  // ── Portfolio ────────────────────────────────────────────────────────────

  whoami: {
    description: 'show who you are talking to',
    category: 'portfolio',
    run: () => ({ lines: ['kuray karaaslan — software architect & product engineer'] }),
  },

  about: {
    description: 'short bio',
    category: 'portfolio',
    run: () => ({
      lines: [
        'Software architect and product engineer building production-grade',
        'SaaS, IoT, BIM, and real-time platforms.',
      ],
    }),
  },

  status: {
    description: 'current availability',
    category: 'portfolio',
    run: () => ({
      lines: ['✓ Open to selective engagements — full-time, contract, or advisory.'],
      variant: 'success',
    }),
  },

  stack: {
    description: 'domains worked in',
    category: 'portfolio',
    run: () => ({ lines: ['saas · iot · bim · real-time'] }),
  },

  skills: {
    description: 'grouped technical skills',
    category: 'portfolio',
    run: () => ({
      lines: [
        'foundations   clean code, authentication & security',
        'backend       rest api design, sql data modeling, multi-tenant saas, caching (redis), payment systems',
        'delivery      testing & ci/cd, performance optimization, cloud infrastructure, event-driven architecture, domain-driven design',
      ],
    }),
  },

  projects: {
    description: 'what kind of projects I take on',
    category: 'portfolio',
    run: () => ({
      lines: ['saas, iot, bim, and real-time platforms — see: cat projects/*.md', "or run 'open projects' for full case studies."],
    }),
  },

  contact: {
    description: 'how to reach out',
    category: 'portfolio',
    run: () => ({
      lines: ["run 'open contact' to jump to the contact form, or 'open github' to reach out directly."],
    }),
  },

  social: {
    description: 'social links',
    category: 'portfolio',
    run: () => ({
      lines: [
        'github    github.com/kuraykaraaslan',
        'linkedin  linkedin.com/in/kuraykaraaslan',
        'twitter   twitter.com/kuraykaraaslan',
        'telegram  t.me/kuraykaraaslan',
      ],
    }),
  },

  resume: {
    description: 'resume / cv',
    category: 'portfolio',
    aliases: ['cv'],
    run: () => ({
      lines: ["no public resume link right now — run 'contact' or 'open github' to reach out directly."],
    }),
  },

  open: {
    description: 'open a link or section',
    usage: 'open <github|linkedin|twitter|telegram|contact|projects>',
    category: 'portfolio',
    run: (args, ctx) => {
      const target = args[0]
      const handler = target ? OPEN_HANDLERS[target] : undefined
      if (!handler) {
        return {
          lines: [`open: unknown target '${target ?? ''}' — try: github, linkedin, twitter, telegram, contact, projects`],
          variant: 'error',
        }
      }
      handler(ctx)
      return { lines: [] }
    },
  },

  theme: {
    description: 'view or set the site theme',
    usage: 'theme [light|dark]',
    category: 'portfolio',
    run: (args, ctx) => {
      const requested = args[0]
      if (!requested) {
        return { lines: [`current theme: ${ctx.theme}`, `available: ${ctx.availableThemes.join(', ')}`] }
      }
      if (!isAppTheme(requested)) {
        return {
          lines: [`theme: unknown value '${requested}' — try: ${ctx.availableThemes.join(', ')}`],
          variant: 'error',
        }
      }
      ctx.setTheme(requested)
      return { lines: [`theme set to ${requested}`], variant: 'success' }
    },
  },

  banner: {
    description: 'system-ish splash banner',
    category: 'portfolio',
    aliases: ['neofetch'],
    run: (_args, ctx) => ({
      lines: [
        'kuray@freelance',
        '───────────────',
        'role     software architect & product engineer',
        'stack    saas · iot · bim · real-time',
        `theme    ${ctx.theme}`,
        'status   available for select engagements',
      ],
    }),
  },

  sudo: {
    description: 'run a command as another user',
    category: 'portfolio',
    run: () => ({
      lines: ['kuray is not in the sudoers file. This incident will be reported.'],
      variant: 'error',
    }),
  },

  exit: {
    description: 'close the terminal',
    category: 'portfolio',
    aliases: ['logout'],
    run: () => ({ lines: ["this terminal doesn't have a door — just scroll on."] }),
  },

  // ── System ───────────────────────────────────────────────────────────────

  ls: {
    description: 'list directory contents',
    usage: 'ls [path]',
    category: 'system',
    run: (args, ctx) => {
      const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd
      const node = getNode(ctx.fs, target)
      if (!node) return { lines: [`ls: cannot access '${args[0]}': No such file or directory`], variant: 'error' }
      if (node.type === 'file') return { lines: [node.name] }
      return { lines: listDir(node).map(formatLsLine) }
    },
  },

  cd: {
    description: 'change the working directory',
    usage: 'cd [path]',
    category: 'system',
    run: (args, ctx) => {
      const target = args[0] ? resolvePath(ctx.cwd, args[0]) : '~'
      const node = getNode(ctx.fs, target)
      if (!node) return { lines: [`sh: cd: ${args[0]}: No such file or directory`], variant: 'error' }
      if (node.type === 'file') return { lines: [`sh: cd: ${args[0]}: Not a directory`], variant: 'error' }
      ctx.setCwd(target)
      return { lines: [] }
    },
  },

  pwd: {
    description: 'print working directory',
    category: 'system',
    run: (_args, ctx) => ({ lines: [ctx.cwd] }),
  },

  cat: {
    description: 'print file contents',
    usage: 'cat <file>',
    category: 'system',
    run: (args, ctx) => {
      if (!args[0]) return { lines: ['cat: missing file operand'], variant: 'error' }
      const target = resolvePath(ctx.cwd, args[0])
      const node = getNode(ctx.fs, target)
      if (!node) return { lines: [`cat: ${args[0]}: No such file or directory`], variant: 'error' }
      if (node.type === 'dir') return { lines: [`cat: ${args[0]}: Is a directory`], variant: 'error' }
      return { lines: node.content }
    },
  },

  echo: {
    description: 'echo arguments back',
    usage: 'echo <text>',
    category: 'system',
    run: (args) => ({ lines: [args.join(' ')] }),
  },

  clear: {
    description: 'clear the screen',
    category: 'system',
    run: (_args, ctx) => {
      ctx.clearScrollback()
      return { lines: [] }
    },
  },

  date: {
    description: 'print the current date and time',
    category: 'system',
    run: () => ({ lines: [new Date().toString()] }),
  },

  history: {
    description: 'list previously run commands',
    category: 'system',
    run: (_args, ctx) => ({
      lines: ctx.history.length ? ctx.history.map((cmd, i) => `${i + 1}  ${cmd}`) : ['history: no commands yet'],
    }),
  },

  man: {
    description: 'show usage for a command',
    usage: 'man <command>',
    category: 'system',
    run: (args) => {
      const name = args[0]
      if (!name) return { lines: ['what manual page do you want?'], variant: 'error' }
      const command = resolveCommand(name)
      if (!command) return { lines: [`No manual entry for ${name}`], variant: 'error' }
      return { lines: [command.usage ?? name, command.description] }
    },
  },

  which: {
    description: 'resolve a command name',
    usage: 'which <command>',
    category: 'system',
    run: (args) => {
      const name = args[0]
      if (!name) return { lines: ['which: missing operand'], variant: 'error' }
      if (!resolveCommand(name)) return { lines: [`which: no ${name} in (/usr/bin)`], variant: 'error' }
      return { lines: [`/usr/bin/${name}`] }
    },
  },

  uname: {
    description: 'print system information',
    usage: 'uname [-a]',
    category: 'system',
    run: (args) => ({
      lines: [args[0] === '-a' ? 'KurayOS 6.9.0-freelance x86_64 GNU/Linux' : 'KurayOS'],
    }),
  },

  env: {
    description: 'print environment variables',
    category: 'system',
    run: () => ({
      lines: ['USER=guest', 'HOME=~', 'SHELL=/bin/kuray-sh', 'NODE_ENV=production', 'LANG=en_US.UTF-8'],
    }),
  },

  mkdir: {
    description: 'create a directory',
    usage: 'mkdir <name>',
    category: 'system',
    run: (args, ctx) => {
      const result = mkdir(ctx.fs, ctx.cwd, args[0] ?? '')
      if (!result.ok) return { lines: [result.error], variant: 'error' }
      ctx.setFs(result.fs)
      return { lines: [] }
    },
  },

  touch: {
    description: 'create an empty file',
    usage: 'touch <name>',
    category: 'system',
    run: (args, ctx) => {
      const result = touch(ctx.fs, ctx.cwd, args[0] ?? '')
      if (!result.ok) return { lines: [result.error], variant: 'error' }
      ctx.setFs(result.fs)
      return { lines: [] }
    },
  },

  rm: {
    description: 'remove a file',
    usage: 'rm <name>',
    category: 'system',
    run: (args, ctx) => {
      const result = removeFile(ctx.fs, ctx.cwd, args[0] ?? '')
      if (!result.ok) return { lines: [result.error], variant: 'error' }
      ctx.setFs(result.fs)
      return { lines: [] }
    },
  },

  help: {
    description: 'list available commands',
    category: 'system',
    run: () => {
      const line = ([name, command]: [string, TerminalCommand]) => `  ${name.padEnd(10)} ${command.description}`
      const portfolio = Object.entries(COMMANDS).filter(([, c]) => c.category === 'portfolio').map(line)
      const system = Object.entries(COMMANDS).filter(([, c]) => c.category === 'system').map(line)
      return { lines: ['portfolio:', ...portfolio, '', 'system:', ...system] }
    },
  },
}

export const COMMAND_NAMES = Object.keys(COMMANDS)

const ALIAS_LOOKUP: Record<string, string> = {}
for (const [name, command] of Object.entries(COMMANDS)) {
  for (const alias of command.aliases ?? []) {
    ALIAS_LOOKUP[alias] = name
  }
}

export function resolveCommand(name: string): TerminalCommand | undefined {
  return COMMANDS[name] ?? (ALIAS_LOOKUP[name] ? COMMANDS[ALIAS_LOOKUP[name]] : undefined)
}
