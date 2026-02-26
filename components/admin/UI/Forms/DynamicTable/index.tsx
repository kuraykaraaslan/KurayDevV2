'use client'

// Types
export type { ColumnDef, ActionButton, ConfirmOptions, ViewMode, GridItemRenderProps } from './types'

// Context & hook
export { useTableContext } from './TableContext'

// Provider
export { TableProvider } from './TableProvider'

// Components
export { default as Table } from './Table'
export { default as TableHeader } from './TableHead'
export { default as TableBody } from './TableBody'
export { default as TableFooter } from './TableFooter'
export { default as ImageCell } from './ImageCell'

// Re-export for convenience
import Table from './Table'
import { TableProvider } from './TableProvider'
import TableHeader from './TableHead'
import TableBody from './TableBody'
import TableFooter from './TableFooter'

export default Object.assign(Table, {
  Provider: TableProvider,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
})
