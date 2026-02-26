import 'server-only'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const load = (p: Promise<{ default: any }>) => p.then((m) => m.default as Record<string, unknown>)

const dictionaries: Record<string, () => Promise<Record<string, unknown>>> = {
  de: () => load(import('@/dictionaries/de.json')),
  el: () => load(import('@/dictionaries/el.json')),
  en: () => load(import('@/dictionaries/en.json')),
  et: () => load(import('@/dictionaries/et.json')),
  he: () => load(import('@/dictionaries/he.json')),
  mt: () => load(import('@/dictionaries/mt.json')),
  nl: () => load(import('@/dictionaries/nl.json')),
  th: () => load(import('@/dictionaries/th.json')),
  tr: () => load(import('@/dictionaries/tr.json')),
  uk: () => load(import('@/dictionaries/uk.json')),
}

export async function getDictionary(lang: string) {
  return (dictionaries[lang] ?? dictionaries['en'])()
}

export async function getPageMetadata(lang: string, page: string) {
  const dict = await getDictionary(lang)
  const meta = dict.metadata as Record<string, { title: string; description: string; keywords?: string[] }>
  return meta[page] ?? { title: '', description: '', keywords: [] }
}
