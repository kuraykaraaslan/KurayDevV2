import { useTranslation } from 'react-i18next'
import { useTableContext } from '../core/TableContext'

function BulkActionsBar() {
  const { t } = useTranslation()
  const { selectedIds, clearSelection, bulkActions, data, idKey } = useTableContext()

  if (!bulkActions?.length || selectedIds.size === 0) return null

  const selectedItems = data.filter((item) => selectedIds.has(item[idKey]))

  return (
    <div className="flex items-center gap-3 mt-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
      <span className="text-sm font-medium shrink-0">
        {t('common.selected', { count: selectedIds.size })}
      </span>
      <div className="flex gap-2 flex-1 flex-wrap">
        {bulkActions.map((action, i) => (
          <button
            key={i}
            className={`btn btn-sm ${action.className || 'btn-primary'}`}
            onClick={() => action.onClick(selectedItems)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button
        className="btn btn-ghost btn-sm shrink-0"
        onClick={clearSelection}
        aria-label="Clear selection"
      >
        ✕
      </button>
    </div>
  )
}

export default BulkActionsBar
