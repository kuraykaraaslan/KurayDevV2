'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '@/libs/axios'
import { HeadlessModal } from '@/components/admin/UI/Modal'
import { TableContext } from './TableContext'
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
  pageSize: initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onDataChange,
  defaultViewMode = 'table',
  gridItemRenderer,
  gridClassName,
  ...rest
}: TableProviderProps<T>) {
  const { t } = useTranslation()
  const isLocalMode = 'localData' in rest && rest.localData !== undefined

  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState(defaultViewMode)
  const [data, setData] = useState<T[]>(
    isLocalMode ? (rest as TableProviderLocalProps<T>).localData : []
  )
  const [page, setPage] = useState(0)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(0)
  }, [])
  const [total, setTotal] = useState(
    isLocalMode ? (rest as TableProviderLocalProps<T>).localData.length : 0
  )
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<SortState>(null)
  const [confirmPending, setConfirmPending] = useState<{
    action: ActionButton<T>
    item: T
    index?: number
  } | null>(null)

  // Sync local data when it changes
  useEffect(() => {
    if (isLocalMode) {
      const localData = (rest as TableProviderLocalProps<T>).localData
      setData(localData)
      setTotal(localData.length)
    }
  }, [isLocalMode ? JSON.stringify((rest as TableProviderLocalProps<T>).localData) : null])

  const fetchData = useCallback(async () => {
    if (isLocalMode) return

    const { apiEndpoint, dataKey, additionalParams = {} } = rest as TableProviderAPIProps<T>

    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search,
      ...additionalParams,
      ...(sort ? { sortKey: sort.key, sortDir: sort.dir } : {}),
    })

    try {
      const response = await axiosInstance.get(`${apiEndpoint}?${params.toString()}`)
      const newData = response.data[dataKey]
      setData(newData)
      setTotal(response.data.total)
      onDataChange?.(newData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, sort, isLocalMode ? null : JSON.stringify(rest)])

  useEffect(() => {
    if (!isLocalMode) {
      fetchData()
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
