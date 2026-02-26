'use client'

// Types
export type { ColumnDef, ActionButton, BulkAction, ConfirmOptions, ViewMode, GridItemRenderProps } from './core/types'

// Context & hook
export { useTableContext } from './core/TableContext'

// Provider
export { TableProvider } from './core/TableProvider'

// Components
export { default as Table } from './core/Table'
export { default as TableHeader } from './toolbar/TableToolbar'
export { default as TableBody } from './body'
export { default as TableFooter } from './footer'
export { default as ImageCell } from './table/ImageCell'

// Re-export for convenience
import Table from './core/Table'
import { TableProvider } from './core/TableProvider'
import TableHeader from './toolbar/TableToolbar'
import TableBody from './body'
import TableFooter from './footer'

export default Object.assign(Table, {
  Provider: TableProvider,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
})
