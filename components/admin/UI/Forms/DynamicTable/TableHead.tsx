'use client'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTableContext } from './TableContext'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTableCells, faGrip, faRefresh } from '@fortawesome/free-solid-svg-icons'

interface TableHeaderProps {
  title: string
  searchPlaceholder?: string
  buttonText?: string
  buttonLink?: string
  actionButtonText?: string
  actionButtonEvent?: () => void
  className?: string
  titleTextClassName?: string
  searchClassName?: string
  showViewToggle?: boolean
  showRefresh?: boolean
  toolbarContent?: ReactNode
  toolbarPosition?: 'before-search' | 'after-search' | 'below'
}

const TableHeader = ({
  title,
  searchPlaceholder = 'common.search',
  buttonText,
  buttonLink,
  actionButtonText,
  actionButtonEvent,
  className = '',
  titleTextClassName = '',
  searchClassName = '',
  showViewToggle = false,
  showRefresh = false,
  toolbarContent,
  toolbarPosition = 'after-search',
}: TableHeaderProps) => {
  const { t } = useTranslation()
  const { search, setSearch, viewMode, setViewMode, gridItemRenderer, refetch, loading } =
    useTableContext()

  const renderToolbarContent = () => toolbarContent

  return (
    <div className={`${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl font-bold ${titleTextClassName}`}>{t(title)}</h1>
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {toolbarPosition === 'before-search' && renderToolbarContent()}
          <input
            type="text"
            placeholder={t(searchPlaceholder)}
            className={`input input-bordered w-full md:w-64 max-w-xs ${searchClassName}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {toolbarPosition === 'after-search' && renderToolbarContent()}
          {showRefresh && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={refetch}
              disabled={loading}
              title={t('common.refresh')}
            >
              <FontAwesomeIcon icon={faRefresh} spin={loading} />
            </button>
          )}
          {showViewToggle && gridItemRenderer && (
            <div className="join">
              <button
                className={`join-item btn btn-sm ${viewMode === 'table' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('table')}
                title={t('common.table_view')}
              >
                <FontAwesomeIcon icon={faTableCells} />
              </button>
              <button
                className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
                title={t('common.grid_view')}
              >
                <FontAwesomeIcon icon={faGrip} />
              </button>
            </div>
          )}
          {actionButtonText && actionButtonEvent && (
            <button onClick={actionButtonEvent} className="btn btn-secondary">
              {t(actionButtonText)}
            </button>
          )}
          {buttonText && buttonLink && (
            <Link href={buttonLink} className="btn btn-primary">
              {t(buttonText)}
            </Link>
          )}
        </div>
      </div>
      {toolbarPosition === 'below' && toolbarContent && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">{renderToolbarContent()}</div>
      )}
    </div>
  )
}

export default TableHeader
