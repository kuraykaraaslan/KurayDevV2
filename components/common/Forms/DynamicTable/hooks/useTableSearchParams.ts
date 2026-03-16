'use client'
import { useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { SortState } from '../core/types'

const PARAM_PAGE = 'page'
const PARAM_PAGE_SIZE = 'pageSize'
const PARAM_SEARCH = 'search'
const PARAM_SORT_KEY = 'sortKey'
const PARAM_SORT_DIR = 'sortDir'

export interface TableSearchParamState {
  page: number
  pageSize: number
  search: string
  sort: SortState
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (search: string) => void
  setSort: (sort: SortState) => void
}

/**
 * URL search param–backed state for DynamicTable.
 * Pass the returned object to <TableProvider externalState={...} />.
 *
 * Requires a Suspense boundary around the consuming component
 * (standard Next.js requirement when using useSearchParams).
 *
 * @param defaultPageSize - Fallback page size when the param is absent (default: 10)
 */
export function useTableSearchParams(defaultPageSize = 10): TableSearchParamState {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const page = Number(searchParams.get(PARAM_PAGE) ?? 0)
  const pageSize = Number(searchParams.get(PARAM_PAGE_SIZE) ?? defaultPageSize)
  const search = searchParams.get(PARAM_SEARCH) ?? ''

  const sortKey = searchParams.get(PARAM_SORT_KEY)
  const sortDir = searchParams.get(PARAM_SORT_DIR) as 'asc' | 'desc' | null
  // useMemo keeps the sort object reference stable across renders when the values haven't changed,
  // preventing unnecessary fetchData re-runs in TableProvider.
  const sort: SortState = useMemo(
    () => (sortKey && sortDir ? { key: sortKey, dir: sortDir } : null),
    [sortKey, sortDir],
  )

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const setPage = useCallback(
    (p: number) => updateParams({ [PARAM_PAGE]: String(p) }),
    [updateParams],
  )

  const setPageSize = useCallback(
    (s: number) => updateParams({ [PARAM_PAGE_SIZE]: String(s), [PARAM_PAGE]: '0' }),
    [updateParams],
  )

  const setSearch = useCallback(
    (s: string) => updateParams({ [PARAM_SEARCH]: s || null, [PARAM_PAGE]: '0' }),
    [updateParams],
  )

  const setSort = useCallback(
    (s: SortState) => {
      if (s) {
        updateParams({ [PARAM_SORT_KEY]: s.key, [PARAM_SORT_DIR]: s.dir })
      } else {
        updateParams({ [PARAM_SORT_KEY]: null, [PARAM_SORT_DIR]: null })
      }
    },
    [updateParams],
  )

  return { page, pageSize, search, sort, setPage, setPageSize, setSearch, setSort }
}
