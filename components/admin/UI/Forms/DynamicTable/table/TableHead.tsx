import { useTranslation } from 'react-i18next'
import { useTableContext } from '../core/TableContext'
import SortIcon from './SortIcon'
import type { ColumnDef } from '../core/types'

function TableHead() {
  const { t } = useTranslation()
  const { visibleColumns, actions, sort, setSort, bulkActions, isAllSelected, toggleSelectAll } =
    useTableContext()

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
        {bulkActions && bulkActions.length > 0 && (
          <th className="w-10">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isAllSelected}
              onChange={toggleSelectAll}
            />
          </th>
        )}
        {visibleColumns.map((col: ColumnDef<any>) => (
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

export default TableHead
