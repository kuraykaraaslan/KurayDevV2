'use client'
import { useTranslation } from 'react-i18next'
import { useTableContext } from './TableContext'
import Link from 'next/link'

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
}: TableHeaderProps) => {
  const { t } = useTranslation()
  const { search, setSearch } = useTableContext()

  return (
    <div
      className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${className}`}
    >
      <h1 className={`text-2xl font-bold ${titleTextClassName}`}>{t(title)}</h1>
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <input
          type="text"
          placeholder={t(searchPlaceholder)}
          className={`input input-bordered w-full md:w-64 max-w-xs mr-2 ${searchClassName}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
  )
}

export default TableHeader
