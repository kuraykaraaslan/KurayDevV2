'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import axiosInstance from '@/libs/axios'

export interface ColumnDef<T> {
  key: string
  header: string
  accessor: (item: T, index?: number) => ReactNode
  className?: string
  onClick?: (item: T, index?: number) => void
}

export interface ActionButton<T> {
  label: string
  href?: (item: T) => string
  onClick?: (item: T, index?: number) => void | Promise<void>
  className?: string
  hideOnMobile?: boolean
}

interface TableContextValue<T> {
  // Data
  data: T[]
  setData: React.Dispatch<React.SetStateAction<T[]>>
  loading: boolean
  total: number
  setTotal: React.Dispatch<React.SetStateAction<number>>

  // Pagination
  page: number
  setPage: (page: number) => void
  pageSize: number

  // Search
  search: string
  setSearch: (search: string) => void

  // Config
  columns: ColumnDef<T>[]
  actions?: ActionButton<T>[]
  idKey: keyof T

  // Mode
  isLocalMode: boolean

  // Handlers
  handleActionClick: (action: ActionButton<T>, item: T, index?: number) => Promise<void>
  refetch: () => void
}

const TableContext = createContext<TableContextValue<any> | null>(null)

export function useTableContext<T>() {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('Table components must be used within a TableProvider')
  }
  return context as TableContextValue<T>
}

interface TableProviderBaseProps<T> {
  children: ReactNode
  idKey: keyof T
  columns: ColumnDef<T>[]
  actions?: ActionButton<T>[]
  pageSize?: number
  onDataChange?: (data: T[]) => void
}

interface TableProviderAPIProps<T> extends TableProviderBaseProps<T> {
  apiEndpoint: string
  dataKey: string
  additionalParams?: Record<string, string>
  // Local mode props should not be present
  localData?: never
}

interface TableProviderLocalProps<T> extends TableProviderBaseProps<T> {
  localData: T[]
  // API mode props should not be present
  apiEndpoint?: never
  dataKey?: never
  additionalParams?: never
}

type TableProviderProps<T> = TableProviderAPIProps<T> | TableProviderLocalProps<T>

export function TableProvider<T extends Record<string, unknown>>({
  children,
  idKey,
  columns,
  actions,
  pageSize: initialPageSize = 10,
  onDataChange,
  ...rest
}: TableProviderProps<T>) {
  const isLocalMode = 'localData' in rest && rest.localData !== undefined

  const [search, setSearch] = useState('')
  const [data, setData] = useState<T[]>(
    isLocalMode ? (rest as TableProviderLocalProps<T>).localData : []
  )
  const [page, setPage] = useState(0)
  const [pageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(
    isLocalMode ? (rest as TableProviderLocalProps<T>).localData.length : 0
  )
  const [loading, setLoading] = useState(false)

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
  }, [page, pageSize, search, isLocalMode ? null : JSON.stringify(rest)])

  useEffect(() => {
    if (!isLocalMode) {
      fetchData()
    }
  }, [fetchData, isLocalMode])

  const handleActionClick = async (action: ActionButton<T>, item: T, index?: number) => {
    if (action.onClick) {
      await action.onClick(item, index)
      // Only auto-remove in API mode
      if (!isLocalMode) {
        setData((prev) => prev.filter((d) => d[idKey] !== item[idKey]))
        setTotal((prev) => prev - 1)
      }
    }
  }

  const value: TableContextValue<T> = {
    data,
    setData,
    loading,
    total,
    setTotal,
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    columns,
    actions,
    idKey,
    isLocalMode,
    handleActionClick,
    refetch: fetchData,
  }

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}
