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
  const { data, total, page, pageSize, setPage } = useTableContext()

  const hasPrevious = page > 0
  const hasNext = (page + 1) * pageSize < total

  return (
    <div className={`flex justify-between items-center mt-4 ${className}`}>
      <div>
        <span>{t(showingText, { count: data.length, total })}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={!hasPrevious}
          className="btn btn-sm btn-secondary h-12"
        >
          {t(previousText)}
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasNext}
          className="btn btn-sm btn-secondary h-12"
        >
          {t(nextText)}
        </button>
      </div>
    </div>
  )
}

export default TableFooter
