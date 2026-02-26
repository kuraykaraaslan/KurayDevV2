'use client'
import { useTranslation } from 'react-i18next'
import { useTableContext } from './TableContext'
import TableGrid from './TableGrid'
import TableView from './TableView'

interface TableBodyProps {
  className?: string
  emptyText?: string
}

function TableBody({ className = '', emptyText }: TableBodyProps) {
  const { t } = useTranslation()
  const { data, loading, viewMode } = useTableContext()

  if (loading) {
    return (
      <div className={`w-full bg-base-200 mt-4 rounded-lg min-h-[400px] flex items-center justify-center ${className}`}>
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`w-full bg-base-200 mt-4 rounded-lg min-h-[400px] flex items-center justify-center ${className}`}>
        <p className="text-base-content/50">{emptyText ? t(emptyText) : t('common.no_data')}</p>
      </div>
    )
  }

  if (viewMode === 'grid') return <TableGrid className={className} />

  return <TableView className={className} />
}

export default TableBody
