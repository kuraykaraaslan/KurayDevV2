'use client'
import { useTranslation } from 'react-i18next'
import { useTableContext } from './TableContext'

interface TableFooterProps {
  showingText?: string
  previousText?: string
  nextText?: string
  className?: string
}

const TableFooter = ({
  showingText = 'common.showing',
  previousText = 'common.previous',
  nextText = 'common.next',
  className = '',
}: TableFooterProps) => {
  const { t } = useTranslation()
  const { data, total, page, pageSize, setPage, setPageSize, pageSizeOptions } = useTableContext()

  const hasPrevious = page > 0
  const hasNext = (page + 1) * pageSize < total

  return (
    <div className={`flex justify-between items-center mt-4 ${className}`}>
      <span className="text-sm">{t(showingText, { count: data.length, total })}</span>
      <div className="flex items-center gap-2">
        <label className="text-sm text-base-content/60 hidden sm:inline">
          {t('common.per_page')}
        </label>
        <select
          className="select select-bordered select-sm"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <button
          onClick={() => setPage(page - 1)}
          disabled={!hasPrevious}
          className="btn btn-sm btn-secondary h-8"
        >
          {t(previousText)}
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasNext}
          className="btn btn-sm btn-secondary h-8"
        >
          {t(nextText)}
        </button>
      </div>
    </div>
  )
}

export default TableFooter
