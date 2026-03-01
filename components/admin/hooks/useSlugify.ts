import { useEffect } from 'react'

type UseSlugifyOptions = {
  title: string
  mode: 'create' | 'edit'
  loading: boolean
  setSlug: (slug: string) => void
  /** Optional transform applied after base slugification. Use for suffixes etc. */
  transform?: (rawSlug: string) => string
}

const slugify = (text: string) =>
  text
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase()

export function useSlugify({ title, mode, loading, setSlug, transform }: UseSlugifyOptions) {
  useEffect(() => {
    if (mode === 'edit' || loading || !title) return
    const raw = slugify(title)
    setSlug(transform ? transform(raw) : raw)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, mode, loading])
}
