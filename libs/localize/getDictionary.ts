import 'server-only'

const enabledLanguages = (process.env.NEXT_PUBLIC_I18N_LANGUAGES ?? 'en')
  .split(',')
  .map((l) => l.trim().toLowerCase())
  .filter(Boolean)

async function loadDict(lang: string): Promise<Record<string, unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(`@/dictionaries/${lang}.json`)
    return (mod.default ?? mod) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function getDictionary(lang: string): Promise<Record<string, unknown>> {
  const resolved = enabledLanguages.includes(lang) ? lang : 'en'
  return loadDict(resolved)
}

export async function getPageMetadata(lang: string, page: string) {
  const dict = await getDictionary(lang)
  const meta = dict.metadata as Record<string, { title: string; description: string; keywords?: string[] }>
  return meta[page] ?? { title: '', description: '', keywords: [] }
}
