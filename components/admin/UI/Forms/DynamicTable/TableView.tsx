import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useTableContext } from './TableContext'
import SortIcon from './SortIcon'
import type { ActionButton, ColumnDef } from './types'

interface TableViewProps {
  className?: string
}

function TableHead() {
  const { t } = useTranslation()
  const { columns, actions, sort, setSort } = useTableContext()

  const handleSortClick = (col: ColumnDef<any>) => {
    const key = col.sortKey ?? col.key
    if (sort?.key === key) {
      setSort(sort.dir === 'asc' ? { key, dir: 'desc' } : null)
    } else {
      setSort({ key, dir: 'asc' })
    }
  }

  return (
    <thead className="bg-base-300 h-12">
      <tr className="h-12">
        {columns.map((col: ColumnDef<any>) => (
          <th
            key={col.key}
            className={[
              col.className || '',
              col.hideOnMobile ? 'hidden md:table-cell' : '',
              col.sortable ? 'cursor-pointer select-none group' : '',
            ].join(' ')}
            onClick={col.sortable ? () => handleSortClick(col) : undefined}
          >
            <span className="inline-flex items-center gap-1">
              {t(col.header)}
              {col.sortable && <SortIcon colKey={col.sortKey ?? col.key} sort={sort} />}
            </span>
          </th>
        ))}
        {actions && actions.length > 0 && <th>{t('common.action')}</th>}
      </tr>
    </thead>
  )
}

function TableRows() {
  const { t } = useTranslation()
  const { data, columns, actions, idKey, handleActionClick } = useTableContext()

  return (
    <tbody>
      {data.map((item: any, index: number) => (
        <tr key={String(item[idKey]) || index} className="h-12 hover:bg-primary hover:bg-opacity-10">
          {columns.map((col: ColumnDef<any>) => (
            <td
              key={col.key}
              className={`${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
              onClick={() => col.onClick?.(item, index)}
              style={{ cursor: col.onClick ? 'pointer' : 'default' }}
            >
              {col.accessor(item, index)}
            </td>
          ))}
          {actions && actions.length > 0 && (
            <td className="flex gap-2">
              {actions
                .filter((action: ActionButton<any>) => !action.hidden?.(item))
                .map((action: ActionButton<any>, i: number) =>
                  action.href ? (
                    <Link
                      key={i}
                      href={action.href(item)}
                      className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={i}
                      onClick={() => handleActionClick(action, item, index)}
                      className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                    >
                      {action.label}
                    </button>
                  )
                )}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  )
}

function TableView({ className = '' }: TableViewProps) {
  return (
    <div className={`overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px] ${className}`}>
      <table className="table">
        <TableHead />
        <TableRows />
      </table>
    </div>
  )
}

export default TableView
