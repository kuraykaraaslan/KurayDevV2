import { ReactNode } from 'react'

export type ViewMode = 'table' | 'grid'

export type SortDir = 'asc' | 'desc'
export type SortState = { key: string; dir: SortDir } | null

export interface ColumnDef<T> {
  key: string
  header: string
  accessor: (item: T, index?: number) => ReactNode
  className?: string
  onClick?: (item: T, index?: number) => void
  hideOnMobile?: boolean
  sortable?: boolean
  sortKey?: string
  sortValue?: (item: T) => string | number
}

export type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmButtonClassName?: string
}

export interface BulkAction<T> {
  label: string | ReactNode
  onClick: (items: T[]) => void | Promise<void>
  className?: string
}

export interface ActionButton<T> {
  label: string | ReactNode
  href?: (item: T) => string
  onClick?: (item: T, index?: number) => void | Promise<void>
  className?: string
  hideOnMobile?: boolean
  hidden?: (item: T) => boolean
  confirm?: string | ConfirmOptions
}

export interface GridItemRenderProps<T> {
  item: T
  index: number
  actions?: ActionButton<T>[]
  handleActionClick: (action: ActionButton<T>, item: T, index?: number) => Promise<void>
}

export interface TableContextValue<T> {
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
  setPageSize: (size: number) => void
  pageSizeOptions: number[]

  // Search
  search: string
  setSearch: (search: string) => void

  // Config
  columns: ColumnDef<T>[]
  actions?: ActionButton<T>[]
  idKey: keyof T

  // Mode
  isLocalMode: boolean

  // View Mode
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  gridItemRenderer?: (props: GridItemRenderProps<T>) => ReactNode
  gridClassName?: string

  // Selection
  selectedIds: Set<unknown>
  toggleSelect: (id: unknown, index?: number, shiftKey?: boolean) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  isAllSelected: boolean
  bulkActions?: BulkAction<T>[]

  // Column visibility
  hiddenColumns: Set<string>
  toggleColumnVisibility: (key: string) => void
  visibleColumns: ColumnDef<T>[]

  // Sort
  sort: SortState
  setSort: (sort: SortState) => void

  // Handlers
  handleActionClick: (action: ActionButton<T>, item: T, index?: number) => Promise<void>
  refetch: () => void
}

export interface TableProviderBaseProps<T> {
  children: ReactNode
  idKey: keyof T
  columns: ColumnDef<T>[]
  actions?: ActionButton<T>[]
  pageSize?: number
  pageSizeOptions?: number[]
  bulkActions?: BulkAction<T>[]
  onDataChange?: (data: T[]) => void
  defaultViewMode?: ViewMode
  gridItemRenderer?: (props: GridItemRenderProps<T>) => ReactNode
  gridClassName?: string
}

export interface TableProviderAPIProps<T> extends TableProviderBaseProps<T> {
  apiEndpoint: string
  dataKey: string
  additionalParams?: Record<string, string>
  localData?: never
}

export interface TableProviderLocalProps<T> extends TableProviderBaseProps<T> {
  localData: T[]
  apiEndpoint?: never
  dataKey?: never
  additionalParams?: never
}

export type TableProviderProps<T> = TableProviderAPIProps<T> | TableProviderLocalProps<T>
