'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '@/libs/axios'
import { HeadlessModal } from '@/components/admin/UI/Modal'
import { TableContext } from './TableContext'
import { useTableSearchParams } from '../hooks/useTableSearchParams'
import type {
  ActionButton,
  ConfirmOptions,
  SortState,
  TableProviderProps,
  TableProviderAPIProps,
  TableProviderLocalProps,
  TableContextValue,
} from './types'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function TableProvider<T extends Record<string, unknown>>({
  children,
  idKey,
  columns,
  actions,
  bulkActions,
  pageSize: initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onDataChange,
  defaultViewMode = 'table',
  gridItemRenderer,
  gridClassName,
  ignoreSearchParams = false,
  ...rest
}: TableProviderProps<T>) {
  const { t } = useTranslation()
  const isLocalMode = 'localData' in rest && rest.localData !== undefined

  // URL search params — always called (hooks must not be conditional)
  const urlState = useTableSearchParams(initialPageSize)

  // Local state — used when ignoreSearchParams=true
  const [localSearch, setLocalSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState(defaultViewMode)
  const [data, setData] = useState<T[]>(
    isLocalMode ? (rest as TableProviderLocalProps<T>).localData : []
  )
  const [localPage, setLocalPage] = useState(0)
  const [localPageSize, setLocalPageSizeState] = useState(initialPageSize)

  const setLocalPageSize = useCallback((size: number) => {
    setLocalPageSizeState(size)
    setLocalPage(0)
  }, [])
  const [total, setTotal] = useState(
    isLocalMode ? (rest as TableProviderLocalProps<T>).localData.length : 0
  )
  const [loading, setLoading] = useState(false)
  const [localSort, setLocalSort] = useState<SortState>(null)

  // Resolve: use URL state unless ignoreSearchParams=true
  const page = ignoreSearchParams ? localPage : urlState.page
  const pageSize = ignoreSearchParams ? localPageSize : urlState.pageSize
  const search = ignoreSearchParams ? localSearch : urlState.search
  const sort = ignoreSearchParams ? localSort : urlState.sort

  const setPage = useCallback(
    (p: number) => {
      if (ignoreSearchParams) setLocalPage(p)
      else urlState.setPage(p)
    },
    [ignoreSearchParams, urlState.setPage],
  )
  const setPageSize = useCallback(
    (size: number) => {
      if (ignoreSearchParams) setLocalPageSize(size)
      else urlState.setPageSize(size)
    },
    [ignoreSearchParams, setLocalPageSize, urlState.setPageSize],
  )
  const setSearch = useCallback(
    (s: string) => {
      if (ignoreSearchParams) setLocalSearch(s)
      else urlState.setSearch(s)
    },
    [ignoreSearchParams, urlState.setSearch],
  )
  const setSort = useCallback(
    (s: SortState) => {
      if (ignoreSearchParams) setLocalSort(s)
      else urlState.setSort(s)
    },
    [ignoreSearchParams, urlState.setSort],
  )
  const [selectedIds, setSelectedIds] = useState<Set<unknown>>(new Set())
  const lastSelectedIndexRef = useRef<number | null>(null)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [confirmPending, setConfirmPending] = useState<{
    action: ActionButton<T>
    item: T
    index?: number
  } | null>(null)

  // Debounce search — reset page on change (URL mode: setSearch already resets page via URL)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      if (ignoreSearchParams) setPage(0)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Sync local data when it changes
  useEffect(() => {
    if (isLocalMode) {
      const localData = (rest as TableProviderLocalProps<T>).localData
      setData(localData)
      setTotal(localData.length)
    }
  }, [isLocalMode ? JSON.stringify((rest as TableProviderLocalProps<T>).localData) : null])

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(() => {
    // Abort any in-flight request before starting a new one
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const { apiEndpoint, dataKey, additionalParams = {} } = rest as TableProviderAPIProps<T>
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search: debouncedSearch,
      ...additionalParams,
      ...(sort ? { sortKey: sort.key, sortDir: sort.dir } : {}),
    })

    setLoading(true)
    axiosInstance
      .get(`${apiEndpoint}?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        const newData = response.data[dataKey]
        setData(newData)
        setTotal(response.data.total)
        onDataChange?.(newData)
      })
      .catch((error) => {
        // Ignore cancellation errors from AbortController
        if (error?.code !== 'ERR_CANCELED' && error?.name !== 'CanceledError') {
          console.error(error)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
  }, [page, pageSize, debouncedSearch, sort, isLocalMode ? null : JSON.stringify(rest)])

  useEffect(() => {
    if (!isLocalMode) {
      fetchData()
    }
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchData, isLocalMode])

  const executeAction = useCallback(
    async (action: ActionButton<T>, item: T, index?: number) => {
      if (action.onClick) {
        await action.onClick(item, index)
        if (!isLocalMode) {
          setData((prev) => prev.filter((d) => d[idKey] !== item[idKey]))
          setTotal((prev) => prev - 1)
        }
      }
    },
    [idKey, isLocalMode]
  )

  const handleActionClick = async (action: ActionButton<T>, item: T, index?: number) => {
    if (!action.onClick) return
    if (action.confirm) {
      setConfirmPending({ action, item, index })
      return
    }
    await executeAction(action, item, index)
  }

  const handleConfirm = useCallback(async () => {
    if (!confirmPending) return
    const { action, item, index } = confirmPending
    setConfirmPending(null)
    await executeAction(action, item, index)
  }, [confirmPending, executeAction])

  // Clear selection and last index when page data changes
  useEffect(() => {
    setSelectedIds(new Set())
    lastSelectedIndexRef.current = null
  }, [data])

  const toggleSelect = useCallback(
    (id: unknown, index?: number, shiftKey = false) => {
      if (shiftKey && index !== undefined && lastSelectedIndexRef.current !== null) {
        const start = Math.min(lastSelectedIndexRef.current, index)
        const end = Math.max(lastSelectedIndexRef.current, index)
        const rangeIds = data.slice(start, end + 1).map((item) => item[idKey])
        setSelectedIds((prev) => {
          const next = new Set(prev)
          rangeIds.forEach((rid) => next.add(rid))
          return next
        })
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
        if (index !== undefined) lastSelectedIndexRef.current = index
      }
    },
    [data, idKey]
  )

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = data.map((item) => item[idKey])
      const allSelected = allIds.every((id) => prev.has(id))
      return allSelected ? new Set() : new Set(allIds)
    })
  }, [data, idKey])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const toggleColumnVisibility = useCallback((key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col.key)),
    [columns, hiddenColumns]
  )

  const isAllSelected = useMemo(
    () => data.length > 0 && data.every((item) => selectedIds.has(item[idKey])),
    [data, selectedIds, idKey]
  )

  const sortedData = useMemo(() => {
    if (!isLocalMode || !sort) return data
    const col = columns.find((c) => (c.sortKey ?? c.key) === sort.key)
    if (!col) return data
    return [...data].sort((a, b) => {
      const aVal = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[col.key]
      const bVal = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[col.key]
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort, isLocalMode, columns])

  const confirmOptions: ConfirmOptions =
    typeof confirmPending?.action.confirm === 'string'
      ? { description: confirmPending.action.confirm }
      : (confirmPending?.action.confirm ?? {})

  const value: TableContextValue<T> = {
    data: isLocalMode ? sortedData : data,
    setData,
    loading,
    total,
    setTotal,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    search,
    setSearch,
    columns,
    actions,
    idKey,
    isLocalMode,
    viewMode,
    setViewMode,
    gridItemRenderer,
    gridClassName,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    bulkActions,
    hiddenColumns,
    toggleColumnVisibility,
    visibleColumns,
    sort,
    setSort,
    handleActionClick,
    refetch: fetchData,
  }

  return (
    <TableContext.Provider value={value}>
      {children}
      <HeadlessModal
        open={!!confirmPending}
        onClose={() => setConfirmPending(null)}
        title={confirmOptions.title ?? t('common.confirm_dialog.title')}
        description={confirmOptions.description ?? t('common.confirm_dialog.description')}
        size="sm"
        showClose={false}
        closeOnBackdrop
      >
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setConfirmPending(null)}
          >
            {confirmOptions.cancelText ?? t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${confirmOptions.confirmButtonClassName ?? 'btn-error'}`}
            onClick={handleConfirm}
          >
            {confirmOptions.confirmText ?? t('common.confirm')}
          </button>
        </div>
      </HeadlessModal>
    </TableContext.Provider>
  )
}
