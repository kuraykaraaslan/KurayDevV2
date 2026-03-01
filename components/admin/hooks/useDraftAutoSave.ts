import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

type UseDraftAutoSaveOptions<T> = {
  storageKey: string
  id: string
  data: T
  loading: boolean
  onLoad: (draft: T) => void
}

export function useDraftAutoSave<T extends Record<string, any>>({
  storageKey,
  id,
  data,
  loading,
  onLoad,
}: UseDraftAutoSaveOptions<T>) {
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  const clearAutoSave = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      delete parsed[id]
      localStorage.setItem(storageKey, JSON.stringify(parsed))
    } catch {}
  }

  // Load draft on mount (runs once)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const draft = JSON.parse(raw)[id]
      if (!draft) return
      onLoadRef.current(draft)
      toast.info('Draft loaded from browser')
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save draft whenever data changes (serialized comparison)
  const serialized = JSON.stringify(data)
  useEffect(() => {
    if (loading) return
    try {
      const raw = localStorage.getItem(storageKey)
      let parsed: Record<string, any> = {}
      try { parsed = raw ? JSON.parse(raw) : {} } catch { parsed = {} }
      parsed[id] = data
      localStorage.setItem(storageKey, JSON.stringify(parsed))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, serialized])

  return { clearAutoSave }
}
