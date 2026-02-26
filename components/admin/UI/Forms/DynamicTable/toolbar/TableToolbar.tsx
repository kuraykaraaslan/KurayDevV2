'use client'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'
import { useTableContext } from '../core/TableContext'
import SearchInput from './SearchInput'
import ViewToggle from './ViewToggle'
import ColumnToggle from './ColumnToggle'

interface TableToolbarProps {
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
  showColumnToggle?: boolean
  toolbarContent?: ReactNode
  toolbarPosition?: 'before-search' | 'after-search' | 'below'
}

function TableToolbar({
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
  showColumnToggle = false,
  toolbarContent,
  toolbarPosition = 'after-search',
}: TableToolbarProps) {
  const { t } = useTranslation()
  const { refetch, loading } = useTableContext()

  return (
    <div className={`${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`text-2xl font-bold ${titleTextClassName}`}>{t(title)}</h1>
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {toolbarPosition === 'before-search' && toolbarContent}
          <SearchInput placeholder={searchPlaceholder} className={searchClassName} />
          {toolbarPosition === 'after-search' && toolbarContent}
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
          {showColumnToggle && <ColumnToggle />}
          {showViewToggle && <ViewToggle />}
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
        <div className="mt-4 flex flex-wrap gap-2 items-center">{toolbarContent}</div>
      )}
    </div>
  )
}

export default TableToolbar
