'use client'
import { useTranslation } from 'react-i18next'
import { useTableContext } from '../core/TableContext'
import TableGrid from '../grid/TableGrid'
import TableView from '../table/TableView'
import BulkActionsBar from '../table/BulkActionsBar'

interface TableBodyProps {
  className?: string
  emptyText?: string
}

function TableBody({ className = '', emptyText }: TableBodyProps) {
  const { t } = useTranslation()
  const { data, loading, viewMode } = useTableContext()

  return (
    <>
      <BulkActionsBar />
      {loading ? (
        <div className={`w-full bg-base-200 mt-4 rounded-lg min-h-[400px] flex items-center justify-center ${className}`}>
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className={`w-full bg-base-200 mt-4 rounded-lg min-h-[400px] flex items-center justify-center ${className}`}>
          <p className="text-base-content/50">{emptyText ? t(emptyText) : t('common.no_data')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <TableGrid className={className} />
      ) : (
        <TableView className={className} />
      )}
    </>
  )
}

export default TableBody
