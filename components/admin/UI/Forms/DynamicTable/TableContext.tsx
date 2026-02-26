'use client'
import { createContext, useContext } from 'react'
import type { TableContextValue } from './types'

const TableContext = createContext<TableContextValue<any> | null>(null)

export function useTableContext<T>() {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('Table components must be used within a TableProvider')
  }
  return context as TableContextValue<T>
}

export { TableContext }
