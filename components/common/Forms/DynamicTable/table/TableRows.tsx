import { memo } from 'react'
import Link from '@/libs/i18n/Link'
import { useTranslation } from 'react-i18next'
import { useTableContext } from '../core/TableContext'
import type { ActionButton, ColumnDef } from '../core/types'

function TableRows() {
  const { t } = useTranslation()
  const { data, visibleColumns, actions, idKey, handleActionClick, bulkActions, selectedIds, toggleSelect } =
    useTableContext()

  return (
    <tbody>
      {data.map((item: any, index: number) => (
        <tr
          key={String(item[idKey]) || index}
          className={`h-12 hover:bg-primary/30 ${selectedIds.has(item[idKey]) ? 'bg-primary/5' : ''}`}
          onClick={(e) => {
            if ((e.ctrlKey || e.metaKey) && bulkActions?.length) {
              toggleSelect(item[idKey], index)
            }
          }}
        >
          {bulkActions && bulkActions.length > 0 && (
            <td>
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selectedIds.has(item[idKey])}
                onChange={() => {}}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelect(item[idKey], index, e.shiftKey)
                }}
              />
            </td>
          )}
          {visibleColumns.map((col: ColumnDef<any>) => (
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
                      title={action.tooltip}
                      className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                    >
                      {typeof action.label === 'string' ? t(action.label) : action.label}
                    </Link>
                  ) : (
                    <button
                      key={i}
                      onClick={() => handleActionClick(action, item, index)}
                      title={action.tooltip}
                      className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                    >
                      {typeof action.label === 'string' ? t(action.label) : action.label}
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

export default memo(TableRows)
