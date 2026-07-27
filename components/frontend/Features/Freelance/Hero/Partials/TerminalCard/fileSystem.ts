import type { FsDirectory, FsMutationResult, FsNode } from './types'

export function createInitialFs(): FsDirectory {
  return {
    type: 'dir',
    name: '~',
    children: {
      'about.md': {
        type: 'file',
        name: 'about.md',
        content: [
          'Kuray Karaaslan — software architect & product engineer.',
          'Building production-grade SaaS, IoT, BIM, and real-time platforms.',
        ],
      },
      'skills.txt': {
        type: 'file',
        name: 'skills.txt',
        content: [
          'foundations: clean code, authentication & security',
          'backend: rest api design, sql data modeling, multi-tenant saas, caching (redis), payment systems',
          'delivery: testing & ci/cd, performance optimization, cloud infrastructure, event-driven architecture, domain-driven design',
        ],
      },
      'domains.txt': {
        type: 'file',
        name: 'domains.txt',
        content: ['saas · iot · bim · real-time'],
      },
      'contact.md': {
        type: 'file',
        name: 'contact.md',
        content: ["run 'open contact' to jump to the contact form, or 'open github' to reach out directly."],
      },
      'social.txt': {
        type: 'file',
        name: 'social.txt',
        content: [
          'github    github.com/kuraykaraaslan',
          'linkedin  linkedin.com/in/kuraykaraaslan',
          'twitter   twitter.com/kuraykaraaslan',
          'telegram  t.me/kuraykaraaslan',
        ],
      },
      projects: {
        type: 'dir',
        name: 'projects',
        children: {
          'saas.md': {
            type: 'file',
            name: 'saas.md',
            content: ['multi-tenant SaaS platforms — architecture, billing, and scale.'],
          },
          'iot.md': {
            type: 'file',
            name: 'iot.md',
            content: ['IoT platforms — device fleets, telemetry, and real-time pipelines.'],
          },
          'bim.md': {
            type: 'file',
            name: 'bim.md',
            content: ['BIM automation — tooling for construction & engineering workflows.'],
          },
        },
      },
    },
  }
}

function segmentsOf(path: string): string[] {
  return path.replace(/^~\/?/, '').split('/').filter(Boolean)
}

// '~' and '/' prefixed inputs resolve from home; '..' past home is absorbed
// rather than modeling anything above the fake root.
export function resolvePath(cwd: string, input: string): string {
  if (!input || input === '.') return cwd

  const isAbsolute = input.startsWith('~') || input.startsWith('/')
  const stack = isAbsolute ? [] : segmentsOf(cwd)
  const rest = isAbsolute ? input.replace(/^~/, '').replace(/^\//, '') : input

  for (const part of rest.split('/').filter(Boolean)) {
    if (part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }

  return stack.length === 0 ? '~' : `~/${stack.join('/')}`
}

export function getNode(root: FsDirectory, path: string): FsNode | undefined {
  let current: FsNode = root

  for (const segment of segmentsOf(path)) {
    if (current.type !== 'dir') return undefined
    const next: FsNode | undefined = current.children[segment]
    if (!next) return undefined
    current = next
  }

  return current
}

export function listDir(dir: FsDirectory): FsNode[] {
  return Object.values(dir.children).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function formatLsLine(node: FsNode): string {
  return node.type === 'dir' ? `${node.name}/` : node.name
}

function updateDir(
  root: FsDirectory,
  dirPath: string,
  updater: (children: Record<string, FsNode>) => Record<string, FsNode>
): FsDirectory {
  function recurse(node: FsDirectory, remaining: string[]): FsDirectory {
    if (remaining.length === 0) return { ...node, children: updater(node.children) }

    const [head, ...tail] = remaining
    const child = node.children[head]
    if (!child || child.type !== 'dir') return node

    return { ...node, children: { ...node.children, [head]: recurse(child, tail) } }
  }

  return recurse(root, segmentsOf(dirPath))
}

export function mkdir(root: FsDirectory, cwd: string, name: string): FsMutationResult {
  if (!name) return { ok: false, error: 'mkdir: missing operand' }

  const parent = getNode(root, cwd)
  if (!parent || parent.type !== 'dir') {
    return { ok: false, error: `mkdir: cannot create directory '${name}': No such file or directory` }
  }
  if (parent.children[name]) {
    return { ok: false, error: `mkdir: cannot create directory '${name}': File exists` }
  }

  const fs = updateDir(root, cwd, (children) => ({
    ...children,
    [name]: { type: 'dir', name, children: {} },
  }))

  return { ok: true, fs }
}

export function touch(root: FsDirectory, cwd: string, name: string): FsMutationResult {
  if (!name) return { ok: false, error: 'touch: missing file operand' }

  const parent = getNode(root, cwd)
  if (!parent || parent.type !== 'dir') {
    return { ok: false, error: `touch: cannot touch '${name}': No such file or directory` }
  }
  if (parent.children[name]) return { ok: true, fs: root }

  const fs = updateDir(root, cwd, (children) => ({
    ...children,
    [name]: { type: 'file', name, content: [] },
  }))

  return { ok: true, fs }
}

export function removeFile(root: FsDirectory, cwd: string, name: string): FsMutationResult {
  if (!name) return { ok: false, error: 'rm: missing operand' }

  const parent = getNode(root, cwd)
  if (!parent || parent.type !== 'dir') {
    return { ok: false, error: `rm: cannot remove '${name}': No such file or directory` }
  }

  const target = parent.children[name]
  if (!target) return { ok: false, error: `rm: cannot remove '${name}': No such file or directory` }
  if (target.type === 'dir') return { ok: false, error: `rm: cannot remove '${name}': Is a directory` }

  const fs = updateDir(root, cwd, (children) =>
    Object.fromEntries(Object.entries(children).filter(([key]) => key !== name))
  )

  return { ok: true, fs }
}
