'use client'

// Context & Provider
export { TableProvider, useTableContext } from './TableContext'
export type { ColumnDef, ActionButton } from './TableContext'

// Components
export { default as Table } from './Table'
export { default as TableHeader } from './TableHead'
export { default as TableBody } from './TableBody'
export { default as TableFooter } from './TableFooter'
export { default as ImageCell } from './ImageCell'

// Re-export for convenience
import Table from './Table'
import { TableProvider } from './TableContext'
import TableHeader from './TableHead'
import TableBody from './TableBody'
import TableFooter from './TableFooter'

export default Object.assign(Table, {
  Provider: TableProvider,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
})
